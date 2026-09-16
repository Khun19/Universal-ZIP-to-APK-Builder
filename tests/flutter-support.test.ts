import { test } from 'node:test';
import assert from 'node:assert';
import { analyzeProjectFiles } from '../lib/analyzer.ts';
import { determineBuildStrategy } from '../lib/strategy.ts';

test('detects Flutter projects before native Android heuristics', () => {
  const result = analyzeProjectFiles([
    'pubspec.yaml',
    'lib/main.dart',
    'android/settings.gradle',
    'android/app/src/main/AndroidManifest.xml',
  ]);

  assert.equal(result.projectType, 'Flutter');
  assert.equal(result.confidence, 99);
});

test('routes Flutter projects to the Flutter APK strategy', () => {
  const strategy = determineBuildStrategy({
    projectType: 'Flutter',
    confidence: 99,
    evidence: [],
    warnings: [],
  });

  assert.equal(strategy.strategyName, 'flutter');
  assert.equal(strategy.outputArtifact, 'app-debug.apk');
});
