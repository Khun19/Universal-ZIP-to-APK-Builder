import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("framework validation tooling is present", () => {
  assert.equal(existsSync("scripts/framework-validation.ts"), true);
  assert.equal(existsSync("docs/developer/framework-validation-evidence.schema.json"), true);
});

test("framework validation package script points to the validator", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["validate:framework"], "tsx scripts/framework-validation.ts");
});


test("framework validation distinguishes official Flutter and React Native strategies", () => {
  const validator = readFileSync("scripts/framework-validation.ts", "utf8");
  assert.match(validator, /official-react-native-android/);
  assert.match(validator, /official-flutter-android/);
});

test("native Flutter selection probes the actual Flutter command before fallback", () => {
  const worker = readFileSync("lib/worker.ts", "utf8");
  assert.match(worker, /execAsync\('flutter --version'/);
  assert.match(worker, /No runnable Flutter SDK found/);
});
