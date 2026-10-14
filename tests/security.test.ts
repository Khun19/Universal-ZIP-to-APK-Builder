import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import AdmZip from "adm-zip";
import {
  inspectAdmZip,
  inspectZip,
  safeExtractAdmZip,
  ZIP_LIMITS,
} from "../lib/security/src/index.ts";

function archive(entries: Array<[string, string | Buffer]>): AdmZip {
  const zip = new AdmZip();
  for (const [name, value] of entries) zip.addFile(name, Buffer.isBuffer(value) ? value : Buffer.from(value));
  // Materialize compressed sizes/CRC metadata before the tests inspect or mutate entries.
  zip.toBuffer();
  return zip;
}

async function withTempDir<T>(run: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), "m1-zip-security-"));
  try {
    return await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("configurable archive entry count accepts the exact limit and rejects limit plus one", () => {
  const zip = archive([["one.txt", "1"], ["two.txt", "2"]]);
  assert.equal(inspectAdmZip(zip, { maxFiles: 2 }).length, 2);
  assert.throws(() => inspectAdmZip(zip, { maxFiles: 1 }), /too many entries/);
});

test("total uncompressed bytes accept the exact limit and reject limit plus one", () => {
  const zip = archive([["a.txt", "123"], ["b.txt", "45"]]);
  assert.equal(inspectAdmZip(zip, { maxUncompressedBytes: 5 }).length, 2);
  assert.throws(() => inspectAdmZip(zip, { maxUncompressedBytes: 4 }), /uncompressed size/);
});

test("per-entry size accepts the exact limit and rejects limit plus one", () => {
  const zip = archive([["file.txt", "12345"]]);
  assert.equal(inspectAdmZip(zip, { maxEntryBytes: 5 }).length, 1);
  assert.throws(() => inspectAdmZip(zip, { maxEntryBytes: 4 }), /per-entry size/);
});

test("compression ratio boundary is enforced", () => {
  const zip = archive([["repetitive.txt", "x".repeat(4096)]]);
  const entry = zip.getEntry("repetitive.txt");
  assert.ok(entry);
  const ratio = entry.header.size / entry.header.compressedSize;
  assert.equal(inspectAdmZip(zip, { maxCompressionRatio: ratio }).length, 1);
  assert.throws(
    () => inspectAdmZip(zip, { maxCompressionRatio: Math.max(1, ratio - 0.01) }),
    /compression ratio/,
  );
});

test("path depth accepts the configured boundary and rejects deeper paths", () => {
  assert.equal(inspectAdmZip(archive([["one/two.txt", "x"]]), { maxPathDepth: 2 }).length, 1);
  assert.throws(
    () => inspectAdmZip(archive([["one/two/three.txt", "x"]]), { maxPathDepth: 2 }),
    /path depth/,
  );
});

test("duplicate and case-colliding paths are rejected", () => {
  assert.throws(
    () => inspectAdmZip(archive([["Readme.txt", "a"], ["README.TXT", "b"]])),
    /duplicate or case-colliding/,
  );
});

test("symlink entries are rejected", () => {
  const zip = archive([["link", "../outside.txt"]]);
  const entry = zip.getEntry("link");
  assert.ok(entry);
  entry.attr = (0o120777 << 16) >>> 0;
  assert.throws(() => inspectAdmZip(zip), /Symbolic links and special files/);
});

test("entry CRC mismatch is rejected before extraction is published", () => {
  const zip = archive([["file.txt", "content"]]);
  const entry = zip.getEntry("file.txt");
  assert.ok(entry);
  entry.header.crc = 0;
  assert.throws(
    () => safeExtractAdmZip(zip, path.join(tmpdir(), "m1-crc-should-not-publish-" + Date.now())),
    /CRC mismatch/,
  );
});

test("malformed ZIP bytes are rejected", async () => {
  await withTempDir(async (directory) => {
    const file = path.join(directory, "malformed.zip");
    await writeFile(file, "this is not a ZIP archive");
    await assert.rejects(() => inspectZip(file), /ZIP|zip|central|entry|archive/i);
  });
});

test("archive file-size limit accepts the exact boundary and rejects an over-limit file", async () => {
  await withTempDir(async (directory) => {
    const zip = archive([["file.txt", "ok"]]);
    const file = path.join(directory, "fixture.zip");
    await writeFile(file, zip.toBuffer());
    const { size } = await import("node:fs/promises").then((fs) => fs.stat(file));
    assert.equal((await inspectZip(file, { maxBytes: size })).length, 1);
    await assert.rejects(() => inspectZip(file, { maxBytes: size - 1 }), /upload limit/);
  });
});

test("extraction publishes exact bytes into a fresh destination", async () => {
  await withTempDir(async (directory) => {
    const zip = archive([["nested/hello.txt", "hello"]]);
    const destination = path.join(directory, "output");
    const result = safeExtractAdmZip(zip, destination, { maxEntryBytes: 5, maxUncompressedBytes: 5 });
    assert.deepEqual(result.filePaths, ["nested/hello.txt"]);
    assert.equal(await readFile(path.join(destination, "nested", "hello.txt"), "utf8"), "hello");
  });
});

test("understated ZIP size metadata fails closed during extraction", () => {
  const zip = archive([["file.txt", "123456"]]);
  const entry = zip.getEntry("file.txt");
  assert.ok(entry);
  entry.header.size = 1;
  assert.throws(
    () => safeExtractAdmZip(zip, path.join(tmpdir(), "m1-should-not-publish-" + Date.now()), { maxEntryBytes: 5, maxUncompressedBytes: 5 }),
    /per-entry size|Actual extracted bytes|Cannot create a Buffer larger than/,
  );
});

test("failed extraction leaves no staging directory or partial published destination", async () => {
  await withTempDir(async (directory) => {
    const zip = archive([["file.txt", "content"]]);
    const destination = path.join(directory, "already-exists");
    await mkdir(destination);
    await assert.throws(
      () => safeExtractAdmZip(zip, destination),
      /destination already exists/,
    );
    const names = await readdir(directory);
    assert.deepEqual(names, ["already-exists"]);
  });
});

test("invalid configurable limits are rejected", () => {
  assert.throws(() => inspectAdmZip(archive([["file.txt", "x"]]), { maxFiles: 0 }), /positive safe integer/);
  assert.equal(ZIP_LIMITS.maxBytes > 0, true);
});
