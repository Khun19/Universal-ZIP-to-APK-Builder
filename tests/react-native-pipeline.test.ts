import { test } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runBuildPipeline } from '../lib/pipeline.ts';

test('React Native 0.76 fixture selects one coherent Hermes runtime', () => {
  const fixtureDir = path.resolve('./tests/fixtures/react-native-project');
  const packageJson = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
  };
  const gradleProperties = fs.readFileSync(
    path.join(fixtureDir, 'android/gradle.properties'),
    'utf8',
  );
  const appGradle = fs.readFileSync(path.join(fixtureDir, 'android/app/build.gradle'), 'utf8');
  const applicationSource = fs.readFileSync(
    path.join(fixtureDir, 'android/app/src/main/java/com/builder/m6reactnative/MainApplication.java'),
    'utf8',
  );

  assert.strictEqual(packageJson.dependencies['react-native'], '0.76.9');
  assert.match(gradleProperties, /^hermesEnabled=true$/m);
  assert.match(appGradle, /implementation\(['"]com\.facebook\.react:hermes-android:0\.76\.9['"]\)/);
  assert.doesNotMatch(appGradle, /implementation[^\n]*(?:android-jsc|org\.webkit|JavaScriptCore)/i);
  assert.match(applicationSource, /isHermesEnabled\(\)[\s\S]*?BuildConfig\.IS_HERMES_ENABLED/);
  assert.match(applicationSource, /SoLoader\.init\(this, OpenSourceMergedSoMapping\.INSTANCE\);/);
});

test(
  'builds the tracked React Native fixture into a validated Android APK',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 20 * 60 * 1000 },
  async () => {
    const fixtureDir = path.resolve('./tests/fixtures/react-native-project');
    const applicationSource = fs.readFileSync(
      path.join(fixtureDir, 'android/app/src/main/java/com/builder/m6reactnative/MainApplication.java'),
      'utf8',
    );
    assert.match(applicationSource, /getUseDeveloperSupport\(\)[\s\S]*?return false;/);
    assert.match(applicationSource, /SoLoader\.init\(this, OpenSourceMergedSoMapping\.INSTANCE\);/);
    assert.match(applicationSource, /DefaultReactHost\.getDefaultReactHost\(getApplicationContext\(\), reactNativeHost\)/);
    const fixtureFiles = [
      'package.json',
      'index.js',
      'App.js',
      'hermesc-termux.sh',
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
      buildId: `m6-react-native-direct-integration-${process.pid}-${Date.now()}`,
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
    assert.match(apkEntries, /^lib\/arm64-v8a\/libhermes\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libhermestooling\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libjsi\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libfbjni\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libc\+\+_shared\.so$/m);
    assert.doesNotMatch(apkEntries, /^lib\/arm64-v8a\/lib(?:jscexecutor|jsc|jsctooling)\.so$/m);
    assert.match(crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex'), /^[a-f0-9]{64}$/);
    assert.ok(result.logs.some((log) => log.includes('Installing React Native dependencies')));
    assert.ok(result.logs.some((log) => log.includes('Verified real APK')));
  },
);
