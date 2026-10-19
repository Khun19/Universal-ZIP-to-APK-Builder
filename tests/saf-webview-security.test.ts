import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("generated SAF WebView blocks untrusted frames and external content", async () => {
  const source = await readFile(new URL("../lib/template.ts", import.meta.url), "utf8");

  assert.match(source, /addJavascriptInterface\(new DirectoryBridge\(\), "AndroidDirectoryBridge"\)/);
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /frame-src 'none'/);
  assert.match(source, /script-src 'self' 'unsafe-inline'/);
  assert.match(source, /safeInterceptRequest\(assetLoader, request\.getUrl\(\)\)/);
  assert.match(source, /if \(clean\.length\(\) == 0\) return false/);
  assert.match(source, /safeInterceptRequest\(assetLoader, Uri\.parse\(url\)\)/);
  assert.match(source, /appassets\.androidplatform\.net/);
  assert.match(source, /shouldOverrideUrlLoading/);
  assert.match(source, /setAllowFileAccess\(false\)/);
  assert.match(source, /setAllowContentAccess\(false\)/);
  assert.match(source, /MIXED_CONTENT_NEVER_ALLOW/);
});
