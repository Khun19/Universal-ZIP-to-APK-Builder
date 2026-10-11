import { test } from 'node:test';
import assert from 'node:assert';
import { validateZipEntry, analyzeProjectFiles } from '../lib/analyzer.ts';

test('Security check blocks path traversal', () => {
  assert.strictEqual(validateZipEntry('../../etc/passwd'), false);
  assert.strictEqual(validateZipEntry('app/src/MainActivity.java'), true);
});

test('Detects Native Android only with Gradle and Android manifest evidence', () => {
  const result = analyzeProjectFiles(['app/build.gradle', 'app/src/main/AndroidManifest.xml']);
  assert.strictEqual(result.projectType, 'Native Android');
  assert.strictEqual(result.confidence, 96);
});

test('Detects Capacitor when config and Capacitor dependency agree', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'capacitor.config.ts', 'android/settings.gradle', 'android/app/build.gradle', 'android/app/src/main/AndroidManifest.xml'],
    { dependencies: { '@capacitor/core': '^6.0.0', '@capacitor/android': '^6.0.0' } },
  );
  assert.strictEqual(result.projectType, 'Capacitor');
  assert.strictEqual(result.confidence, 99);
});

test('Does not identify Capacitor from config alone', () => {
  const result = analyzeProjectFiles(['package.json', 'capacitor.config.ts', 'src/main.ts']);
  assert.strictEqual(result.projectType, 'Unknown');
  assert.ok(result.warnings.some((warning) => warning.includes('Incomplete Capacitor signature')));
});

test('Detects Flutter application with Android platform', () => {
  const result = analyzeProjectFiles(['pubspec.yaml', 'lib/main.dart', 'android/settings.gradle', 'android/app/build.gradle']);
  assert.strictEqual(result.projectType, 'Flutter');
  assert.strictEqual(result.confidence, 99);
});

test('Detects Flutter application without Android platform and reports required preparation', () => {
  const result = analyzeProjectFiles(['pubspec.yaml', 'lib/main.dart', 'lib/app.dart']);
  assert.strictEqual(result.projectType, 'Flutter');
  assert.strictEqual(result.confidence, 95);
  assert.ok(result.warnings.some((warning) => warning.includes('flutter create')));
});

test('Detects React Native projects before generic web detection', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'index.js', 'App.js', 'android/settings.gradle', 'android/app/build.gradle'],
    { dependencies: { react: '18.3.1', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'React Native');
  assert.ok(result.evidence.some((item) => item.includes('react-native dependency')));
});

test('Detects Expo from its explicit runtime dependency', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'app.json', 'App.js'],
    { dependencies: { expo: '^52.0.0', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'Expo');
  assert.ok(result.warnings.some((warning) => warning.includes('prebuild')));
});

test('Does not misclassify plain React Native app.json as Expo', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'app.json', 'App.js', 'index.js'],
    { dependencies: { react: '18.3.1', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'React Native');
  assert.ok(result.evidence.some((item) => item.includes('app.json present')));
  assert.ok(!result.evidence.some((item) => item.includes('Expo')));
  assert.ok(result.warnings.some((warning) => warning.includes('generate a native Android project')));
});

test('Does not select Expo from app.config without Expo dependency', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'app.config.ts', 'App.js'],
    { dependencies: { react: '18.3.1', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'React Native');
  assert.ok(result.warnings.some((warning) => warning.includes('without expo dependency')));
});

test('Does not infer a framework from isolated Gradle or manifest files', () => {
  const gradleOnly = analyzeProjectFiles(['app/build.gradle']);
  const manifestOnly = analyzeProjectFiles(['app/src/main/AndroidManifest.xml']);
  assert.strictEqual(gradleOnly.projectType, 'Unknown');
  assert.strictEqual(manifestOnly.projectType, 'Unknown');
});

test('Does not infer Flutter from only one Flutter marker', () => {
  const result = analyzeProjectFiles(['pubspec.yaml', 'README.md']);
  assert.strictEqual(result.projectType, 'Unknown');
  assert.ok(result.warnings.some((warning) => warning.includes('Incomplete Flutter signature')));
});

test('Requires framework evidence to be non-empty and exposes ordered detection stages', () => {
  const result = analyzeProjectFiles(
    ['.\\package.json', '.\\app.json', '.\\App.js', '.\\index.js'],
    { dependencies: { react: '18.3.1', 'react-native': '0.76.9' } },
  );
  assert.strictEqual(result.projectType, 'React Native');
  assert.deepStrictEqual(result.checks.map((check) => check.stage), [
    '1-path-normalization',
    '2-package-manifest',
    '3-framework-dependencies',
    '4-platform-markers',
    '5-framework-decision',
  ]);
  assert.ok(result.checks.every((check) => typeof check.passed === 'boolean' && check.detail.length > 0));
});

test('Does not label a generic package.json plus index.html as React/Vite without framework evidence', () => {
  const result = analyzeProjectFiles(
    ['package.json', 'index.html', 'server.js'],
    { dependencies: { express: '^4.0.0' } },
  );
  assert.strictEqual(result.projectType, 'Unknown');
});
