import { test } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_ZIP_SECURITY_LIMITS, validateZipEntries, validateZipEntryPath } from '../lib/security.ts';

test('blocks traversal, absolute, Windows, and NUL ZIP paths', () => {
  for (const value of ['../secret', '../../etc/passwd', '/etc/passwd', 'C:/secret', 'C:\\secret', 'src/ok.txt\0']) {
    assert.strictEqual(validateZipEntryPath(value), false, value);
  }
  assert.strictEqual(validateZipEntryPath('app/src/MainActivity.java'), true);
  assert.strictEqual(validateZipEntryPath('nested\\src\\MainActivity.java'), true);
});

test('blocks ZIP symlink entries', () => {
  const result = validateZipEntries([{ relativePath: 'link', isSymbolicLink: true }]);
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.code, 'SYMLINK_ENTRY');
});

test('enforces file-count and uncompressed-size limits', () => {
  const count = validateZipEntries(
    Array.from({ length: 3 }, (_, i) => ({ relativePath: `f${i}`, uncompressedSize: 1 })),
    { ...DEFAULT_ZIP_SECURITY_LIMITS, maxFiles: 2 },
  );
  assert.strictEqual(count.code, 'FILE_COUNT_LIMIT');

  const size = validateZipEntries(
    [{ relativePath: 'large.bin', uncompressedSize: 11 }],
    { ...DEFAULT_ZIP_SECURITY_LIMITS, maxUncompressedBytes: 10 },
  );
  assert.strictEqual(size.code, 'UNCOMPRESSED_SIZE_LIMIT');
});

test('enforces compression-ratio limit', () => {
  const result = validateZipEntries(
    [{ relativePath: 'bomb.bin', uncompressedSize: 10_001, compressedSize: 100 }],
    { ...DEFAULT_ZIP_SECURITY_LIMITS, maxCompressionRatio: 50 },
  );
  assert.strictEqual(result.safe, false);
  assert.strictEqual(result.code, 'COMPRESSION_RATIO_LIMIT');
});
