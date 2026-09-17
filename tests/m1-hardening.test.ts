import assert from 'node:assert/strict';
import test from 'node:test';
import AdmZip from 'adm-zip';
import { analyzeProjectFiles, validateZipEntry } from '../lib/analyzer.ts';
import { inspectAdmZip, ZIP_LIMITS } from '../lib/security/src/index.ts';

test('M1 rejects normalized ZIP traversal and unsafe control characters', () => {
  const unsafe = [
    '../escape.txt',
    'a/../../escape.txt',
    '/absolute.txt',
    'C:/absolute.txt',
    'folder/\u0000file.txt',
    'folder/\u001bfile.txt',
  ];

  for (const entry of unsafe) assert.equal(validateZipEntry(entry), false, entry);
  assert.equal(validateZipEntry('assets/../icon.png'), true);
  assert.equal(validateZipEntry('src/main.java'), true);
});

test('M1 security inspection rejects malicious archive entries before extraction', () => {
  const zip = new AdmZip();
  zip.addFile('../escape.txt', Buffer.from('blocked'));
  assert.throws(() => inspectAdmZip(zip), /Unsafe archive path/);
});

test('M1 security inspection enforces archive file-count limit', () => {
  const zip = new AdmZip();
  for (let i = 0; i < ZIP_LIMITS.maxFiles + 1; i += 1) {
    zip.addFile(`files/${i}.txt`, Buffer.from('x'));
  }
  assert.throws(() => inspectAdmZip(zip), /too many files/);
});

test('M1 native project analysis records evidence and strategy input', () => {
  const result = analyzeProjectFiles([
    'settings.gradle.kts',
    'build.gradle.kts',
    'app/build.gradle.kts',
    'app/src/main/AndroidManifest.xml',
  ]);

  assert.equal(result.projectType, 'Native Android');
  assert.ok(result.confidence >= 90);
  assert.ok(result.evidence.includes('AndroidManifest.xml detected'));
});
