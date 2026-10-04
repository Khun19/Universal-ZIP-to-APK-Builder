import { test } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runBuildPipeline } from '../lib/pipeline.ts';


test('configures Metro to see hoisted pnpm workspace dependencies', () => {
  const fixtureDir = path.resolve('./tests/fixtures/react-native-project');
  const config = require(path.join(fixtureDir, 'metro.config.js'));
  const workspaceRoot = path.resolve(fixtureDir, '../../..');
  const workspaceNodeModules = path.join(workspaceRoot, 'node_modules');
  const reactNativeTarget = fs.realpathSync(
    path.join(fixtureDir, 'node_modules/react-native'),
  );
  const babelRuntimeTarget = fs.realpathSync(
    path.join(fixtureDir, 'node_modules/@babel/runtime'),
  );

  assert.strictEqual(config.projectRoot, fixtureDir);
  assert.ok(!config.watchFolders.includes(workspaceRoot));
  assert.ok(config.watchFolders.includes(reactNativeTarget));
  assert.ok(config.watchFolders.includes(babelRuntimeTarget));
  assert.ok(config.resolver.nodeModulesPaths.includes(workspaceNodeModules));
  assert.strictEqual(config.resolver.disableHierarchicalLookup, true);
});

test(
  'validates the tracked React Native APK structure after native Android compilation',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 20 * 60 * 1000 },
  async () => {
    const fixtureDir = path.resolve('./tests/fixtures/react-native-project');
    const applicationSource = fs.readFileSync(
      path.join(fixtureDir, 'android/app/src/main/java/com/builder/m6reactnative/MainApplication.java'),
      'utf8',
    );
    assert.match(applicationSource, /getUseDeveloperSupport\(\)[\s\S]*?return false;/);
    assert.match(applicationSource, /SoLoader\.init\(this, OpenSourceMergedSoMapping(?:\.INSTANCE)?\)/);
    assert.match(applicationSource, /DefaultNewArchitectureEntryPoint\.load\(\)/);
    assert.match(
      fs.readFileSync(path.join(fixtureDir, 'android/settings.gradle'), 'utf8'),
      /includeBuild\('\.\.\/node_modules\/@react-native\/gradle-plugin'\)/,
    );
    assert.match(
      fs.readFileSync(path.join(fixtureDir, 'android/app/build.gradle'), 'utf8'),
      /id 'com\.facebook\.react'/,
    );
    assert.match(
      fs.readFileSync(path.join(fixtureDir, 'android/gradle.properties'), 'utf8'),
      /^hermesEnabled=true$/m,
    );
    assert.match(
      fs.readFileSync(path.join(fixtureDir, 'android/gradle.properties'), 'utf8'),
      /^newArchEnabled=true$/m,
    );
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
    assert.strictEqual(execFileSync('unzip', ['-t', apkPath], { encoding: 'utf8' }).includes('No errors detected'), true);
    assert.match(execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' }), /^AndroidManifest\.xml$/m);
    assert.match(
      execFileSync('aapt', ['dump', 'badging', apkPath], { encoding: 'utf8' }),
      /package: name='com\.builder\.m6reactnative'/,
    );
    const apkEntries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' });
    assert.match(apkEntries, /^assets\/index\.android\.bundle$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libreactnative\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libjsi\.so$/m);
    assert.match(apkEntries, /^lib\/arm64-v8a\/libfbjni\.so$/m);
    assert.match(apkEntries, /libhermes\.so/);
    assert.doesNotMatch(apkEntries, /libjscexecutor\.so/);
    assert.match(crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex'), /^[a-f0-9]{64}$/);
    assert.ok(result.logs.some((log) => log.includes('Installing React Native dependencies')));
    assert.ok(result.logs.some((log) => log.includes('React Native native runtime artifact check passed')));
    assert.ok(result.logs.some((log) => log.includes('Verified real APK')));

    if (process.env.RUN_ANDROID_INSTALL === '1') {
      const rishEnv = { ...process.env, RISH_APPLICATION_ID: 'com.termux' };
      const remoteApk = '/sdcard/Download/m6-react-native-g9.apk';
      try {
        execFileSync('cp', [apkPath, remoteApk], { stdio: 'inherit' });
        const installOutput = execFileSync(
          'rish',
          ['-c', `pm install -r "${remoteApk}"`],
          { encoding: 'utf8', env: rishEnv },
        );
        assert.match(installOutput, /Success/);
        const packagePath = execFileSync(
          'rish',
          ['-c', 'pm path com.builder.m6reactnative'],
          { encoding: 'utf8', env: rishEnv },
        );
        assert.match(packagePath, /package:\/\/.*base\.apk/);
      } finally {
        try {
          execFileSync('rish', ['-c', `rm -f "${remoteApk}"`], { stdio: 'ignore' });
        } catch {
          // Best-effort cleanup only; install validation result is authoritative.
        }
      }
    }
  },
);
