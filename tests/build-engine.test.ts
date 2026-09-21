import { test } from 'node:test';
import assert from 'node:assert';
import { commandFor } from '../lib/build-engine/src/index.ts';

test('Flutter build strategy selects a runnable Flutter executor', () => {
  const command = commandFor({
    framework: 'Flutter',
    version: null,
    buildTool: 'Flutter',
    language: 'Dart',
    packageManager: 'Unknown',
    projectType: 'Flutter application',
    confidence: 99,
    compatibilityScore: 95,
    warnings: [],
    blockers: [],
    recommendedStrategy: 'flutter pub get then flutter build apk --debug',
    evidence: ['pubspec.yaml', 'lib/main.dart'],
  });
  assert.strictEqual(command.command, 'sh');
  const shellCommand = command.args.join(' ');
  assert.ok(shellCommand.includes("FLUTTER=flutter"));
  assert.ok(shellCommand.includes("FLUTTER='proot-distro login ubuntu -- /opt/flutter/bin/flutter'"));
  assert.ok(shellCommand.includes('$FLUTTER pub get'));
  assert.ok(shellCommand.includes('$FLUTTER build apk --debug'));
});

test('React Native build strategy selects local Android Gradle build', () => {
  const command = commandFor({
    framework: 'React Native',
    version: null,
    buildTool: 'Gradle',
    language: 'JavaScript',
    packageManager: 'npm',
    projectType: 'React Native application',
    confidence: 97,
    compatibilityScore: 94,
    warnings: [],
    blockers: [],
    recommendedStrategy: 'Install dependencies, then build Android with Gradle',
    evidence: ['React Native dependency'],
  });
  assert.strictEqual(command.command, 'sh');
  assert.ok(command.args.join(' ').includes('cd android && ./gradlew assembleDebug'));
});
