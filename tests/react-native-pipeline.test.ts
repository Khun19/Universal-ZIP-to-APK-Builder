import { test } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runBuildPipeline } from '../lib/pipeline.ts';

test(
  'builds the tracked React Native fixture into a validated Android APK',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 20 * 60 * 1000 },
  async () => {
    const fixtureDir = path.resolve('./tests/fixtures/react-native-project');
    const fixtureFiles = [
      'package.json',
      'index.js',
      'App.js',
      'react-native.config.js',
      'metro.config.js',
      'android/settings.gradle',
      'android/build.gradle',
      'android/gradle.properties',
      'android/app/build.gradle',
      'android/app/src/main/AndroidManifest.xml',
      'android/app/src/main/java/com/builder/m6reactnative/MainActivity.java',
      'android/app/src/main/java/com/builder/m6reactnative/MainApplication.java',
      'android/app/src/main/res/values/styles.xml',
    ];
    const result = await runBuildPipeline({
      buildId: 'm6-react-native-direct-integration',
      files: fixtureFiles.map((relativePath) => ({
        relativePath,
        content: fs.readFileSync(path.join(fixtureDir, relativePath), 'utf8'),
      })),
    });

    assert.strictEqual(result.success, true, result.error || result.logs.join('\n'));
    assert.strictEqual(result.projectType, 'React Native');
    assert.strictEqual(result.strategyName, 'react-native');
    assert.ok(result.outputPath?.endsWith('.apk'));

    const apkPath = result.outputPath as string;
    const stats = fs.statSync(apkPath);
    assert.ok(stats.isFile());
    assert.ok(stats.size > 0);
    assert.match(execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' }), /^AndroidManifest\.xml$/m);
    assert.match(
      execFileSync('aapt', ['dump', 'badging', apkPath], { encoding: 'utf8' }),
      /package: name='com\.builder\.m6reactnative'/,
    );
    const apkEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' });
    assert.match(apkEntries, /^assets\/index\.android\.bundle$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libreactnative\.so$/m);
    assert.match(crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex'), /^[a-f0-9]{64}$/);
    assert.ok(result.logs.some((log) => log.includes('Installing React Native dependencies')));
    assert.ok(result.logs.some((log) => log.includes('Verified real APK')));
  },
);
