import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMockupImportPath } from "../artifacts/mockup-sandbox/mockupPreviewPlugin.ts";

test("builds generated imports only under the mockups component directory", () => {
  assert.equal(
    resolveMockupImportPath("FocusMode/Preview.tsx"),
    "../components/mockups/FocusMode/Preview.tsx",
  );
});

test("rejects traversal, absolute, private, and non-TSX import paths", () => {
  assert.equal(resolveMockupImportPath("../outside.tsx"), null);
  assert.equal(resolveMockupImportPath("/tmp/outside.tsx"), null);
  assert.equal(resolveMockupImportPath("_private/Hidden.tsx"), null);
  assert.equal(resolveMockupImportPath("Preview.ts"), null);
});
