import { existsSync, readdirSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { join } from "node:path";

const cwd = "/workspace";
const mode = process.env.BUILD_MODE ?? (existsSync(join(cwd, "gradlew")) ? "native" : "web");
const run = (command, args, options = {}) => {
  const child = spawn(command, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1", npm_config_fund: "false", npm_config_audit: "false" }, ...options });
  return new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 1)));
};
const fail = (code) => { if (code !== 0) process.exit(code); };

if (mode === "native") {
  if (!existsSync(join(cwd, "gradlew"))) throw new Error("Native Android project does not include a Gradle wrapper");
  const tasks = spawnSync("./gradlew", ["tasks", "--all", "--no-daemon"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const output = `${tasks.stdout}\n${tasks.stderr}`;
  const task = output.includes("assembleDebug") ? "assembleDebug" : output.includes("assemble") ? "assemble" : null;
  if (!task) throw new Error("No supported assemble Gradle task was found");
  fail(await run("./gradlew", [task, "--no-daemon", "--stacktrace"]));
} else {
  if (!existsSync(join(cwd, "package.json"))) throw new Error("Web project does not include package.json");
  fail(await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"]));
  fail(await run("npm", ["run", "build"]));
  const webRoot = ["dist", "build", "www", "public"].find((directory) => existsSync(join(cwd, directory)));
  if (!webRoot) throw new Error("Could not detect production web output directory");
  fail(await run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "@capacitor/core", "@capacitor/cli", "@capacitor/android"]));
  if (!existsSync(join(cwd, "capacitor.config.ts")) && !existsSync(join(cwd, "capacitor.config.json"))) {
    const config = `import type { CapacitorConfig } from '@capacitor/cli';\nconst config: CapacitorConfig = { appId: 'com.universalbuilder.generated', appName: 'Generated App', webDir: '${webRoot}' };\nexport default config;\n`;
    const { writeFileSync } = await import("node:fs");
    writeFileSync(join(cwd, "capacitor.config.ts"), config, { flag: "wx" });
  }
  if (!existsSync(join(cwd, "android"))) fail(await run("npx", ["cap", "add", "android"]));
  fail(await run("npx", ["cap", "sync", "android"]));
  fail(await run("./android/gradlew", ["assembleDebug", "--no-daemon", "--stacktrace"]));
}

const find = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = join(directory, entry.name);
  return entry.isDirectory() ? find(target) : entry.name.endsWith(".apk") ? [target] : [];
});
const apks = find(cwd);
if (!apks.length) throw new Error("Build completed without an APK");
for (const apk of apks) {
  const target = join("/output", apk.split("/").pop());
  const { copyFileSync } = await import("node:fs");
  copyFileSync(apk, target);
}