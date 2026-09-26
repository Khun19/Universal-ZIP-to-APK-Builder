import { spawn, execFileSync } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ProjectAnalysis } from "@workspace/shared";
import { resolveAndroidToolchain } from "./toolchain.ts";
import { createIsolatedWorkspace, cleanupIsolatedWorkspace } from "./workspace.ts";

export interface BuildRequest {
  workspace: string;
  analysis: ProjectAnalysis;
  onLog: (line: string) => void;
  timeoutMs?: number;
  isolated?: boolean;
  keepWorkspace?: boolean;
}

export interface BuildResult {
  buildId: string;
  success: boolean;
  workspace: string;
  artifactPath?: string;
  artifactSize?: number;
  sha256?: string;
  exitCode: number | null;
  durationMs: number;
  logs: string[];
  error?: string;
}

export function commandFor(analysis: ProjectAnalysis): { command: string; args: string[] } {
  if (analysis.framework === "Native Android") {
    return { command: "./gradlew", args: ["assembleDebug", "--no-daemon", "--stacktrace"] };
  }
  if (analysis.framework === "Capacitor") {
    return { command: "sh", args: ["-lc", "npx cap sync android && cd android && ./gradlew assembleDebug --no-daemon --stacktrace"] };
  }
  return {
    command: "sh",
    args: ["-lc", "npm install --ignore-scripts && npm run build && npx cap add android && npx cap sync android && cd android && ./gradlew assembleDebug --no-daemon --stacktrace"],
  };
}

function findApk(root: string): string | undefined {
  const outputRoot = path.join(root, "app", "build", "outputs", "apk");
  if (!fs.existsSync(outputRoot)) return undefined;
  const queue = [outputRoot];
  const apks: string[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else if (entry.name.endsWith(".apk")) apks.push(full);
    }
  }
  return apks.find(file => /debug/i.test(file)) ?? apks[0];
}

function validateApk(filePath: string): { size: number; sha256: string } {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size <= 0) throw new Error("APK artifact is missing or empty");

  const entries = execFileSync("unzip", ["-Z1", filePath], {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });
  if (!entries.split(/\r?\n/).includes("AndroidManifest.xml")) {
    throw new Error("APK artifact is not valid: AndroidManifest.xml is missing");
  }

  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return { size: stat.size, sha256: hash.digest("hex") };
}

export async function runBuild(request: BuildRequest): Promise<BuildResult> {
  const startedAt = Date.now();
  const logs: string[] = [];
  let buildId = `build-${Date.now()}`;
  let buildWorkspace = request.workspace;
  let isolatedWorkspace: ReturnType<typeof createIsolatedWorkspace> | undefined;

  try {
    if (request.isolated !== false) {
      isolatedWorkspace = createIsolatedWorkspace(request.workspace);
      buildId = isolatedWorkspace.buildId;
      buildWorkspace = isolatedWorkspace.source;
      logs.push(`Isolated workspace created: ${buildWorkspace}`);
    }

    const tools = resolveAndroidToolchain();
    logs.push(`Toolchain: aapt2=${tools.aapt2 ?? "missing"}, zipalign=${tools.zipalign ?? "missing"}, apksigner=${tools.apksigner ?? "missing"}`);

    const { command, args } = commandFor(request.analysis);
    logs.push(`Executing: ${command} ${args.join(" ")}`);

    const env = {
      ...process.env,
      CI: "1",
      npm_config_fund: "false",
      npm_config_audit: "false",
    };

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: buildWorkspace,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`Build timed out after ${request.timeoutMs ?? 900000}ms`));
      }, request.timeoutMs ?? 900000);

      child.stdout.on("data", chunk => {
        const line = chunk.toString();
        logs.push(line);
        request.onLog(line);
      });
      child.stderr.on("data", chunk => {
        const line = chunk.toString();
        logs.push(line);
        request.onLog(line);
      });
      child.on("error", error => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("exit", code => {
        clearTimeout(timeout);
        resolve(code);
      });
    });

    if (exitCode !== 0) throw new Error(`Build exited with code ${exitCode}`);

    const apk = findApk(buildWorkspace);
    if (!apk) throw new Error("Build completed without producing an APK");

    const validated = validateApk(apk);
    logs.push(`Validated APK: ${apk} (${validated.size} bytes, SHA-256 ${validated.sha256})`);

    return {
      buildId,
      success: true,
      workspace: buildWorkspace,
      artifactPath: apk,
      artifactSize: validated.size,
      sha256: validated.sha256,
      exitCode: 0,
      durationMs: Date.now() - startedAt,
      logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logs.push(`Build failed: ${message}`);
    return {
      buildId,
      success: false,
      workspace: buildWorkspace,
      exitCode: null,
      durationMs: Date.now() - startedAt,
      logs,
      error: message,
    };
  } finally {
    if (isolatedWorkspace && !request.keepWorkspace) {
      cleanupIsolatedWorkspace(isolatedWorkspace);
    }
  }
}

export { resolveAndroidToolchain, createIsolatedWorkspace, cleanupIsolatedWorkspace };
