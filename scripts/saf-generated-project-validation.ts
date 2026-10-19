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
const fixtureHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SAF Directory Picker Validation</title>
<style>
body{font:16px sans-serif;margin:20px;color:#111;background:#fff}
button{display:block;width:100%;padding:12px;margin:8px 0;font-size:16px}
#status{padding:10px;border:1px solid #777;white-space:pre-wrap;overflow-wrap:anywhere}
li{margin:6px 0}
</style>
</head>
<body>
<h1>SAF Directory Picker Test</h1>
<p>This is a validation fixture, not the production Builder UI.</p>
<button id="pick">1. Choose directory</button>
<button id="refresh" disabled>2. Refresh directory listing</button>
<button id="create" disabled>3. Create test file</button>
<button id="write" disabled>4. Write test content</button>
<button id="remove" disabled>5. Remove test file</button>
<p id="status" role="status">Status: waiting for directory selection</p>
<ul id="files"></ul>
<script>
let root = null;
const status = document.getElementById("status");
const files = document.getElementById("files");
const testName = "saf-validation-test.txt";
function say(message){status.textContent = "Status: " + message;}
function controls(enabled){["refresh","create","write","remove"].forEach(id=>document.getElementById(id).disabled=!enabled);}
async function refresh(){
  if(!root)return;
  files.replaceChildren();
  try{
    for await (const [name, handle] of root.entries()){
      const li=document.createElement("li");
      li.textContent=name+" ("+handle.kind+")";
      files.appendChild(li);
    }
    say("Directory listing loaded.");
  }catch(error){say("List failed: "+error.message);}
}
document.getElementById("pick").addEventListener("click",async()=>{
  try{
    root=await window.showDirectoryPicker();
    controls(!!root);
    say(root ? "Directory selected: "+root.name : "Directory selection cancelled.");
    await refresh();
  }catch(error){say("Picker failed: "+error.message);}
});
document.getElementById("refresh").addEventListener("click",refresh);
document.getElementById("create").addEventListener("click",async()=>{
  try{await root.getFileHandle(testName,{create:true});say("Created or found "+testName);await refresh();}
  catch(error){say("Create failed: "+error.message);}
});
document.getElementById("write").addEventListener("click",async()=>{
  try{
    const handle=await root.getFileHandle(testName,{create:true});
    const writer=await handle.createWritable();
    await writer.write("SAF bridge write test");
    await writer.close();
    say("Wrote test content to "+testName);await refresh();
  }catch(error){say("Write failed: "+error.message);}
});
document.getElementById("remove").addEventListener("click",async()=>{
  try{await root.removeEntry(testName);say("Removed "+testName);await refresh();}
  catch(error){say("Remove failed: "+error.message);}
});
</script>
</body>
</html>`;
await writeFile(path.join(webRoot, "index.html"), fixtureHtml + "\n");
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
  fixture: "temporary deterministic HTML fixture (generated in CI)",
  project_dir: projectDir,
  application_id: "com.builder.safvalidation",
  manifest: manifestPath,
  java_source: javaPath,
  static_checks: "PASS",
  runtime_security: "NOT_RUN",
  physical_device: "NOT_RUN"
}, null, 2));
