import { createReadStream, existsSync, mkdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";

const exec = promisify(exec);

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
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Invalid ZIP security limit ${name}: expected a positive safe integer`);
    }
  }
  if (limits.maxCompressionRatio < 1) {
    throw new Error("Invalid ZIP security limit maxCompressionRatio: must be at least 1");
  }
  return limits;
}

export function validateZipName(name: string, limits: ZipSecurityLimits = ZIP_LIMITS): void {
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

  if (entries.length > limits.maxFiles) {
    throw new Error("Archive contains too many entries");
  }

  let totalUncompressed = 0;
  const normalizedNames = new Set<string>();
  const files: string[] = [];

  for (const entry of entries) {
    const rawName = entry.entryName.replace(/\\/g, "/");
    const name = entry.isDirectory ? rawName.replace(/\\/+$/, "") : rawName;
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
 * AdmZip inflates each entry into a Buffer before it can be written. Metadata
 * checks run first; actual inflated lengths are checked before writing. The
 * per-entry buffer is therefore bounded by the decompressed data returned by
 * AdmZip, not by a streaming inflater. Do not treat this API as a hard
 * process-memory boundary for hostile archives with falsified ZIP metadata.
 */
export function safeExtractAdmZip(
  zip: AdmZip,
  destination: string,
  overrides: ZipSecurityLimitOverrides = {},
): SecureZipResult {
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
    let actualTotal = 0;

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;

      const relativePath = entry.entryName.replace(/\\/g, "/").replace(/\\/+$/, "");
      const targetPath = path.resolve(canonicalStaging, relativePath);
      if (!targetPath.startsWith(canonicalStaging + path.sep)) {
        throw new Error(`Blocked ZIP path breakout: ${relativePath}`);
      }

      // Verify runtime data size instead of trusting central-directory metadata.
      const data = entry.getData();
      if (data.byteLength > limits.maxEntryBytes) {
        throw new Error(`Extracted entry exceeds per-entry size limit: ${relativePath}`);
      }
      actualTotal += data.byteLength;
      if (!Number.isSafeInteger(actualTotal) || actualTotal > limits.maxUncompressedBytes) {
        throw new Error("Actual extracted bytes exceed archive safety limit");
      }

      mkdirSync(path.dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, data, { flag: "wx" });
    }

    // Never merge untrusted archive contents into an existing build workspace.
    if (existsSync(resolvedDestination)) {
      throw new Error("Extraction destination already exists; use a fresh isolated workspace");
    }
    // The destination must be absent; rename is an atomic publication step on the same filesystem.
    renameSync(stagingPath, resolvedDestination);
    return { filePaths, extractedPath: resolvedDestination };
  } catch (error) {
    // A failed extraction must not leave a partial trusted workspace.
    rmSyncSafe(stagingPath);
    throw error;
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
  return safeExtractAdmZip(zip, destination, limits).filePaths;
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
