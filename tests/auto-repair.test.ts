import { test } from 'node:test';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { runAutoRepair } from '../lib/auto-repair.ts';
import { inspectAdmZip, safeExtractAdmZip } from '../lib/security/src/index.ts';

const fakeLock = async () => `${JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: { '': { name: 'fixture' } } }, null, 2)}\n`;

async function fixture(t: { after(fn: () => void | Promise<void>): void }, files: Record<string, string>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-repair-test-'));
  t.after(async () => {
    const parent = path.dirname(root);
    const prefix = `${path.basename(root)}-repair-`;
    for (const name of await fs.readdir(parent)) {
      if (name.startsWith(prefix)) await fs.rm(path.join(parent, name), { recursive: true, force: true });
    }
    await fs.rm(root, { recursive: true, force: true });
  });
  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(root, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents);
  }
  return root;
}

function manifest(value: Record<string, unknown>) { return JSON.stringify(value, null, 2); }
function digest(data: Buffer) { return createHash('sha256').update(data).digest('hex'); }

function rawZip(names: string[]): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const name of names) {
    const filename = Buffer.from(name);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(filename.length, 26);
    local.push(header, filename);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, filename);
    offset += header.length + filename.length;
  }
  const centralData = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralData, end]);
}

test('missing lockfile is generated when deterministic resolution succeeds', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', version: '1.0.0', dependencies: { expo: '52.0.0' } }),
    'app.json': '{"expo":{"name":"Fixture"}}',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, true);
  assert.ok(result.evidence.some((entry) => entry.repairRule === 'missing-lockfile'));
  assert.ok(await fs.stat(path.join(result.projectPath, 'package-lock.json')));
});

test('missing lockfile is blocked when dependency resolution is ambiguous', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: '*' } }), 'app.json': '{"expo":{}}' });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: async () => { throw new Error('registry cannot resolve expo'); } });
  assert.equal(result.buildReady, false);
  assert.equal(result.blocker?.rule, 'missing-lockfile');
  assert.match(result.blocker?.reason ?? '', /cannot resolve/);
});

test('available workspace dependency is normalized to its local source', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', dependencies: { '@workspace/api': 'workspace:*', expo: '52.0.0' } }),
    'app.json': '{"expo":{}}',
    'packages/api/package.json': manifest({ name: '@workspace/api', version: '2.1.0' }),
    'packages/api/index.js': 'export {};',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json', 'packages/api/package.json', 'packages/api/index.js'], { resolveLockfile: fakeLock });
  const output = JSON.parse(await fs.readFile(path.join(result.projectPath, 'package.json'), 'utf8'));
  assert.equal(output.dependencies['@workspace/api'], 'file:./packages/api');
  assert.ok(result.evidence.some((entry) => entry.repairRule === 'workspace-dependency'));
});

test('missing workspace package is blocked without fabricating it', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { '@workspace/api': 'workspace:^' } }) });
  const result = await runAutoRepair(root, ['package.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, false);
  assert.equal(result.blocker?.classification, 'BLOCKED');
  assert.match(result.blocker?.requiredInput ?? '', /@workspace\/api/);
  assert.equal(await fs.stat(path.join(result.projectPath, 'packages/api')).then(() => true, () => false), false);
});

