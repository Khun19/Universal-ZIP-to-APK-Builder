import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { analyzeProject } from "@workspace/analyzer";
import { sha256, validateZipName } from "@workspace/security";

test("detects native Android projects without converting them", () => {
  const result = analyzeProject({ files: ["settings.gradle.kts", "gradlew", "app/build.gradle.kts", "app/src/main/AndroidManifest.xml", "app/src/main/MainActivity.kt"] });
  assert.equal(result.framework, "Native Android");
  assert.match(result.recommendedStrategy, /native/i);
  assert.equal(result.compatibilityScore > 0, true);
});

test("detects React Vite projects", () => {
  const result = analyzeProject({ files: ["package.json", "vite.config.ts", "src/App.tsx"], packageJson: { dependencies: { react: "^19.0.0" }, devDependencies: { vite: "^7.0.0" } } });
  assert.equal(result.framework, "React + Vite");
  assert.equal(result.packageManager, "npm");
});

test("detects plain web projects", () => {
  const result = analyzeProject({ files: ["index.html", "styles.css", "main.js"] });
  assert.equal(result.framework, "Plain Web");
});

test("rejects traversal and absolute ZIP paths", () => {
  assert.throws(() => validateZipName("../escape.txt"), /Unsafe archive path/);
  assert.throws(() => validateZipName("/etc/passwd"), /Unsafe archive path/);
  assert.throws(() => validateZipName("C:\\Windows\\system.ini"), /Unsafe archive path/);
});

test("calculates SHA-256 from persisted bytes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zip-to-apk-test-"));
  const file = join(directory, "artifact.apk");
  await writeFile(file, "real bytes are not an APK");
  assert.equal(await sha256(file), "523aca63ab80892725541720d74771b00bd0f0e67bfa280312628d03f53455ca");
});


test("detects Flutter projects with the structured analyzer", () => {
  const result = analyzeProject({
    files: ["pubspec.yaml", "lib/main.dart", "android/settings.gradle", "android/app/build.gradle"],
  });
  assert.equal(result.framework, "Flutter");
  assert.match(result.recommendedStrategy, /flutter/i);
});
