import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourceRoot = process.env.SAF_SOURCE_ROOT;
const projectDir = process.env.SAF_PROJECT_DIR;
const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
assert.ok(sourceRoot, "SAF_SOURCE_ROOT is required");
assert.ok(projectDir, "SAF_PROJECT_DIR is required");
assert.ok(sdkRoot, "ANDROID_HOME/ANDROID_SDK_ROOT is required");

const templatePath = path.join(sourceRoot, "lib", "template.ts");
const { injectAndroidWrapper } = await import(pathToFileURL(templatePath).href);
const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "saf-webview-fixture-"));
const webRoot = path.join(fixtureRoot, "web-dist");
await mkdir(webRoot, { recursive: true });
await mkdir(projectDir, { recursive: true });
await writeFile(path.join(fixtureRoot, "package.json"), JSON.stringify({
  name: "saf-webview-validation-fixture",
  productName: "SAF Validation",
  android: { applicationId: "com.builder.safvalidation" }
}, null, 2) + "\n");
await writeFile(path.join(webRoot, "index.html"), "<!doctype html><html><head><meta charset=\"utf-8\"><title>SAF Validation</title></head><body><main id=\"app\">SAF validation fixture</main></body></html>\n");
await writeFile(path.join(projectDir, "package.json"), await readFile(path.join(fixtureRoot, "package.json"), "utf8"));
await writeFile(path.join(projectDir, "index.html"), await readFile(path.join(webRoot, "index.html"), "utf8"));

injectAndroidWrapper(projectDir, webRoot, "SAF Validation");

const manifestPath = path.join(projectDir, "app/src/main/AndroidManifest.xml");
const javaPath = path.join(projectDir, "app/src/main/java/com/builder/safvalidation/MainActivity.java");
const manifest = await readFile(manifestPath, "utf8");
const java = await readFile(javaPath, "utf8");
assert.match(manifest, /package="com\.builder\.safvalidation"/, "manifest package must match fixture");
assert.match(manifest, /android:name="\.MainActivity"/, "launcher activity must be generated");
for (const [label, pattern] of [
  ["JavaScript bridge", /addJavascriptInterface\(new DirectoryBridge\(\), "AndroidDirectoryBridge"\)/],
  ["CSP frame restriction", /frame-src 'none'/],
  ["CSP form restriction", /form-action 'self'/],
  ["trusted appassets origin", /appassets\.androidplatform\.net/],
  ["external navigation interception", /shouldOverrideUrlLoading/],
  ["file access disabled", /setAllowFileAccess\(false\)/],
  ["content access disabled", /setAllowContentAccess\(false\)/],
  ["mixed content disabled", /MIXED_CONTENT_NEVER_ALLOW/],
  ["SAF picker", /ACTION_OPEN_DOCUMENT_TREE/],
  ["SAF list/read/write operations", /public String list\(String relativePath\)[\s\S]*public String readFile\(String relativePath\)[\s\S]*public boolean writeFile\(/],
  ["SAF create/remove operations", /public boolean createDirectory\([\s\S]*public boolean createFile\([\s\S]*public boolean remove\(/]
]) assert.match(java, pattern, "generated Java missing: " + label);

console.log(JSON.stringify({
  status: "GENERATED_SOURCE_VALIDATION_PASS",
  source_template: templatePath,
  fixture: "tests/fixtures/saf-webview-validation (generated deterministically in CI)",
  project_dir: projectDir,
  application_id: "com.builder.safvalidation",
  manifest: manifestPath,
  java_source: javaPath,
  static_checks: "PASS",
  runtime_security: "NOT_RUN",
  physical_device: "NOT_RUN"
}, null, 2));
