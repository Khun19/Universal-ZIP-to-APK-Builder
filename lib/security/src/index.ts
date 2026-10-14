import { createReadStream, createWriteStream, existsSync, mkdirSync, realpathSync, renameSync, rmSync } from "node:fs";
import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";

const exec = promisify(execFile);

export interface ZipSecurityLimits {
  maxBytes: number;
  maxFiles: number;
  maxCompressionRatio: number;
  maxUncompressedBytes: number;
  maxEntryBytes: number;
  maxPathDepth: number;
}

export const ZIP_LIMITS: Readonly<ZipSecurityLimits> = Object.freeze({
  maxBytes: 250 * 1024 * 1024,
  maxFiles: 20_000,
  maxCompressionRatio: 100,
  maxUncompressedBytes: 1 * 1024 * 1024 * 1024,
  maxEntryBytes: 256 * 1024 * 1024,
  maxPathDepth: 64,
});

export type ZipSecurityLimitOverrides = Partial<ZipSecurityLimits>;

function effectiveLimits(overrides: ZipSecurityLimitOverrides = {}): ZipSecurityLimits {
  const limits = { ...ZIP_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if ((name === "maxCompressionRatio" ? !Number.isFinite(value) : !Number.isSafeInteger(value)) || value <= 0) {
      throw new Error(`Invalid ZIP security limit ${name}: expected a positive safe integer`);
    }
  }
  if (limits.maxCompressionRatio < 1) {
    throw new Error("Invalid ZIP security limit maxCompressionRatio: must be at least 1");
  }
  return limits;
}

export function validateZipName(name: string, limits: Readonly<ZipSecurityLimits> = ZIP_LIMITS): void {
  const normalized = name.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    path.posix.normalize(normalized).startsWith("../") ||
    normalized === ".." ||
    /^[A-Za-z]:($|\/)/.test(normalized) ||
    segments.some((segment) => segment === ".." || segment === "." || segment === "") ||
    segments.length > limits.maxPathDepth
  ) {
    throw new Error(`Unsafe archive path or path depth limit exceeded: ${name}`);
  }
}

export interface SecureZipResult {
  filePaths: string[];
  extractedPath: string;
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < CRC32_TABLE.length; i++) {
  let value = i;
  for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  CRC32_TABLE[i] = value >>> 0;
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function isSymlinkOrSpecialFile(entry: { attr?: number }): boolean {
  const attr = Number(entry.attr ?? 0);
  const unixMode = (attr >>> 16) & 0xffff;
  const fileType = unixMode & 0xf000;
  return fileType !== 0 && fileType !== 0x8000 && fileType !== 0x4000;
}

export function inspectAdmZip(
  zip: AdmZip,
  overrides: ZipSecurityLimitOverrides = {},
): string[] {
  const limits = effectiveLimits(overrides);
  const entries = zip.getEntries();

  if (entries.length === 0) {
    throw new Error("ZIP archive contains no entries or is malformed");
  }
  if (entries.length > limits.maxFiles) {
    throw new Error("Archive contains too many entries");
  }

  let totalUncompressed = 0;
  const normalizedNames = new Set<string>();
  const files: string[] = [];

  for (const entry of entries) {
    const rawName = entry.entryName.replace(/\\/g, "/");
    const name = entry.isDirectory ? rawName.replace(/\/+$/, "") : rawName;
    validateZipName(name, limits);

    const collisionKey = name.normalize("NFC").toLocaleLowerCase("en-US");
    if (normalizedNames.has(collisionKey)) {
      throw new Error(`Archive contains duplicate or case-colliding paths: ${name}`);
    }
    normalizedNames.add(collisionKey);

    if (isSymlinkOrSpecialFile(entry)) {
      throw new Error(`Symbolic links and special files are not allowed: ${name}`);
    }
    if (entry.isDirectory) continue;

    const compressed = Number(entry.header.compressedSize);
    const uncompressed = Number(entry.header.size);
    if (
      !Number.isSafeInteger(compressed) ||
      !Number.isSafeInteger(uncompressed) ||
      compressed < 0 ||
      uncompressed < 0
    ) {
      throw new Error(`Invalid ZIP size metadata: ${name}`);
    }
    if (uncompressed > limits.maxEntryBytes) {
      throw new Error(`Archive entry exceeds per-entry size limit: ${name}`);
    }

    totalUncompressed += uncompressed;
    if (!Number.isSafeInteger(totalUncompressed) || totalUncompressed > limits.maxUncompressedBytes) {
      throw new Error("Archive uncompressed size exceeds safety limit");
    }

    if (uncompressed > 0) {
      if (compressed === 0 || uncompressed / compressed > limits.maxCompressionRatio) {
        throw new Error(`Archive compression ratio exceeds safety limit: ${name}`);
      }
    }
    files.push(name);
  }

  return files;
}

/**
 * Extract one entry through the system unzip stream. Output is counted and CRC-checked
 * as chunks arrive; extraction stops immediately when either byte limit is exceeded.
 */
async function streamEntry(
  archivePath: string,
  entryName: string,
  targetPath: string,
  limits: ZipSecurityLimits,
  totals: { bytes: number },
  expectedCrc: number,
): Promise<void> {
  const child = spawn("unzip", ["-p", archivePath, entryName], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  let entryBytes = 0;
  let crc = 0xffffffff;
  let rejected: Error | undefined;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      entryBytes += chunk.length;
      totals.bytes += chunk.length;
      if (entryBytes > limits.maxEntryBytes) {
        rejected = new Error(`Extracted entry exceeds per-entry size limit: ${entryName}`);
        child.kill("SIGKILL");
        callback(rejected);
        return;
      }
      if (!Number.isSafeInteger(totals.bytes) || totals.bytes > limits.maxUncompressedBytes) {
        rejected = new Error("Actual extracted bytes exceed archive safety limit");
        child.kill("SIGKILL");
        callback(rejected);
        return;
      }
      for (const byte of chunk as Buffer) crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      callback(null, chunk);
    },
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-4096); });
  const streamResult = pipeline(child.stdout, counter, createWriteStream(targetPath, { flags: "wx" }))
    .catch((error: unknown) => { if (!rejected) rejected = error as Error; });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code));
  });
  await streamResult;
  if (rejected) throw rejected;
  if (exitCode !== 0) throw new Error(`ZIP streaming extraction failed for ${entryName}: ${stderr.trim()}`);
  const actualCrc = (crc ^ 0xffffffff) >>> 0;
  if (actualCrc !== (Number(expectedCrc) >>> 0)) {
    throw new Error(`ZIP entry CRC mismatch: ${entryName}`);
  }
}

