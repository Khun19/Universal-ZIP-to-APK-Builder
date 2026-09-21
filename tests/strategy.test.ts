import { test } from 'node:test';
import assert from 'node:assert';
import { determineBuildStrategy } from '../lib/strategy.ts';
import { AnalysisResult } from '../lib/analyzer.ts';

test('Determines native gradle strategy for Android projects', () => {
  const analysis: AnalysisResult = { projectType: 'Native Android', confidence: 95, evidence: ['build.gradle detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'native-gradle');
  assert.ok(strategy.buildSteps.length > 0);
});

test('Determines web wrapper strategy for React/Vite projects', () => {
  const analysis: AnalysisResult = { projectType: 'React/Vite Web App', confidence: 90, evidence: ['package.json detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'web-wrapper');
  assert.strictEqual(strategy.outputArtifact, 'app-wrapper-debug.apk');
});

test('Determines Capacitor strategy for Capacitor projects', () => {
  const analysis: AnalysisResult = { projectType: 'Capacitor', confidence: 98, evidence: ['Capacitor configuration detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'capacitor');
  assert.ok(strategy.buildSteps.some((step) => step.includes('Capacitor sync')));
});

test('Determines Flutter strategy for Flutter projects', () => {
  const analysis: AnalysisResult = { projectType: 'Flutter', confidence: 99, evidence: ['pubspec.yaml detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'flutter');
  assert.strictEqual(strategy.outputArtifact, 'app-debug.apk');
  assert.ok(strategy.buildSteps.some((step) => step.includes('flutter build apk')));
});

test('Determines dedicated React Native strategy', () => {
  const analysis: AnalysisResult = { projectType: 'React Native', confidence: 97, evidence: ['React Native dependency detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'react-native');
  assert.ok(strategy.buildSteps.some((step) => step.includes('Android Gradle')));
});

test('Determines dedicated Expo strategy', () => {
  const analysis: AnalysisResult = { projectType: 'Expo', confidence: 92, evidence: ['Expo project markers detected'], warnings: [] };
  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'react-native');
  assert.ok(strategy.buildSteps.some((step) => step.includes('Expo prebuild')));
});
