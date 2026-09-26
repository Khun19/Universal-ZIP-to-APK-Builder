import * as path from 'node:path';

export interface ZipEntrySecurityInput {
  relativePath: string;
  uncompressedSize?: number;
  compressedSize?: number;
  isSymbolicLink?: boolean;
}

export interface ZipSecurityLimits {
  maxFiles: number;
  maxUncompressedBytes: number;
  maxCompressionRatio: number;
}

export const DEFAULT_ZIP_SECURITY_LIMITS: ZipSecurityLimits = {
  maxFiles: 100_000,
  maxUncompressedBytes: 512 * 1024 * 1024,
  maxCompressionRatio: 100,
};

export type ZipSecurityViolationCode =
  | 'INVALID_PATH'
  | 'SYMLINK_ENTRY'
  | 'FILE_COUNT_LIMIT'
  | 'UNCOMPRESSED_SIZE_LIMIT'
  | 'COMPRESSION_RATIO_LIMIT';

export interface ZipSecurityResult {
  safe: boolean;
  code?: ZipSecurityViolationCode;
  error?: string;
}

function isWindowsAbsolutePath(value: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(value);
}

export function validateZipEntryPath(entryPath: string): boolean {
  if (!entryPath || entryPath.includes('\0')) return false;
  const normalized = entryPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || isWindowsAbsolutePath(entryPath)) return false;
  const parts = normalized.split('/');
  if (parts.some((part) => part === '..')) return false;
  const resolved = path.posix.normalize('/' + normalized);
  return resolved !== '/' && !resolved.startsWith('/../');
}

export function validateZipEntries(
  entries: ZipEntrySecurityInput[],
  limits: ZipSecurityLimits = DEFAULT_ZIP_SECURITY_LIMITS,
): ZipSecurityResult {
  if (entries.length > limits.maxFiles) {
    return { safe: false, code: 'FILE_COUNT_LIMIT', error: `ZIP contains ${entries.length} files; maximum allowed is ${limits.maxFiles}` };
  }

  let totalUncompressed = 0;
  for (const entry of entries) {
    if (!validateZipEntryPath(entry.relativePath)) {
      return { safe: false, code: 'INVALID_PATH', error: `Unsafe ZIP entry path: ${entry.relativePath}` };
    }
    if (entry.isSymbolicLink) {
      return { safe: false, code: 'SYMLINK_ENTRY', error: `Symbolic-link ZIP entries are not allowed: ${entry.relativePath}` };
    }
    if (entry.uncompressedSize !== undefined) {
      if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0) {
        return { safe: false, code: 'UNCOMPRESSED_SIZE_LIMIT', error: `Invalid uncompressed size for: ${entry.relativePath}` };
      }
      totalUncompressed += entry.uncompressedSize;
      if (totalUncompressed > limits.maxUncompressedBytes) {
        return { safe: false, code: 'UNCOMPRESSED_SIZE_LIMIT', error: `ZIP uncompressed size exceeds the limit of ${limits.maxUncompressedBytes} bytes` };
      }
    }
    if (entry.compressedSize !== undefined && entry.uncompressedSize !== undefined && entry.compressedSize > 0) {
      const ratio = entry.uncompressedSize / entry.compressedSize;
      if (ratio > limits.maxCompressionRatio) {
        return { safe: false, code: 'COMPRESSION_RATIO_LIMIT', error: `ZIP compression ratio ${ratio.toFixed(2)} exceeds the limit of ${limits.maxCompressionRatio}` };
      }
    }
  }
  return { safe: true };
}
