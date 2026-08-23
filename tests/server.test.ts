import { test } from 'node:test';
import assert from 'node:assert';
import { handleBuildRequest } from '../lib/server.ts';
import * as fs from 'fs';
import * as path from 'path';

test('Handles complete build request pipeline successfully', async () => {
  const projectPath = path.resolve('./.tmp-server-test');
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');
  fs.writeFileSync(path.join(projectPath, 'vite.config.ts'), '');
  fs.writeFileSync(path.join(projectPath, 'src/index.tsx'), '');

  const payload = {
    projectPath,
    filePaths: ['package.json', 'vite.config.ts', 'src/index.tsx']
  };

  const response = await handleBuildRequest(payload);
  assert.strictEqual(response.success, true);
  assert.strictEqual(response.projectType, 'React/Vite Web App');
  assert.strictEqual(response.strategyName, 'web-wrapper');
  assert.ok(response.logs.length > 0);

  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('Rejects malicious path in build request', async () => {
  const payload = {
    projectPath: './.tmp-malicious-app',
    filePaths: ['../../etc/passwd', 'package.json']
  };

  const response = await handleBuildRequest(payload);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Path traversal or invalid file path detected');
});
