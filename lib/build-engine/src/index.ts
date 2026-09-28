import { spawn } from "node:child_process";
import type { ProjectAnalysis } from "@workspace/shared";
export interface BuildRequest { workspace: string; analysis: ProjectAnalysis; onLog: (line: string) => void; timeoutMs?: number; }
export function commandFor(analysis: ProjectAnalysis): { command: string; args: string[] } {
  if (analysis.framework === "Native Android") return { command: "./gradlew", args: ["assembleDebug", "--no-daemon", "--stacktrace"] };
  if (analysis.framework === "Capacitor") return { command: "sh", args: ["-lc", "npx cap sync android && cd android && ./gradlew assembleDebug --no-daemon --stacktrace"] };
  if (analysis.framework === "Flutter") {
    const script = [
      "set -eu",
      'NATIVE_FLUTTER="$(command -v flutter 2>/dev/null || true)"',
      "RUN_NATIVE=0",
      'if [ -n "$NATIVE_FLUTTER" ]; then FLUTTER_ROOT="$(CDPATH= cd -- "$(dirname -- "$NATIVE_FLUTTER")/.." && pwd)"; FLUTTER_DART="$FLUTTER_ROOT/bin/cache/dart-sdk/bin/dart"; if [ -x "$FLUTTER_DART" ] && "$FLUTTER_DART" --version >/dev/null 2>&1; then RUN_NATIVE=1; fi; fi',
      'if [ "$RUN_NATIVE" -eq 1 ]; then "$NATIVE_FLUTTER" pub get && "$NATIVE_FLUTTER" build apk --debug; exit 0; fi',
      'command -v proot-distro >/dev/null 2>&1 || { echo "No runnable native Flutter SDK and proot-distro is unavailable." >&2; exit 127; }',
      'PROOT_DISTRO="${FLUTTER_PROOT_DISTRO:-ubuntu}"',
      'PROOT_FLUTTER="${FLUTTER_PROOT_PATH:-/opt/flutter/bin/flutter}"',
      'PROOT_ANDROID_HOME="${FLUTTER_PROOT_ANDROID_HOME:-/opt/android-sdk}"',
      "proot-distro login \"$PROOT_DISTRO\" -- sh -lc 'export ANDROID_HOME=\"$1\"; export ANDROID_SDK_ROOT=\"$1\"; if command -v java >/dev/null 2>&1; then export JAVA_HOME=\"$(dirname \"$(dirname \"$(readlink -f \"$(command -v java)\")\")\")\"; fi; cd \"$2\"; \"$3\" pub get && \"$3\" build apk --debug' sh \"$PROOT_ANDROID_HOME\" \"$PWD\" \"$PROOT_FLUTTER\""
    ].join("; ");
    return { command: "sh", args: ["-lc", script] };
  }
  return { command: "sh", args: ["-lc", "npm install --ignore-scripts && npm run build && npx cap add android && npx cap sync android && cd android && ./gradlew assembleDebug --no-daemon --stacktrace"] };
}
export async function runBuild(request: BuildRequest): Promise<string> {
  const { command, args } = commandFor(request.analysis);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: request.workspace, env: { ...process.env, CI: "1", npm_config_fund: "false", npm_config_audit: "false" }, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`Build timed out after ${request.timeoutMs ?? 900000}ms`)); }, request.timeoutMs ?? 900000);
    child.stdout.on("data", (chunk: Buffer) => request.onLog(chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => request.onLog(chunk.toString()));
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("exit", (code) => { clearTimeout(timer); if (code === 0) resolve(request.workspace); else reject(new Error(`Build exited with code ${code}`)); });
  });
}