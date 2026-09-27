import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { platform, arch, release } from "node:os";

type Status = "PASS" | "FAIL" | "NOT_VERIFIED" | "BLOCKED";
type Check = { status: Status; detail: string; evidence?: string[] };

const args = process.argv.slice(2);
const command = args[0] ?? "discover";

function value(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
function has(flag: string): boolean { return args.includes(flag); }

function run(program: string, argv: string[] = []) {
  try {
    const stdout = execFileSync(program, argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, stdout: stdout.trim(), stderr: "", code: 0 };
  } catch (error: any) {
    return {
      ok: false,
      stdout: String(error?.stdout ?? "").trim(),
      stderr: String(error?.stderr ?? error?.message ?? "").trim(),
      code: Number(error?.status ?? 1)
    };
  }
}
function toolVersion(program: string, argv = ["--version"]): string | null {
  const r = run(program, argv);
  return r.ok ? (r.stdout || r.stderr || "available") : null;
}
function output(data: unknown) { console.log(JSON.stringify(data, null, 2)); }

function discover() {
  output({
    command: "discover",
    framework: value("--framework") ?? null,
    environment: {
      os: platform(),
      arch: arch(),
      release: release(),
      android_api: process.env.ANDROID_API_LEVEL ?? null,
      android_release: process.env.ANDROID_VERSION ?? null,
      termux: Boolean(process.env.TERMUX_VERSION || process.env.PREFIX?.includes("/com.termux/")),
      proot: Boolean(process.env.PROOT_TMP_DIR || process.env.PROOT_VERSION),
      model: process.env.ANDROID_MODEL ?? null
    },
    tools: {
      node: process.version,
      pnpm: toolVersion("pnpm"),
      java: toolVersion("java"),
      gradle: toolVersion("gradle"),
      adb: toolVersion("adb"),
      apksigner: toolVersion("apksigner"),
      pm: toolVersion("pm", ["path", "android"]),
      am: toolVersion("am", ["start", "-W", "android.intent.action.MAIN"])
    },
    paths: {
      android_home: process.env.ANDROID_HOME ?? null,
      android_sdk_root: process.env.ANDROID_SDK_ROOT ?? null,
      java_home: process.env.JAVA_HOME ?? null
    }
  });
}

function validate() {
  const framework = value("--framework") ?? "unknown";
  const apk = value("--apk");
  const pkg = value("--package");
  const explicitActivity = value("--activity");
  const out = value("--output");

  if (!apk || !pkg) {
    console.error("validate requires --apk and --package");
    process.exitCode = 2;
    return;
  }

  const checks: Record<string, Check> = {};
  const fileExists = existsSync(apk);

  checks.APK_VALIDATE = fileExists
    ? { status: "PASS", detail: "APK exists", evidence: [apk] }
    : { status: "FAIL", detail: "APK does not exist", evidence: [apk] };

  if (fileExists) {
    const sha256 = createHash("sha256").update(readFileSync(apk)).digest("hex");
    checks.APK_VALIDATE.evidence?.push("sha256:" + sha256);
    const signer = run("apksigner", ["verify", "--verbose", apk]);
    if (signer.ok) {
      checks.APK_VALIDATE.detail += "; apksigner verify PASS";
    } else if (toolVersion("apksigner")) {
      checks.APK_VALIDATE.status = "FAIL";
      checks.APK_VALIDATE.detail += "; apksigner verification failed";
    } else {
      checks.APK_VALIDATE.detail += "; apksigner unavailable";
    }
  }

  let pmPath = run("pm", ["path", pkg]);
  checks.DEVICE = pmPath.ok
    ? { status: "PASS", detail: "Package is visible to Android package manager", evidence: [pmPath.stdout] }
    : { status: "NOT_VERIFIED", detail: "Package is not currently visible; install may be required", evidence: [pmPath.stderr] };

  if (has("--install") && fileExists) {
    const install = run("pm", ["install", "-r", apk]);
    checks.INSTALL = install.ok
      ? { status: "PASS", detail: install.stdout || "pm install completed" }
      : { status: "FAIL", detail: install.stderr || install.stdout || "pm install failed" };
    pmPath = run("pm", ["path", pkg]);
    checks.DEVICE = pmPath.ok
      ? { status: "PASS", detail: "Package is visible after install", evidence: [pmPath.stdout] }
      : { status: "FAIL", detail: "Package is not visible after install", evidence: [pmPath.stderr] };
  } else {
    checks.INSTALL = { status: "NOT_VERIFIED", detail: "Install was not requested; no install claim is made" };
  }

  const activityResult = explicitActivity
    ? { ok: true, stdout: explicitActivity, stderr: "", code: 0 }
    : run("cmd", ["package", "resolve-activity", "--brief", pkg]);
  const activity = explicitActivity ?? activityResult.stdout.split("\n").filter(Boolean).at(-1);

  if (!activity) {
    checks.RUNTIME = { status: "NOT_VERIFIED", detail: "Could not resolve launcher activity" };
  } else {
    const start = run("am", ["start", "-W", "-n", activity]);
    const launchText = (start.stdout + "\n" + start.stderr).trim();
    const launchFailedByOutput = /Error type \d+|Exception|does not exist|Unable to resolve/i.test(launchText);
    if (!start.ok || launchFailedByOutput) {
      checks.RUNTIME = {
        status: "FAIL",
        detail: launchText || "Activity launch failed",
        evidence: [activity]
      };
    } else {
      const pid = run("pidof", [pkg]);
      checks.RUNTIME = pid.ok
        ? { status: "PASS", detail: "Activity launch completed and process is observable", evidence: [activity, pid.stdout, launchText] }
        : { status: "PASS", detail: "Activity launch completed; process observation unavailable", evidence: [activity, launchText] };
    }
  }

  checks.FUNCTIONAL = {
    status: "NOT_VERIFIED",
    detail: "Launcher/process evidence does not prove UI or feature behavior; functional validation must be performed separately on the device."
  };

  const failed = Object.values(checks).some(c => c.status === "FAIL");
  const notVerified = Object.values(checks).some(c => c.status === "NOT_VERIFIED" || c.status === "BLOCKED");
  const result = {
    command: "validate",
    framework,
    strategy:
      framework === "react-native"
        ? "official-react-native-android"
        : framework === "flutter"
          ? "official-flutter-android"
          : undefined,
    environment: {
      os: platform(),
      arch: arch(),
      termux: Boolean(process.env.TERMUX_VERSION || process.env.PREFIX?.includes("/com.termux/")),
      proot: Boolean(process.env.PROOT_TMP_DIR || process.env.PROOT_VERSION)
    },
    apk: { path: apk, package: pkg },
    checks,
    overall_status: failed ? "FAIL" : notVerified ? "INCOMPLETE" : "PASS",
    generated_at: new Date().toISOString()
  };

  output(result);
  if (out) writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  if (failed) process.exitCode = 1;
}

if (command === "discover") discover();
else if (command === "validate") validate();
else {
  console.error("Unknown command: " + command + ". Use discover or validate.");
  process.exitCode = 2;
}
