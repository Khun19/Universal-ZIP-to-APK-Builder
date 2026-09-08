import { createReadStream, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import AdmZip from "adm-zip";

const exec = promisify(execFile);

export const ZIP_LIMITS = {
  maxBytes: 250 * 1024 * 1024,
  maxFiles: 20_000,
  maxCompressionRatio: 100,
  maxUncompressedBytes: 1 * 1024 * 1024 * 1024,
};

export function validateZipName(name: string): void {
  const normalized = name.replace(/\\/g, "/");

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    path.posix.normalize(normalized).startsWith("../") ||
    normalized === ".." ||
    /^[A-Za-z]:($|\/)/.test(normalized)
  ) {
    throw new Error(`Unsafe archive path: ${name}`);
  }
}

export interface SecureZipResult {
  filePaths: string[];
  extractedPath: string;
}

export function inspectAdmZip(zip: AdmZip): string[] {
  const entries = zip.getEntries();

  if (entries.length > ZIP_LIMITS.maxFiles) {
    throw new Error("Archive contains too many files");
  }

  let totalUncompressed = 0;

  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, "/");

    validateZipName(name);

    if (entry.isDirectory) continue;

    const compressed = Number(entry.header.compressedSize);
    const uncompressed = Number(entry.header.size);

    if (!Number.isFinite(compressed) || !Number.isFinite(uncompressed) || compressed < 0 || uncompressed < 0) {
      throw new Error(`Invalid ZIP size metadata: ${name}`);
    }

    totalUncompressed += uncompressed;

    if (totalUncompressed > ZIP_LIMITS.maxUncompressedBytes) {
      throw new Error("Archive uncompressed size exceeds safety limit");
    }

    if (uncompressed > 0) {
      if (compressed === 0 || uncompressed / Math.max(compressed, 1) > ZIP_LIMITS.maxCompressionRatio) {
        throw new Error(`Archive compression ratio exceeds safety limit: ${name}`);
      }
    }

    if (entry.attr !== undefined && entry.attr !== 0) {
      const unixMode = (Number(entry.attr) >>> 16) & 0xffff;
      const fileType = unixMode & 0xf000;

      if (fileType === 0xa000) {
        throw new Error(`Symbolic links are not allowed in uploaded archives: ${name}`);
      }
    }
  }

  return entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName.replace(/\\/g, "/"));
}

export function safeExtractAdmZip(
  zip: AdmZip,
  destination: string,
): SecureZipResult {
  const resolvedDestination = path.resolve(destination);

  mkdirSync(resolvedDestination, { recursive: true });

  const canonicalDestination = realpathSync(resolvedDestination);
  const filePaths = inspectAdmZip(zip);

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;

    const relativePath = entry.entryName.replace(/\\/g, "/");
    const targetPath = path.resolve(canonicalDestination, relativePath);

    if (
      !targetPath.startsWith(canonicalDestination + path.sep) &&
      targetPath !== canonicalDestination
    ) {
      throw new Error(`Blocked ZIP path breakout: ${relativePath}`);
    }

    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, entry.getData());
  }

  return {
    filePaths,
    extractedPath: canonicalDestination,
  };
}

export async function inspectZip(archive: string): Promise<string[]> {
  const info = await stat(archive);

  if (!info.isFile() || info.size <= 0) {
    throw new Error("ZIP archive is missing or empty");
  }

  if (info.size > ZIP_LIMITS.maxBytes) {
    throw new Error("Archive exceeds upload limit");
  }

  const zip = new AdmZip(archive);
  return inspectAdmZip(zip);
}

export async function safeExtract(
  archive: string,
  destination: string,
): Promise<string[]> {
  const zip = new AdmZip(archive);
  return safeExtractAdmZip(zip, destination).filePaths;
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

export async function writeUpload(
  file: string,
  bytes: Uint8Array,
): Promise<void> {
  await writeFile(file, bytes, { flag: "wx" });
}

export async function validateApk(
  file: string,
): Promise<{
  size: number;
  sha256: string;
  applicationId: string | null;
}> {
  const info = await stat(file);

  if (!info.isFile() || info.size <= 0) {
    throw new Error("APK artifact is missing or empty");
  }

  const { stdout } = await exec("unzip", [
    "-Z1",
    file,
  ], {
    maxBuffer: 2 * 1024 * 1024,
  });

  if (!stdout.split(/\r?\n/).includes("AndroidManifest.xml")) {
    throw new Error("APK does not contain AndroidManifest.xml");
  }

  let applicationId: string | null = null;

  try {
    const result = await exec("aapt", [
      "dump",
      "badging",
      file,
    ], {
      maxBuffer: 2 * 1024 * 1024,
    });

    applicationId =
      result.stdout.match(/package: name='([^']+)'/)?.[1] ?? null;
  } catch {}

  return {
    size: info.size,
    sha256: await sha256(file),
    applicationId,
  };
}