test('available catalog dependency resolves from project metadata', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', workspaces: { packages: ['packages/*'], catalog: { expo: '52.0.0' } }, dependencies: { expo: 'catalog:' } }),
    'app.json': '{"expo":{}}',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: fakeLock });
  const output = JSON.parse(await fs.readFile(path.join(result.projectPath, 'package.json'), 'utf8'));
  assert.equal(output.dependencies.expo, '52.0.0');
  assert.ok(result.evidence.some((entry) => entry.repairRule === 'catalog-dependency'));
});

test('missing catalog entry is blocked and not invented', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: 'catalog:' } }) });
  const result = await runAutoRepair(root, ['package.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, false);
  assert.equal(result.blocker?.rule, 'catalog-dependency');
  assert.match(result.blocker?.requiredInput ?? '', /catalog entry/);
});

test('available external TypeScript project reference is retained in isolated workspace', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }),
    'app.json': '{"expo":{}}',
    'apps/mobile/tsconfig.json': JSON.stringify({ references: [{ path: '../../lib/shared' }] }),
    'lib/shared/tsconfig.json': '{}',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json', 'apps/mobile/tsconfig.json', 'lib/shared/tsconfig.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, true);
  assert.ok(result.evidence.some((entry) => entry.repairRule === 'external-project-reference'));
  assert.ok(await fs.stat(path.join(result.projectPath, 'lib/shared/tsconfig.json')));
});

test('missing external source is blocked with the exact reference', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { api: 'file:../../lib/api-client-react' } }) });
  const result = await runAutoRepair(root, ['package.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, false);
  assert.equal(result.blocker?.rule, 'external-project-reference');
  assert.equal((result.blocker?.value as { value: string }).value, 'file:../../lib/api-client-react');
});

test('managed Expo project without android is classified for existing prebuild strategy', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }), 'app.json': '{"expo":{}}' });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, true);
  assert.ok(result.issues.some((entry) => entry.rule === 'managed-expo-android-generation' && entry.classification === 'AUTO_REPAIR'));
  assert.equal(await fs.stat(path.join(result.projectPath, 'android')).then(() => true, () => false), false);
});

test('Expense Tracker-like input applies available repairs but blocks on missing workspace source and catalog', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({
      name: 'expense-mobile',
      dependencies: { expo: '52.0.0', '@workspace/ui': 'workspace:*', '@workspace/api-client-react': 'workspace:*', react: 'catalog:' },
    }),
    'app.json': '{"expo":{}}',
    'packages/ui/package.json': manifest({ name: '@workspace/ui', version: '1.0.0' }),
    'packages/ui/index.js': 'export {};',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json', 'packages/ui/package.json', 'packages/ui/index.js'], { resolveLockfile: fakeLock });
  const repaired = JSON.parse(await fs.readFile(path.join(result.projectPath, 'package.json'), 'utf8'));
  assert.equal(result.buildReady, false);
  assert.equal(repaired.dependencies['@workspace/ui'], 'file:./packages/ui');
  assert.equal(repaired.dependencies['@workspace/api-client-react'], 'workspace:*');
  assert.ok(result.issues.some((entry) => entry.rule === 'workspace-dependency' && entry.classification === 'BLOCKED' && (entry.value as { name: string }).name === '@workspace/api-client-react'));
  assert.ok(result.issues.some((entry) => entry.rule === 'catalog-dependency' && entry.classification === 'BLOCKED'));
  assert.ok(result.evidence.some((entry) => entry.repairRule === 'workspace-dependency'));
  assert.equal(await fs.stat(path.join(result.projectPath, 'package-lock.json')).then(() => true, () => false), false);
});

test('ZIP traversal paths are rejected before extraction', () => {
  assert.throws(() => inspectAdmZip(new AdmZip(rawZip(['../escape.txt']))), /Unsafe archive path/);
  assert.throws(() => inspectAdmZip(new AdmZip(rawZip(['/absolute.txt']))), /Unsafe archive path/);
});

test('duplicate normalized ZIP entries are rejected', () => {
  assert.throws(() => inspectAdmZip(new AdmZip(rawZip(['folder\\same.txt', 'folder/same.txt']))), /Duplicate archive entry/);
});

test('ZIP symbolic links are rejected before extraction', () => {
  const zip = new AdmZip();
  zip.addFile('link', Buffer.from('../target'));
  (zip.getEntries()[0] as unknown as { attr: number }).attr = (0o120777 << 16) >>> 0;
  assert.throws(() => inspectAdmZip(zip), /Symbolic links are not allowed/);
});

test('extraction cannot follow a pre-existing symlink out of its workspace', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-repair-extract-link-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const destination = path.join(root, 'workspace');
  const outside = path.join(root, 'outside');
  await fs.mkdir(destination);
  await fs.mkdir(outside);
  await fs.symlink(outside, path.join(destination, 'link'));
  const zip = new AdmZip(rawZip(['link/escape.txt']));
  assert.throws(() => safeExtractAdmZip(zip, destination), /Blocked ZIP parent path/);
  assert.equal(await fs.stat(path.join(outside, 'escape.txt')).then(() => true, () => false), false);
});

test('arbitrary lifecycle scripts are not run during analysis or repair', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', scripts: { preinstall: 'touch SHOULD_NOT_EXIST' }, dependencies: { expo: '52.0.0' } }),
    'app.json': '{"expo":{}}',
  });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: fakeLock });
  assert.equal(result.buildReady, true);
  assert.equal(await fs.stat(path.join(root, 'SHOULD_NOT_EXIST')).then(() => true, () => false), false);
});

test('default npm lockfile resolution disables lifecycle scripts', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', scripts: { preinstall: 'node -e "require(\'fs\').writeFileSync(process.env.REPAIR_SCRIPT_SENTINEL, \'ran\')"' } }),
    'app.json': '{"expo":{}}',
  });
  const sentinel = path.join(root, 'lifecycle-ran');
  const previous = process.env.REPAIR_SCRIPT_SENTINEL;
  process.env.REPAIR_SCRIPT_SENTINEL = sentinel;
  try {
    const result = await runAutoRepair(root, ['package.json', 'app.json']);
    assert.equal(result.buildReady, true, result.blocker?.reason);
    assert.ok(await fs.stat(path.join(result.projectPath, 'package-lock.json')));
    assert.equal(await fs.stat(sentinel).then(() => true, () => false), false);
  } finally {
    if (previous === undefined) delete process.env.REPAIR_SCRIPT_SENTINEL;
    else process.env.REPAIR_SCRIPT_SENTINEL = previous;
  }
});

test('pnpm resolver output is written to the manager-matched lockfile', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', packageManager: 'pnpm@10.0.0' }),
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'app.json': '{"expo":{}}',
  });
  const result = await runAutoRepair(root, ['package.json', 'pnpm-workspace.yaml', 'app.json'], {
    resolveLockfile: async (value) => {
      assert.equal(value.packageManager, 'pnpm@10.0.0');
      return { fileName: 'pnpm-lock.yaml', content: "lockfileVersion: '9.0'\n" };
    },
  });
  assert.equal(result.buildReady, true, result.blocker?.reason);
  assert.ok(await fs.stat(path.join(result.projectPath, 'pnpm-lock.yaml')));
});

test('original ZIP bytes remain unchanged through extraction and repair', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-repair-zip-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const zipPath = path.join(temp, 'input.zip');
  const zip = new AdmZip();
  zip.addFile('package.json', Buffer.from(manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } })));
  zip.addFile('app.json', Buffer.from('{"expo":{}}'));
  zip.writeZip(zipPath);
  const original = await fs.readFile(zipPath);
  const extraction = safeExtractAdmZip(new AdmZip(zipPath), path.join(temp, 'input'));
  await runAutoRepair(extraction.extractedPath, extraction.filePaths, { inputZipHash: digest(original), resolveLockfile: fakeLock });
  assert.equal(digest(await fs.readFile(zipPath)), digest(original));
});

test('repair evidence has auditable fields and input hash', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }), 'app.json': '{"expo":{}}' });
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { inputZipHash: 'a'.repeat(64), resolveLockfile: fakeLock });
  const evidence = result.evidence.find((entry) => entry.repairRule === 'missing-lockfile');
  assert.ok(evidence);
  assert.ok(evidence?.repairId && evidence.issueId && evidence.timestamp && evidence.workspacePath);
  assert.equal(evidence?.inputZipHash, 'a'.repeat(64));
  assert.ok(evidence?.sourceEvidence.length);
  assert.ok(evidence?.repairedProjectHash);
  const persisted = JSON.parse(await fs.readFile(path.join(result.projectPath, '.builder/auto-repair-evidence.json'), 'utf8'));
  assert.equal(persisted.length, result.evidence.length);
});

test('running repair again on repaired workspace makes no further repairs', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }), 'app.json': '{"expo":{}}' });
  const first = await runAutoRepair(root, ['package.json', 'app.json'], { resolveLockfile: fakeLock });
  const before = await fs.readFile(path.join(first.projectPath, 'package.json'), 'utf8');
  const second = await runAutoRepair(first.projectPath, first.filePaths, { resolveLockfile: fakeLock });
  const after = await fs.readFile(path.join(second.projectPath, 'package.json'), 'utf8');
  assert.deepEqual(second.plan, []);
  assert.equal(second.evidence.length, 0);
  assert.equal(after, before);
});

test('dry-run reports intended repairs without mutating its workspace', async (t) => {
  const root = await fixture(t, { 'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }), 'app.json': '{"expo":{}}' });
  const before = digest(Buffer.from(await fs.readFile(path.join(root, 'package.json'))));
  const result = await runAutoRepair(root, ['package.json', 'app.json'], { dryRun: true, resolveLockfile: fakeLock });
  const after = digest(Buffer.from(await fs.readFile(path.join(root, 'package.json'))));
  assert.equal(result.dryRun, true);
  assert.ok(result.plan.length > 0);
  assert.equal(result.evidence.length, 0);
  assert.equal(after, before);
  assert.equal(result.projectPath, root);
});

test('already-ready project produces zero repair operations', async (t) => {
  const root = await fixture(t, {
    'package.json': manifest({ name: 'fixture', dependencies: { expo: '52.0.0' } }),
    'package-lock.json': '{"name":"fixture","lockfileVersion":3,"packages":{}}',
    'android/settings.gradle': 'rootProject.name="fixture"',
  });
  const result = await runAutoRepair(root, ['package.json', 'package-lock.json', 'android/settings.gradle']);
  assert.equal(result.buildReady, true);
  assert.deepEqual(result.plan, []);
  assert.equal(result.evidence.length, 0);
});
