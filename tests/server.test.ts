import { test } from 'node:test';
import assert from 'node:assert';
import { handleBuildRequest } from '../lib/server.ts';
import * as fs from 'fs';
import * as path from 'path';

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
