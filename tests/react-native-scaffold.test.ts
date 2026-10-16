import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { communityCliVersionForReactNative, generateReactNativeAndroidScaffold, resolveReactNativeEntryFile } from '../lib/react-native-scaffold.ts';

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

test('resolves conventional JavaScript and TypeScript entry points deterministically', () => {
  for (const entry of ['index.js', 'index.ts', 'index.tsx']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-entry-test-'));
    try {
      fs.writeFileSync(path.join(root, entry), '// entry');
      assert.equal(resolveReactNativeEntryFile(root), entry);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test('honors a custom package.json main entry point', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-entry-test-'));
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'bootstrap.ts'), '// custom entry');
    fs.writeFileSync(path.join(root, 'index.js'), '// ignored fallback');
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ main: 'src/bootstrap.ts' }));
    assert.equal(resolveReactNativeEntryFile(root), 'src/bootstrap.ts');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fails closed for missing, ambiguous, or escaping entry points', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-entry-test-'));
  try {
    assert.throws(() => resolveReactNativeEntryFile(root), /No React Native entry point found/);
    fs.writeFileSync(path.join(root, 'index.js'), '// js');
    fs.writeFileSync(path.join(root, 'index.ts'), '// ts');
    assert.throws(() => resolveReactNativeEntryFile(root), /Ambiguous React Native entry points/);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ main: '../outside.js' }));
    assert.throws(() => resolveReactNativeEntryFile(root), /must resolve inside the project directory/);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ main: 'missing.ts' }));
    assert.throws(() => resolveReactNativeEntryFile(root), /Configured React Native entry point does not exist/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
