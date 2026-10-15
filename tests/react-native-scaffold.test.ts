import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { communityCliVersionForReactNative, generateReactNativeAndroidScaffold } from '../lib/react-native-scaffold.ts';

test('pins React Native Community CLI to the verified framework minor', () => {
  assert.equal(communityCliVersionForReactNative('0.76.9'), '15.0.1');
  assert.equal(communityCliVersionForReactNative('0.75.4'), '14.1.0');
  assert.equal(communityCliVersionForReactNative('0.74.7'), '13.6.9');
  assert.equal(communityCliVersionForReactNative('latest'), undefined);
  assert.equal(communityCliVersionForReactNative('^0.76.0'), undefined);
  assert.equal(communityCliVersionForReactNative('0.80.0'), undefined);
});

test('refuses to overwrite an existing Android project', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-scaffold-test-'));
  try {
    fs.mkdirSync(path.join(root, 'android'));
    await assert.rejects(
      () => generateReactNativeAndroidScaffold(root, '0.76.9'),
      /Refusing to generate a scaffold over an existing android\//,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('refuses an unknown React Native CLI compatibility mapping', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-scaffold-test-'));
  try {
    fs.mkdirSync(path.join(root, 'node_modules', 'react-native'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'node_modules', 'react-native', 'package.json'),
      JSON.stringify({ version: '0.80.0' }),
    );
    await assert.rejects(
      () => generateReactNativeAndroidScaffold(root, '0.80.0'),
      /No verified React Native Community CLI compatibility mapping/,
    );
    assert.equal(fs.existsSync(path.join(root, 'android')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
