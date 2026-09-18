import { test } from 'node:test';
import assert from 'node:assert';
import { commandFor } from '../lib/build-engine/src/index.ts';

test('Flutter build strategy invokes Flutter directly', () => {
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
  assert.ok(command.args.join(' ').includes('flutter pub get'));
  assert.ok(command.args.join(' ').includes('flutter build apk --debug'));
});
