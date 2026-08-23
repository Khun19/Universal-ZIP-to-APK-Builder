import { test } from 'node:test';
import assert from 'node:assert';
import { determineBuildStrategy } from '../lib/strategy.ts';
import { AnalysisResult } from '../lib/analyzer.ts';

test('Determines native gradle strategy for Android projects', () => {
  const analysis: AnalysisResult = {
    projectType: 'Native Android',
    confidence: 95,
    evidence: ['build.gradle detected'],
    warnings: []
  };

  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'native-gradle');
  assert.ok(strategy.buildSteps.length > 0);
});

test('Determines web wrapper strategy for React/Vite projects', () => {
  const analysis: AnalysisResult = {
    projectType: 'React/Vite Web App',
    confidence: 90,
    evidence: ['package.json detected'],
    warnings: []
  };

  const strategy = determineBuildStrategy(analysis);
  assert.strictEqual(strategy.strategyName, 'web-wrapper');
  assert.strictEqual(strategy.outputArtifact, 'app-wrapper-debug.apk');
});
