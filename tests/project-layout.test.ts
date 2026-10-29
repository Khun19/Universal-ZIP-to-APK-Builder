import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';
import { resolveProjectLayout } from '../lib/project-layout.ts';
import { nodeInstallCommand, recoverPnpmWorkspaceConfig } from '../lib/worker.ts';

async function withTemp<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(path.join(tmpdir(), 'builder-project-layout-'));
  try { return await fn(root); } finally { await rm(root, { recursive: true, force: true }); }
}
async function put(root: string, relative: string, content: string): Promise<void> {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

test('root Expo project remains selected without repacking', async () => withTemp(async root => {
  await put(root, 'package.json', JSON.stringify({ name: 'root-app', dependencies: { expo: '~52.0.0', 'react-native': '0.76.0' } }));
  await put(root, 'app.json', JSON.stringify({ expo: { name: 'Root App' } }));
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'selected');
  assert.equal(layout.relativeAppRoot, '.');
  assert.equal(layout.framework, 'Expo');
}));

test('monorepo selects one nested Expo app and preserves workspace root', async () => withTemp(async root => {
  await put(root, 'package.json', JSON.stringify({ name: 'repo', private: true, workspaces: ['artifacts/*'], devDependencies: { typescript: 'catalog:' } }));
  await put(root, 'pnpm-workspace.yaml', 'packages:\n  - artifacts/*\ncatalog:\n  typescript: ^5.9.0\n');
  await put(root, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  await put(root, 'artifacts/focus-mode/package.json', JSON.stringify({
    name: 'focus-mode',
    dependencies: { expo: 'catalog:', 'react-native': '0.76.0' },
  }));
  await put(root, 'artifacts/focus-mode/app.json', JSON.stringify({ expo: { name: 'Focus Mode' } }));
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'selected');
  assert.equal(layout.relativeAppRoot, 'artifacts/focus-mode');
  assert.equal(layout.relativeWorkspaceRoot, '.');
  assert.equal(layout.framework, 'Expo');
  assert.ok(layout.dependencyProtocols.some(value => value === 'expo=catalog:'));
}));

test('multiple nested app roots stop with an actionable ambiguity diagnostic', async () => withTemp(async root => {
  await put(root, 'artifacts/first/package.json', JSON.stringify({ dependencies: { expo: '^52.0.0' } }));
  await put(root, 'artifacts/second/package.json', JSON.stringify({ dependencies: { expo: '^52.0.0' } }));
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'ambiguous');
  assert.match(layout.error ?? '', /Multiple buildable app roots/);
  assert.equal(layout.candidates.length, 2);
}));

test('workspace protocol without a workspace root is blocked before install', async () => withTemp(async root => {
  await put(root, 'artifacts/focus-mode/package.json', JSON.stringify({ dependencies: { expo: 'workspace:*' } }));
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'blocked');
  assert.match(layout.error ?? '', /workspace root/);
}));

test('catalog protocol without pnpm workspace configuration is blocked', async () => withTemp(async root => {
  await put(root, 'package.json', JSON.stringify({ name: 'repo', private: true }));
  await put(root, 'package-lock.json', JSON.stringify({ lockfileVersion: 3 }));
  await put(root, 'artifacts/focus-mode/package.json', JSON.stringify({ dependencies: { expo: 'catalog:' } }));
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'blocked');
  assert.match(layout.error ?? '', /workspace root/);
}));

test('nested app dependency installation uses the uploaded pnpm workspace root', async () => withTemp(async temp => {
  const extraction = path.join(temp, '.workspace', 'cli-build-test');
  await put(extraction, 'package.json', JSON.stringify({ name: 'repo', private: true }));
  await put(extraction, 'pnpm-workspace.yaml', 'packages:\\n  - artifacts/*\\n');
  await put(extraction, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\\n');
  await put(extraction, 'artifacts/focus-mode/package.json', JSON.stringify({ dependencies: { expo: '^52.0.0' } }));
  const plan = nodeInstallCommand(path.join(extraction, 'artifacts', 'focus-mode'));
  assert.equal(plan.cwd, extraction);
  assert.match(plan.command, /pnpm install/);
  assert.match(plan.command, /--frozen-lockfile/);
}));

test('native Android Gradle project without package.json is still detected', async () => withTemp(async root => {
  await put(root, 'settings.gradle', "rootProject.name = 'native-fixture'\\ninclude ':app'\\n");
  await put(root, 'build.gradle', 'plugins {}\\n');
  await put(root, 'app/build.gradle', 'plugins { id \'com.android.application\' }\\n');
  await put(root, 'app/src/main/AndroidManifest.xml', '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.fixture" />');
  const layout = resolveProjectLayout(root);
  assert.equal(layout.status, 'selected');
  assert.equal(layout.relativeAppRoot, '.');
  assert.equal(layout.framework, 'Native Android');
}));

test('missing pnpm workspace config is reconstructed from explicit package.json metadata', async () => withTemp(async temp => {
  const extraction = path.join(temp, '.workspace', 'cli-build-recovery');
  await put(extraction, 'package.json', JSON.stringify({
    name: 'repo',
    private: true,
    workspaces: {
      packages: ['artifacts/*'],
      catalog: { expo: '52.0.49', react: '18.3.1', 'react-native': '0.76.9' },
    },
  }));
  await put(extraction, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\\n');
  await put(extraction, 'artifacts/focus-mode/package.json', JSON.stringify({
    dependencies: { expo: 'catalog:', react: 'catalog:', 'react-native': 'catalog:' },
  }));
  const appRoot = path.join(extraction, 'artifacts', 'focus-mode');
  const layout = resolveProjectLayout(extraction);
  assert.equal(layout.status, 'selected');
  const result = recoverPnpmWorkspaceConfig(appRoot);
  assert.equal(result.recovered, true);
  assert.equal(result.workspaceRoot, extraction);
  const generated = await import('node:fs/promises').then(fs => fs.readFile(path.join(extraction, 'pnpm-workspace.yaml'), 'utf8'));
  assert.match(generated, /artifacts\/\*/);
  assert.match(generated, /catalog:/);
  assert.match(generated, /react-native/);
  const parsed = parseYaml(generated) as { packages?: unknown[]; catalog?: Record<string, unknown> };
  assert.deepEqual(parsed.packages, ['artifacts/*']);
  assert.equal(parsed.catalog?.expo, '52.0.49');
  assert.equal(parsed.catalog?.react, '18.3.1');
  assert.equal(parsed.catalog?.['react-native'], '0.76.9');
}));

test('workspace recovery refuses catalog references without an explicit catalog map', async () => withTemp(async temp => {
  const extraction = path.join(temp, '.workspace', 'cli-build-no-catalog');
  await put(extraction, 'package.json', JSON.stringify({ name: 'repo', private: true, workspaces: ['artifacts/*'] }));
  await put(extraction, 'pnpm-lock.yaml', 'lockfileVersion: 9.0\\n');
  await put(extraction, 'artifacts/focus-mode/package.json', JSON.stringify({ dependencies: { expo: 'catalog:' } }));
  const result = recoverPnpmWorkspaceConfig(path.join(extraction, 'artifacts', 'focus-mode'));
  assert.equal(result.recovered, false);
  assert.match(result.error ?? '', /no workspaces.catalog map/);
}));
