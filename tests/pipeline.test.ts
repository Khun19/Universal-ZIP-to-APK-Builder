import { test } from 'node:test';
import assert from 'node:assert';
import { runBuildPipeline } from '../lib/pipeline.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';

test(
  'builds the tracked Vite PWA fixture into a validated Android APK',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 12 * 60 * 1000 },
  async () => {
  const fixtureDir = path.resolve('./tests/fixtures/vite-pwa-project');
  const fixtureFiles = [
    'package.json',
    'index.html',
    'vite.config.js',
    'src/main.js',
    'public/icon.svg',
  ];
  const buildInput = {
    buildId: 'm4-vite-pwa-android-integration',
    files: fixtureFiles.map((relativePath) => ({
      relativePath,
      content: fs.readFileSync(path.join(fixtureDir, relativePath), 'utf8'),
    })),
  };

  const result = await runBuildPipeline(buildInput);

  assert.strictEqual(result.success, true, result.error || result.logs.join('\n'));
  assert.strictEqual(result.projectType, 'React/Vite Web App');
  assert.strictEqual(result.strategyName, 'web-wrapper');
  assert.ok(result.outputPath?.endsWith('.apk'));
  assert.ok(result.outputPath && fs.statSync(result.outputPath).size > 0);
  assert.ok(result.logs.some((log) => log.includes('PWA manifest verified')));
  assert.ok(result.logs.some((log) => log.includes('PWA service worker verified')));
  assert.ok(result.logs.some((log) => log.includes('Verified real APK')));

  const apkPath = result.outputPath as string;
  const zipEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' });
  assert.match(zipEntries, /^AndroidManifest\.xml$/m);

  const badging = execFileSync('aapt', ['dump', 'badging', apkPath], { encoding: 'utf8' });
  assert.match(badging, /package: name='com\.builder\.m4vitepwafixture'/);

  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex');
  assert.match(sha256, /^[a-f0-9]{64}$/);
  },
);
