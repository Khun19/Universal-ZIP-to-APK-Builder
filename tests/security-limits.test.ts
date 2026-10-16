import { test } from 'node:test';
import assert from 'node:assert/strict';
import type AdmZip from 'adm-zip';
import { inspectAdmZip, ZIP_LIMITS } from '../lib/security/src/index.ts';

type FixtureEntry = {
  entryName: string;
  isDirectory: boolean;
  header: { compressedSize: number; size: number };
  attr?: number;
};

function fakeZip(entries: FixtureEntry[]): AdmZip {
  return { getEntries: () => entries } as unknown as AdmZip;
}

function entry(
  entryName: string,
  size: number,
  compressedSize: number,
): FixtureEntry {
  return {
    entryName,
    isDirectory: false,
    header: { compressedSize, size },
    attr: 0,
  };
}

test('ZIP entry-count limit accepts the exact boundary', () => {
  const entries = Array.from(
    { length: ZIP_LIMITS.maxFiles },
    (_, index) => entry(`file-${index}.txt`, 0, 0),
  );
  assert.equal(inspectAdmZip(fakeZip(entries)).length, ZIP_LIMITS.maxFiles);
});

test('ZIP entry-count limit rejects one entry over the boundary', () => {
  const entries = Array.from(
    { length: ZIP_LIMITS.maxFiles + 1 },
    (_, index) => entry(`file-${index}.txt`, 0, 0),
  );
  assert.throws(
    () => inspectAdmZip(fakeZip(entries)),
    /too many (files|entries)/i,
  );
});

test('ZIP compression-ratio limit accepts the exact boundary', () => {
  const size = 100_000;
  const compressedSize = size / ZIP_LIMITS.maxCompressionRatio;
  assert.deepEqual(
    inspectAdmZip(fakeZip([entry('boundary.txt', size, compressedSize)])),
    ['boundary.txt'],
  );
});

test('ZIP compression-ratio limit rejects one unit over the boundary', () => {
  const size = 100_001;
  const compressedSize = 1_000;
  assert.throws(
    () => inspectAdmZip(fakeZip([entry('over-ratio.txt', size, compressedSize)])),
    /compression ratio exceeds safety limit/i,
  );
});

test('ZIP total extracted-size limit accepts the exact boundary', () => {
  const perEntry = ZIP_LIMITS.maxEntryBytes;
  assert.equal(perEntry * 4, ZIP_LIMITS.maxUncompressedBytes);
  const entries = Array.from({ length: 4 }, (_, index) =>
    entry(`part-${index}.bin`, perEntry, Math.ceil(perEntry / ZIP_LIMITS.maxCompressionRatio)),
  );
  assert.equal(inspectAdmZip(fakeZip(entries)).length, 4);
});

test('ZIP total extracted-size limit rejects one byte over the boundary', () => {
  const perEntry = ZIP_LIMITS.maxEntryBytes;
  assert.equal(perEntry * 4, ZIP_LIMITS.maxUncompressedBytes);
  const entries = Array.from({ length: 4 }, (_, index) =>
    entry(`part-${index}.bin`, perEntry, Math.ceil(perEntry / ZIP_LIMITS.maxCompressionRatio)),
  );
  entries.push(entry('one-byte-over.bin', 1, 1));
  assert.throws(
    () => inspectAdmZip(fakeZip(entries)),
    /uncompressed size exceeds safety limit/i,
  );
});
