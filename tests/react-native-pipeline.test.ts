import { test } from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
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
    assert.match(
      fs.readFileSync(path.join(fixtureDir, 'android/app/src/main/res/values/styles.xml'), 'utf8'),
      /<style\s+name="AppTheme"\s+parent="Theme\.AppCompat\.Light\.NoActionBar"\s*\/>/,
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
      // Primary device-control path: ADB. This keeps install/launch validation
      // independent of Shizuku. rish remains an explicit fallback for devices
      // where the user has chosen to expose Android shell access through Shizuku.
      const adbAvailable = spawnSync('adb', ['get-state'], {
        encoding: 'utf8',
      }).status === 0;
      const useAdb = process.env.ANDROID_DEVICE_CONTROL !== 'rish' && adbAvailable;
      const rishEnv = { ...process.env, RISH_APPLICATION_ID: 'com.termux' };
      const remoteApk = '/sdcard/Download/m6-react-native-g10.apk';

      const shell = (command: string): string => {
        if (useAdb) {
          return execFileSync('adb', ['shell', command], { encoding: 'utf8' });
        }
        return execFileSync('rish', ['-c', command], {
          encoding: 'utf8',
          env: rishEnv,
        });
      };

      try {
        if (useAdb) {
          execFileSync('adb', ['install', '-r', apkPath], {
            encoding: 'utf8',
            stdio: 'inherit',
          });
        } else {
          execFileSync('cp', [apkPath, remoteApk], { stdio: 'inherit' });
          execFileSync(
            'rish',
            ['-c', `pm install -r "${remoteApk}"`],
            { encoding: 'utf8', env: rishEnv },
          );
        }

        let packagePath = '';
        for (let attempt = 0; attempt < 5; attempt += 1) {
          packagePath = shell('pm path com.builder.m6reactnative').trim();
          if (/^package:.*\/base\.apk$/.test(packagePath)) break;
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        assert.match(packagePath, /^package:.*\/base\.apk$/);

        // Resolve the exported launcher through Android's package manager rather
        // than hard-coding an Activity class. This verifies the actual installed
        // manifest contract used by the Android launcher.
        const resolvedActivity = shell(
          'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER com.builder.m6reactnative',
        )
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .pop() ?? '';
        assert.match(resolvedActivity, /^com\.builder\.m6reactnative\/\.MainActivity$/);

        const launchResult = useAdb
          ? spawnSync(
              'adb',
              [
                'shell',
                'am',
                'force-stop',
                'com.builder.m6reactnative',
                '&&',
                'am',
                'start',
                '-W',
                '-n',
                'com.builder.m6reactnative/.MainActivity',
              ],
              { encoding: 'utf8' },
            )
          : spawnSync(
              'rish',
              [
                '-c',
                'am force-stop com.builder.m6reactnative && am start -W -n com.builder.m6reactnative/.MainActivity',
              ],
              { encoding: 'utf8', env: rishEnv },
            );
        const launchOutput = [launchResult.stdout, launchResult.stderr]
          .filter(Boolean)
          .join('\n');
        assert.strictEqual(launchResult.status, 0, launchOutput);
        assert.match(launchOutput, /Status:\s+ok/);
        assert.match(launchOutput, /Complete/);

        let activityState = '';
        let processState = '';
        for (let attempt = 0; attempt < 8; attempt += 1) {
          activityState = shell(
            'dumpsys activity activities | grep -E "mResumedActivity|mFocusedApp" | head -5',
          );
          processState = shell('pidof com.builder.m6reactnative').trim();
          if (
            /com\.builder\.m6reactnative\/.MainActivity/.test(activityState) &&
            /^\d+(?:\s+\d+)*$/.test(processState)
          ) {
            break;
          }
          if (attempt < 7) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        assert.match(activityState, /com\.builder\.m6reactnative\/.MainActivity/);
        assert.match(processState, /^\d+(?:\s+\d+)*$/);
      } finally {
        try {
          if (useAdb) {
            execFileSync('adb', ['shell', 'am', 'force-stop', 'com.builder.m6reactnative'], {
              stdio: 'ignore',
            });
          } else {
            execFileSync('rish', ['-c', 'am force-stop com.builder.m6reactnative'], {
              stdio: 'ignore',
              env: rishEnv,
            });
          }
        } catch {
          // Best-effort cleanup only; launch validation result is authoritative.
        }
        if (!useAdb) {
          try {
            execFileSync('rish', ['-c', `rm -f "${remoteApk}"`], {
              stdio: 'ignore',
              env: rishEnv,
            });
          } catch {
            // Best-effort cleanup only.
          }
        }
      }
    }
  },
);
