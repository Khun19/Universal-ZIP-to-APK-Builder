import { test } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runBuildPipeline } from '../lib/pipeline.ts';

test(
  'builds the tracked Flutter fixture into a validated Android APK',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 20 * 60 * 1000 },
  async () => {
    const fixtureDir = path.resolve('./tests/fixtures/flutter-project');
    const fixtureFiles = ['pubspec.yaml', 'lib/main.dart'];
    const result = await runBuildPipeline({
      buildId: 'm5-flutter-direct-integration',
      files: fixtureFiles.map((relativePath) => ({
        relativePath,
        content: fs.readFileSync(path.join(fixtureDir, relativePath), 'utf8'),
      })),
    });

    assert.strictEqual(result.success, true, result.error || result.logs.join('\n'));
    assert.strictEqual(result.projectType, 'Flutter');
    assert.strictEqual(result.strategyName, 'flutter');
    assert.ok(result.outputPath?.endsWith('.apk'));

    const apkPath = result.outputPath as string;
    const apkStats = fs.statSync(apkPath);
    assert.ok(apkStats.isFile());
    assert.ok(apkStats.size > 0);

    const zipEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' });
    assert.match(zipEntries, /^AndroidManifest\.xml$/m);

    const badging = execFileSync('aapt', ['dump', 'badging', apkPath], { encoding: 'utf8' });
    assert.match(badging, /package: name='com\.[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+'/);

    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex');
    assert.match(sha256, /^[a-f0-9]{64}$/);
    assert.ok(result.logs.some((log) => log.includes('flutter pub get')));
    assert.ok(result.logs.some((log) => log.includes('flutter build apk --debug')));
    assert.ok(result.logs.some((log) => log.includes('Verified real Flutter APK')));
  },
);
