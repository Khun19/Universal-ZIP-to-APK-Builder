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
