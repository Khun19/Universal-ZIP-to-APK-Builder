import { test } from 'node:test';
import assert from 'node:assert';
import { runBuildPipeline } from '../lib/pipeline.ts';
import * as fs from 'fs';
import * as path from 'path';

test('Runs complete end-to-end build pipeline successfully', async () => {
  const buildInput = {
    buildId: 'test-build-101',
    files: [
      { relativePath: 'package.json', content: '{"name": "react-app"}' },
      { relativePath: 'vite.config.ts', content: 'export default {}' },
      { relativePath: 'index.html', content: '<h1>App</h1>' }
    ]
  };

  const result = await runBuildPipeline(buildInput);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.projectType, 'React/Vite Web App');
  assert.strictEqual(result.strategyName, 'web-wrapper');
  assert.ok(result.outputPath?.endsWith('app-wrapper-debug.apk'));

  // Clean up test workspace
  const workspaceDir = path.resolve('./.workspace/test-build-101');
  if (fs.existsSync(workspaceDir)) {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  }
});
