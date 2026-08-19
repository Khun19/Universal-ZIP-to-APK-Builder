import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const command = process.env.BUILD_COMMAND ?? "./gradlew";
const args = (process.env.BUILD_ARGS ?? "assembleDebug --no-daemon --stacktrace").split(" ");
if (!existsSync("/workspace")) throw new Error("Build workspace is unavailable");
const child = spawn(command, args, { cwd: "/workspace", stdio: "inherit", env: { ...process.env, CI: "1" } });
child.on("exit", (code) => process.exit(code ?? 1));