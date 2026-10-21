import { test } from "node:test";
import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import { spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs";

const enabled = process.env.RUN_HTTP_UPLOAD_INTEGRATION === "1";
const baseUrl = "http://127.0.0.1:3000";

async function waitForServer(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`HTTP server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(baseUrl + "/api/templates", { signal: AbortSignal.timeout(500) });
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("HTTP upload test server did not become ready");
}

function zipWithRawEntryName(name: string): Buffer {
  const nameBytes = Buffer.from(name, "utf8");
  const zip = new AdmZip();
  zip.addFile("x".repeat(nameBytes.length), Buffer.from("malicious payload"));
  const bytes = zip.toBuffer();
  const localHeader = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const centralHeader = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  assert.notEqual(localHeader, -1, "fixture must contain a local file header");
  assert.notEqual(centralHeader, -1, "fixture must contain a central-directory entry");
  assert.equal(bytes.readUInt16LE(localHeader + 26), nameBytes.length);
  assert.equal(bytes.readUInt16LE(centralHeader + 28), nameBytes.length);
  nameBytes.copy(bytes, localHeader + 30);
  nameBytes.copy(bytes, centralHeader + 46);
  return bytes;
}

async function uploadZip(zip: AdmZip | Buffer, name: string): Promise<{ status: number; body: any }> {
  const form = new FormData();
  const bytes = Buffer.isBuffer(zip) ? zip : zip.toBuffer();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: "application/zip" }), name);
  const response = await fetch(baseUrl + "/api/upload-zip", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  return { status: response.status, body: await response.json() };
}

test("HTTP /api/upload-zip accepts safe ZIP through project analysis and leaves no failed workspace", {
  skip: !enabled,
  timeout: 150_000,
}, async () => {
  const server = spawn("pnpm", ["exec", "tsx", "lib/server-http.ts"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "3000" },
  });
  let logs = "";
  server.stdout?.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr?.on("data", (chunk) => { logs += chunk.toString(); });
  const before = fs.existsSync(".workspace")
    ? fs.readdirSync(".workspace").filter((name) => name.startsWith("zip-build-"))
    : [];
  try {
    await waitForServer(server);
    const zip = new AdmZip();
    zip.addFile("package.json", Buffer.from(JSON.stringify({
      name: "http-upload-fixture",
      private: true,
      scripts: { build: "vite build" },
      devDependencies: { vite: "^7.3.2" },
    })));
    zip.addFile("index.html", Buffer.from("<!doctype html><html><body><h1>HTTP fixture</h1></body></html>"));
    zip.addFile("vite.config.ts", Buffer.from("export default {};\n"));
    const result = await uploadZip(zip, "safe-vite-fixture.zip");
    assert.ok(
      result.status === 200 ||
      (result.status === 500 && result.body?.error === "APK Build Failed"),
      `safe ZIP should pass extraction and project analysis before the build stage; status=${result.status}, body=${JSON.stringify(result.body)}, server logs=${logs}`,
    );
    if (result.status === 500) assert.ok(Array.isArray(result.body.logs));
    if (result.status === 500) {
      const after = fs.existsSync(".workspace")
        ? fs.readdirSync(".workspace").filter((name) => name.startsWith("zip-build-"))
        : [];
      assert.deepEqual(after, before, "failed safe ZIP build must not leave partial workspace output");
    }
  } finally {
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null || server.signalCode !== null) return resolve();
      server.once("exit", () => resolve());
      setTimeout(() => { server.kill("SIGKILL"); resolve(); }, 3_000);
    });
  }
});

test("HTTP /api/upload-zip rejects malicious ZIP and leaves no workspace output", {
  skip: !enabled,
  timeout: 30_000,
}, async () => {
  const server = spawn("pnpm", ["exec", "tsx", "lib/server-http.ts"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "3000" },
  });
  let logs = "";
  server.stdout?.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr?.on("data", (chunk) => { logs += chunk.toString(); });
  const before = fs.existsSync(".workspace")
    ? fs.readdirSync(".workspace").filter((name) => name.startsWith("zip-build-"))
    : [];
  try {
    await waitForServer(server);
    // Use raw ZIP header rewriting so these names reach the HTTP extractor
    // unchanged (including backslashes and unzip pattern metacharacters).
    for (const [index, unsafeName] of [
      "../outside.txt",
      "nested/../../outside.txt",
      "/absolute.txt",
      "C:/outside.txt",
      "nested\\\\..\\\\outside.txt",
      "wild/*.txt",
      "wild/[ab].txt",
    ].entries()) {
      const maliciousZip = zipWithRawEntryName(unsafeName);
      const result = await uploadZip(maliciousZip, `malicious-${index}.zip`);
      assert.equal(result.status, 500, `${unsafeName}: ${JSON.stringify(result.body)}`);
      assert.match(
        String(result.body?.details),
        /Unsafe archive path|path depth|duplicate or case-colliding/i,
        `unsafe path should be rejected: ${JSON.stringify(unsafeName)}`,
      );
      const after = fs.existsSync(".workspace")
        ? fs.readdirSync(".workspace").filter((name) => name.startsWith("zip-build-"))
        : [];
      assert.deepEqual(
        after,
        before,
        `rejected ZIP ${JSON.stringify(unsafeName)} must not leave a workspace or partial output`,
      );
    }
  } finally {
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null || server.signalCode !== null) return resolve();
      server.once("exit", () => resolve());
      setTimeout(() => { server.kill("SIGKILL"); resolve(); }, 3_000);
    });
  }
});
