import { test } from 'node:test';
import assert from 'node:assert';
import { executeBuildJob } from '../lib/worker.ts';
import { BuildStrategy } from '../lib/strategy.ts';
import * as fs from 'fs';
import * as path from 'path';

test('Executes native gradle build job successfully', async () => {
  const projectPath = path.resolve('./.tmp-worker-test');
  fs.mkdirSync(projectPath, { recursive: true });

  const strategy: BuildStrategy = {
    strategyName: 'native-gradle',
    buildSteps: ['Run ./gradlew assembleDebug'],
    outputArtifact: 'app-debug.apk'
  };

  const result = await executeBuildJob(projectPath, strategy);
  assert.strictEqual(result.success, true);
  assert.ok(result.logs.length > 0);

  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('Fails gracefully on unknown strategy', async () => {
  const strategy: BuildStrategy = {
    strategyName: 'unknown',
    buildSteps: [],
    outputArtifact: ''
  };

  const result = await executeBuildJob('./.tmp-mock-unknown', strategy);
  assert.strictEqual(result.success, false);
  assert.ok(result.error);

  if (fs.existsSync('./.tmp-mock-unknown')) {
    fs.rmSync('./.tmp-mock-unknown', { recursive: true, force: true });
  }
});
