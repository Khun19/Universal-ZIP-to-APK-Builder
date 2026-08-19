import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
const exec = promisify(execFile);
export const ZIP_LIMITS = { maxBytes: 250 * 1024 * 1024, maxFiles: 20_000, maxCompressionRatio: 100 };
export function validateZipName(name: string): void {
  if (!name || name.startsWith("/") || name.includes("\0") || path.posix.normalize(name).startsWith("../") || /^[A-Za-z]:/.test(name)) throw new Error(`Unsafe archive path: ${name}`);
}
export async function inspectZip(archive: string): Promise<string[]> {
  const { stdout } = await exec("unzip", ["-Z1", archive], { maxBuffer: 8 * 1024 * 1024 });
  const files = stdout.split(/\r?\n/).filter(Boolean);
  if (files.length > ZIP_LIMITS.maxFiles) throw new Error("Archive contains too many files");
  files.forEach(validateZipName);
  const stat = await readFile(archive);
  if (stat.byteLength > ZIP_LIMITS.maxBytes) throw new Error("Archive exceeds upload limit");
  return files;
}
export async function safeExtract(archive: string, destination: string): Promise<string[]> {
  const files = await inspectZip(archive);
  await mkdir(destination, { recursive: true });
  const { stdout } = await exec("unzip", ["-Z", "-v", archive], { maxBuffer: 16 * 1024 * 1024 });
  if (/\bsymlink\b/i.test(stdout)) throw new Error("Symbolic links are not allowed in uploaded archives");
  await exec("unzip", ["-q", "-o", archive, "-d", destination]);
  return files;
}
export async function sha256(file: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return await new Promise((resolve, reject) => { const hash = createHash("sha256"); createReadStream(file).on("data", (chunk) => hash.update(chunk)).on("error", reject).on("end", () => resolve(hash.digest("hex"))); });
}
export async function writeUpload(file: string, bytes: Uint8Array): Promise<void> { await writeFile(file, bytes, { flag: "wx" }); }
export async function validateApk(file: string): Promise<{ size: number; sha256: string; applicationId: string | null }> {
  const info = await stat(file);
  if (!info.isFile() || info.size <= 0) throw new Error("APK artifact is missing or empty");
  const { stdout } = await exec("unzip", ["-Z1", file], { maxBuffer: 2 * 1024 * 1024 });
  if (!stdout.split(/\r?\n/).includes("AndroidManifest.xml")) throw new Error("APK does not contain AndroidManifest.xml");
  let applicationId: string | null = null;
  try { const result = await exec("aapt", ["dump", "badging", file], { maxBuffer: 2 * 1024 * 1024 }); applicationId = result.stdout.match(/package: name='([^']+)'/)?.[1] ?? null; } catch {}
  return { size: info.size, sha256: await sha256(file), applicationId };
}