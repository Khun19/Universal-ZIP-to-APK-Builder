import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createIsolatedWorkspace, cleanupIsolatedWorkspace } from "../lib/build-engine/src/workspace.ts";
import { resolveAndroidToolchain } from "../lib/build-engine/src/toolchain.ts";
import { commandFor, runBuild } from "../lib/build-engine/src/index.ts";
import type { ProjectAnalysis } from "@workspace/shared";

const analysis: ProjectAnalysis = {
  framework: "Native Android",
  version: null,
  buildTool: "Gradle",
  language: "Kotlin",
  packageManager: "Gradle",
  projectType: "Native Android",
  confidence: 1,
  compatibilityScore: 1,
  warnings: [],
  blockers: [],
  recommendedStrategy: "native-gradle",
  evidence: [],
};

test("M0 resolves Android Build Tools from SDK when tools are not on PATH", () => {
  const previousPath = process.env.PATH;
  const previousSdk = process.env.ANDROID_HOME;
  const sdk = fs.mkdtempSync(path.join(os.tmpdir(), "m0-sdk-"));
  const tools = path.join(sdk, "build-tools", "36.0.0");
  fs.mkdirSync(tools, { recursive: true });

  for (const name of ["aapt2", "zipalign", "apksigner"]) {
    const file = path.join(tools, name);
    fs.writeFileSync(file, "");
    fs.chmodSync(file, 0o755);
  }

  process.env.ANDROID_HOME = sdk;
  process.env.PATH = "";

  const resolved = resolveAndroidToolchain();
  assert.equal(resolved.aapt2, path.join(tools, "aapt2"));
  assert.equal(resolved.zipalign, path.join(tools, "zipalign"));
  assert.equal(resolved.apksigner, path.join(tools, "apksigner"));

  process.env.PATH = previousPath;
  if (previousSdk === undefined) delete process.env.ANDROID_HOME;
  else process.env.ANDROID_HOME = previousSdk;
  fs.rmSync(sdk, { recursive: true, force: true });
});

test("M0 creates and cleans an isolated workspace", () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "m0-source-"));
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "m0-workspaces-"));
  fs.writeFileSync(path.join(source, "project.txt"), "fixture");

  const workspace = createIsolatedWorkspace(source, base);
  assert.match(workspace.root, /workspaces-[^/\\]+[\\/]build-/);
  assert.equal(fs.readFileSync(path.join(workspace.source, "project.txt"), "utf8"), "fixture");

  cleanupIsolatedWorkspace(workspace);
  assert.equal(fs.existsSync(workspace.root), false);

  fs.rmSync(source, { recursive: true, force: true });
  fs.rmSync(base, { recursive: true, force: true });
});

test("M0 BuildRequest returns a structured BuildResult and cleans the workspace", async () => {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "m0-build-"));
  const logs: string[] = [];

  const result = await runBuild({
    workspace: source,
    analysis,
    timeoutMs: 1000,
    onLog: line => logs.push(line),
  });

  assert.equal(result.success, false);
  assert.equal(typeof result.buildId, "string");
  assert.equal(typeof result.durationMs, "number");
  assert.ok(result.error);
  assert.ok(Array.isArray(result.logs));
  assert.equal(result.artifactPath, undefined);
  assert.equal(result.sha256, undefined);
  assert.equal(fs.existsSync(path.join(os.homedir(), ".builder", "workspaces", result.buildId)), false);

  fs.rmSync(source, { recursive: true, force: true });
});

test("M0 preserves existing Native Android command selection", () => {
  assert.deepEqual(commandFor(analysis), {
    command: "./gradlew",
    args: ["assembleDebug", "--no-daemon", "--stacktrace"],
  });
});
