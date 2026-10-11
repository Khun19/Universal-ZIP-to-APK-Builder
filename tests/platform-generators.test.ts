import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPlatformPreparationPlan } from '../lib/platform-generators.ts';

test('Bare React Native uses its own CLI scaffold and preserves source files', () => {
  const plan = getPlatformPreparationPlan('React Native');
  assert.equal(plan.generator, 'react-native-community-cli');
  assert.equal(plan.requiresExistingAndroid, false);
  assert.ok(plan.steps.some((step) => step.includes('exact react-native version')));
  assert.ok(plan.steps.some((step) => step.includes('Copy only the generated android/')));
  assert.ok(plan.preserveSourceFiles.includes('package.json'));
  assert.ok(plan.validation.some((step) => step.includes('MainActivity and MainApplication')));
});

test('Expo and bare React Native have different generators', () => {
  assert.equal(getPlatformPreparationPlan('Expo').generator, 'expo-prebuild');
  assert.equal(getPlatformPreparationPlan('React Native').generator, 'react-native-community-cli');
  assert.ok(getPlatformPreparationPlan('Expo').steps.some((step) => step.includes('explicit expo dependency')));
});

test('Capacitor and Flutter use their framework-owned platform tooling', () => {
  assert.equal(getPlatformPreparationPlan('Capacitor').generator, 'capacitor-add-sync');
  assert.equal(getPlatformPreparationPlan('Flutter').generator, 'flutter-create-platform');
});

test('Native Android validates the supplied platform instead of replacing it', () => {
  const plan = getPlatformPreparationPlan('Native Android');
  assert.equal(plan.generator, 'none-existing-android');
  assert.equal(plan.requiresExistingAndroid, true);
  assert.ok(plan.steps.some((step) => step.includes('do not regenerate')));
});

test('Unknown framework is blocked instead of receiving a guessed scaffold', () => {
  const plan = getPlatformPreparationPlan('Unknown');
  assert.equal(plan.generator, 'blocked-unknown');
  assert.equal(plan.requiredOutputs.length, 0);
  assert.ok(plan.steps[0].includes('do not guess'));
});

test('Returned plans are copied so callers cannot mutate the registry', () => {
  const first = getPlatformPreparationPlan('Flutter');
  first.steps.push('mutated');
  const second = getPlatformPreparationPlan('Flutter');
  assert.ok(!second.steps.includes('mutated'));
});
