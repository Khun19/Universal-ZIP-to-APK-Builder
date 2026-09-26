import { test } from 'node:test';
import assert from 'node:assert';
import { validateZipEntry, analyzeProjectFiles } from '../lib/analyzer.ts';

test('Security check blocks path traversal', () => {
  assert.strictEqual(validateZipEntry('../../etc/passwd'), false);
  assert.strictEqual(validateZipEntry('app/src/MainActivity.java'), true);
});

test('Detects Native Android project', () => {
  const result = analyzeProjectFiles(['app/build.gradle', 'app/src/main/AndroidManifest.xml']);
  assert.strictEqual(result.projectType, 'Native Android');
  assert.strictEqual(result.confidence, 95);
});

test('Detects an existing Capacitor Android project', () => {
  const result = analyzeProjectFiles(['package.json','capacitor.config.ts','android/settings.gradle','android/app/build.gradle','android/app/src/main/AndroidManifest.xml']);
  assert.strictEqual(result.projectType, 'Capacitor');
  assert.strictEqual(result.confidence, 98);
});

test('Detects Capacitor projects that still need the Android platform', () => {
  const result = analyzeProjectFiles(['package.json','capacitor.config.ts','src/main.ts']);
  assert.strictEqual(result.projectType, 'Capacitor');
  assert.ok(result.warnings.some((warning) => warning.includes('platform')));
});

test('Detects Flutter application with Android platform', () => {
  const result = analyzeProjectFiles(['pubspec.yaml','lib/main.dart','android/settings.gradle','android/app/build.gradle']);
  assert.strictEqual(result.projectType, 'Flutter');
  assert.strictEqual(result.confidence, 99);
});

test('Detects Flutter application without Android platform and reports the required preparation', () => {
  const result = analyzeProjectFiles(['pubspec.yaml','lib/main.dart','lib/app.dart']);
  assert.strictEqual(result.projectType, 'Flutter');
  assert.strictEqual(result.confidence, 94);
  assert.ok(result.warnings.some((warning) => warning.includes('flutter create')));
});

test('Detects React Native projects before generic web detection', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'index.js', 'App.js', 'android/settings.gradle', 'android/app/build.gradle'],
    { dependencies: { react: '18.3.1', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'React Native');
  assert.ok(result.evidence.some((item) => item.includes('React Native')));
});

test('Detects Expo projects from dependency and config markers', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'app.json', 'App.js'],
    { dependencies: { expo: '^52.0.0' } },
  );
  assert.strictEqual(result.projectType, 'Expo');
  assert.ok(result.warnings.some((warning) => warning.includes('prebuild')));
});
