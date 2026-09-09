import { spawn } from "node:child_process";
import type { ProjectAnalysis } from "@workspace/shared";
export interface BuildRequest { workspace: string; analysis: ProjectAnalysis; onLog: (line: string) => void; timeoutMs?: number; }
export function commandFor(analysis: ProjectAnalysis): { command: string; args: string[] } {
  if (analysis.framework === "Native Android") return { command: "./gradlew", args: ["assembleDebug", "--no-daemon", "--stacktrace"] };
  if (analysis.framework === "Capacitor") return { command: "sh", args: ["-lc", "npx cap sync android && cd android && ./gradlew assembleDebug --no-daemon --stacktrace"] };
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