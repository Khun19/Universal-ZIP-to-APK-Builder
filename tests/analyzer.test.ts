import { test } from 'node:test';
import assert from 'node:assert';
import { validateZipEntry, analyzeProjectFiles } from '../lib/analyzer.ts';

test('Security check blocks path traversal', () => {
  assert.strictEqual(validateZipEntry('../../etc/passwd'), false);
  assert.strictEqual(validateZipEntry('app/src/MainActivity.java'), true);
});

test('Detects Native Android project', () => {
  const files = ['app/build.gradle', 'app/src/main/AndroidManifest.xml'];
  const result = analyzeProjectFiles(files);
  assert.strictEqual(result.projectType, 'Native Android');
  assert.strictEqual(result.confidence, 95);
});
