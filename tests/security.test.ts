import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import AdmZip from "adm-zip";
import {
  inspectAdmZip,
  inspectZip,
  safeExtract,
  safeExtractAdmZip,
  validateApk,
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

test("exact duplicate ZIP entry names are rejected", () => {
  const bytes = archive([["a.txt", "first"], ["b.txt", "second"]]).toBuffer();
  const centralDirectorySignature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const first = bytes.indexOf(centralDirectorySignature);
  const second = bytes.indexOf(centralDirectorySignature, first + 4);
  assert.notEqual(first, -1);
  assert.notEqual(second, -1);
  const firstNameLength = bytes.readUInt16LE(first + 28);
  const secondNameLength = bytes.readUInt16LE(second + 28);
  assert.equal(firstNameLength, secondNameLength);
  bytes.copy(bytes, second + 46, first + 46, first + 46 + firstNameLength);
  assert.throws(
    () => inspectAdmZip(new AdmZip(bytes)),
    /ADM-ZIP: Duplicate entry name|duplicate or case-colliding/,
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

test("entry CRC mismatch is rejected before extraction is published", async () => {
  const zip = archive([["file.txt", "content"]]);
  const entry = zip.getEntry("file.txt");
  assert.ok(entry);
  entry.header.crc = 0;
  await assert.rejects(
    () => safeExtractAdmZip(zip, path.join(tmpdir(), "m1-crc-should-not-publish-" + Date.now())),
    /CRC mismatch/,
  );
});

test("APK validation recognizes AndroidManifest.xml in a real ZIP listing", async () => {
  await withTempDir(async (directory) => {
    const apk = path.join(directory, "fixture.apk");
    await writeFile(apk, archive([["AndroidManifest.xml", "fixture"], ["classes.dex", "dex"]]).toBuffer());
    const result = await validateApk(apk);
    assert.ok(result.size > 0);
    assert.match(result.sha256, /^[a-f0-9]{64}$/);
  });
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
    await assert.rejects(
      () => safeExtract(file, path.join(directory, "too-large"), { maxBytes: size - 1 }),
      /upload limit/,
    );
  });
});

test("in-memory extraction enforces the compressed archive byte limit", async () => {
  const zip = archive([["file.txt", "payload"]]);
  const archiveSize = zip.toBuffer().byteLength;
  await assert.rejects(
    () => safeExtractAdmZip(zip, path.join(tmpdir(), "m1-over-byte-limit-" + Date.now()), { maxBytes: archiveSize - 1 }),
    /upload limit/,
  );
});

test("extraction publishes exact bytes into a fresh destination", async () => {
  await withTempDir(async (directory) => {
    const zip = archive([["nested/hello.txt", "hello"]]);
    const destination = path.join(directory, "output");
    const result = await safeExtractAdmZip(zip, destination, { maxEntryBytes: 5, maxUncompressedBytes: 5 });
    assert.deepEqual(result.filePaths, ["nested/hello.txt"]);
    assert.equal(await readFile(path.join(destination, "nested", "hello.txt"), "utf8"), "hello");
  });
});

test("actual streamed extraction bytes enforce limits when central-directory size is understated", async () => {
  await withTempDir(async (directory) => {
    const zipBytes = archive([["file.txt", "123456"]]).toBuffer();
    const centralDirectoryOffset = zipBytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    assert.notEqual(centralDirectoryOffset, -1, "fixture must contain a ZIP central-directory entry");
    // Change only the central-directory uncompressed size. The local file header and
    // compressed payload still describe six bytes, while preflight metadata says one.
    zipBytes.writeUInt32LE(1, centralDirectoryOffset + 24);
    const archivePath = path.join(directory, "understated-size.zip");
    const destination = path.join(directory, "extracted");
    await writeFile(archivePath, zipBytes);
    await assert.rejects(
      () => safeExtract(archivePath, destination, { maxEntryBytes: 5, maxUncompressedBytes: 5 }),
      /Extracted entry exceeds per-entry size limit|Actual extracted bytes exceed archive safety limit/,
    );
    await assert.rejects(() => readFile(path.join(destination, "file.txt")), /ENOENT/);
  });
});

test("failed extraction leaves no staging directory or partial published destination", async () => {
  await withTempDir(async (directory) => {
    const zip = archive([["file.txt", "content"]]);
    const destination = path.join(directory, "already-exists");
    await mkdir(destination);
    await assert.rejects(
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


test("HTTP ZIP upload checks the archive path before AdmZip allocation", async () => {
  const serverSource = await readFile(new URL("../lib/server-http.ts", import.meta.url), "utf8");
  assert.match(serverSource, /safeExtract\(uploadedFile\.filepath, workspaceDir\)/);
  assert.doesNotMatch(serverSource, /new AdmZip\(uploadedFile\.filepath\)/);
});
