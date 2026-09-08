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

test('Detects an existing Capacitor Android project', () => {
  const files = [
    'package.json',
    'capacitor.config.ts',
    'android/settings.gradle',
    'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
  ];
  const result = analyzeProjectFiles(files);
  assert.strictEqual(result.projectType, 'Capacitor');
  assert.strictEqual(result.confidence, 98);
});

test('Detects Capacitor projects that still need the Android platform', () => {
  const result = analyzeProjectFiles([
    'package.json',
    'capacitor.config.ts',
    'src/main.ts',
  ]);
  assert.strictEqual(result.projectType, 'Capacitor');
  assert.ok(result.warnings.some((warning) => warning.includes('platform')));
});