async function streamExtractArchive(
  archivePath: string,
  destination: string,
  zip: AdmZip,
  overrides: ZipSecurityLimitOverrides = {},
): Promise<SecureZipResult> {
  const limits = effectiveLimits(overrides);
  const filePaths = inspectAdmZip(zip, limits);
  const resolvedDestination = path.resolve(destination);
  const parent = path.dirname(resolvedDestination);
  const base = path.basename(resolvedDestination);
  mkdirSync(parent, { recursive: true });
  const stagingPath = path.join(parent, `.${base}.extract-${randomUUID()}`);
  mkdirSync(stagingPath, { recursive: false });
  try {
    const canonicalStaging = realpathSync(stagingPath);
    const totals = { bytes: 0 };
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      const relativePath = entry.entryName.replace(/\\\\/g, "/").replace(/\\/+$/, "");
      const targetPath = path.resolve(canonicalStaging, relativePath);
      if (!targetPath.startsWith(canonicalStaging + path.sep)) {
        throw new Error(`Blocked ZIP path breakout: ${relativePath}`);
      }
      mkdirSync(path.dirname(targetPath), { recursive: true });
      await streamEntry(archivePath, entry.entryName, targetPath, limits, totals, entry.header.crc);
    }
    if (existsSync(resolvedDestination)) {
      throw new Error("Extraction destination already exists; use a fresh isolated workspace");
    }
    renameSync(stagingPath, resolvedDestination);
    return { filePaths, extractedPath: resolvedDestination };
  } catch (error) {
    rmSync(stagingPath, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Compatibility wrapper for in-memory AdmZip callers. Compressed archive bytes
 * are staged to disk, then entry payloads are streamed with enforced limits.
 */
export async function safeExtractAdmZip(
  zip: AdmZip,
  destination: string,
  overrides: ZipSecurityLimitOverrides = {},
): Promise<SecureZipResult> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "m1-zip-stream-"));
  const archivePath = path.join(tempDir, "input.zip");
  try {
    await writeFile(archivePath, zip.toBuffer(), { flag: "wx" });
    return await streamExtractArchive(archivePath, destination, zip, overrides);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function inspectZip(
  archive: string,
  overrides: ZipSecurityLimitOverrides = {},
): Promise<string[]> {
  const limits = effectiveLimits(overrides);
  const info = await stat(archive);
  if (!info.isFile() || info.size <= 0) throw new Error("ZIP archive is missing or empty");
  if (info.size > limits.maxBytes) throw new Error("Archive exceeds upload limit");
  return inspectAdmZip(new AdmZip(archive), limits);
}

export async function safeExtract(
  archive: string,
  destination: string,
  overrides: ZipSecurityLimitOverrides = {},
): Promise<string[]> {
  const limits = effectiveLimits(overrides);
  const info = await stat(archive);
  if (!info.isFile() || info.size <= 0) throw new Error("ZIP archive is missing or empty");
  if (info.size > limits.maxBytes) throw new Error("Archive exceeds upload limit");
  const zip = new AdmZip(archive);
  return (await streamExtractArchive(archive, destination, zip, limits)).filePaths;
}

export async function sha256(file: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return await new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

export async function writeUpload(file: string, bytes: Uint8Array): Promise<void> {
  await writeFile(file, bytes, { flag: "wx" });
}

export async function validateApk(file: string): Promise<{
  size: number;
  sha256: string;
  applicationId: string | null;
}> {
  const info = await stat(file);
  if (!info.isFile() || info.size <= 0) throw new Error("APK artifact is missing or empty");

  const { stdout } = await exec("unzip", ["-Z1", file], { maxBuffer: 2 * 1024 * 1024 });
  if (!stdout.split(/\\r?\\n/).includes("AndroidManifest.xml")) {
    throw new Error("APK does not contain AndroidManifest.xml");
  }

  let applicationId: string | null = null;
  try {
    const result = await exec("aapt", ["dump", "badging", file], { maxBuffer: 2 * 1024 * 1024 });
    applicationId = result.stdout.match(/package: name='([^']+)'/)?.[1] ?? null;
  } catch {}
  return { size: info.size, sha256: await sha256(file), applicationId };
}
