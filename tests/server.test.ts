import { test } from 'node:test';
import assert from 'node:assert';
import { handleBuildRequest } from '../lib/server.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

test(
  'Handles complete build request pipeline successfully',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1' },
  async () => {
  const projectPath = path.resolve('./.tmp-server-test');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify({
      name: 'test',
      private: true,
      scripts: { build: 'vite build' },
      devDependencies: { vite: '^7.3.2' },
    }),
  );
  fs.writeFileSync(
    path.join(projectPath, 'index.html'),
    '<!doctype html><html><body><h1>Integration fixture</h1></body></html>',
  );
  fs.writeFileSync(path.join(projectPath, 'vite.config.ts'), '');

  const payload = {
    projectPath,
    filePaths: ['package.json', 'index.html', 'vite.config.ts']
  };

  try {
    const response = await handleBuildRequest(payload);
    assert.strictEqual(response.success, true, response.error || response.logs.join('\n'));
    assert.strictEqual(response.projectType, 'React/Vite Web App');
    assert.strictEqual(response.strategyName, 'web-wrapper');
    assert.ok(response.logs.length > 0);
  } finally {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  }
  },
);

test('Rejects malicious path in build request', async () => {
  const payload = {
    projectPath: './.tmp-malicious-app',
    filePaths: ['../../etc/passwd', 'package.json']
  };

  const response = await handleBuildRequest(payload);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Path traversal or invalid file path detected');
});

test('Build request dry-run returns readiness and never invokes the worker', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'server-dry-run-'));
  const projectPath = path.join(root, 'source');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'index.html'), '<main>dry run</main>');
  const response = await handleBuildRequest({ projectPath, filePaths: ['index.html'], dryRun: true });
  assert.strictEqual(response.success, true, response.error);
  assert.strictEqual(response.dryRun, true);
  assert.strictEqual(response.buildReady, true);
  assert.strictEqual(response.outputPath, undefined);
  assert.strictEqual(fs.readFileSync(path.join(projectPath, 'index.html'), 'utf8'), '<main>dry run</main>');
  fs.rmSync(root, { recursive: true, force: true });
});

test('Build request blocks before worker handoff when a required workspace package is absent', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'server-repair-blocked-'));
  const projectPath = path.join(root, 'source');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'fixture', dependencies: { expo: '52.0.0', '@workspace/missing': 'workspace:*' } }));
  fs.writeFileSync(path.join(projectPath, 'package-lock.json'), '{"name":"fixture","lockfileVersion":3,"packages":{}}');
  fs.writeFileSync(path.join(projectPath, 'app.json'), '{"expo":{}}');
  const response = await handleBuildRequest({ projectPath, filePaths: ['package.json', 'package-lock.json', 'app.json'] });
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.buildReady, false);
  assert.ok(response.repairIssues?.some((entry) => entry.rule === 'workspace-dependency' && entry.classification === 'BLOCKED'));
  assert.strictEqual(response.outputPath, undefined);
  fs.rmSync(root, { recursive: true, force: true });
});
