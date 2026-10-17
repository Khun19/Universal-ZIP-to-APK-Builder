import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { runBuildPipeline } from '../lib/pipeline.ts';

test(
  'builds a bare React Native project without android/ and honors package.json main',
  { skip: process.env.RUN_ANDROID_INTEGRATION !== '1', timeout: 35 * 60 * 1000 },
  async () => {
    const buildId = 'm6-bare-react-native-scaffold-test';
    const result = await runBuildPipeline({
      buildId,
      appName: 'Bare React Native Scaffold Test',
      files: [
        {
          relativePath: 'package.json',
          content: JSON.stringify({
            name: 'bare-react-native-scaffold-test',
            version: '1.0.0',
            private: true,
            main: 'src/bootstrap.js',
            dependencies: {
              react: '18.3.1',
              'react-native': '0.76.9',
            },
            devDependencies: {
              '@react-native/babel-preset': '0.76.9',
              '@react-native/metro-config': '0.76.9',
            },
          }, null, 2),
        },
        {
          relativePath: 'metro.config.js',
          content: [
            "const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');",
            'module.exports = mergeConfig(getDefaultConfig(__dirname), {});',
            '',
          ].join('\n'),
        },
        {
          relativePath: 'src/bootstrap.js',
          content: [
            "import { AppRegistry } from 'react-native';",
            "import App from '../App';",
            "AppRegistry.registerComponent('BareReactNativeScaffoldTest', () => App);",
            '',
          ].join('\n'),
        },
        {
          relativePath: 'App.js',
          content: [
            "import React from 'react';",
            "import { SafeAreaView, Text } from 'react-native';",
            'export default function App() {',
            '  return (',
            '    <SafeAreaView>',
            '      <Text>BARE_SCAFFOLD_ENTRYPOINT_VERIFIED</Text>',
            '    </SafeAreaView>',
            '  );',
            '}',
            '',
          ].join('\n'),
        },
      ],
    });

    assert.equal(result.success, true, result.error || result.logs.join('\n'));
    assert.equal(result.projectType, 'React Native');
    assert.equal(result.strategyName, 'react-native');
    assert.ok(result.outputPath?.endsWith('.apk'));

    const projectRoot = path.resolve('./.workspace', buildId);
    assert.ok(fs.statSync(path.join(projectRoot, 'android')).isDirectory(),
      'the bare input should receive a generated android/ scaffold');
    assert.equal(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8').includes('"main": "src/bootstrap.js"'),
      true,
      'scaffolding must preserve the user package manifest and its custom entry point',
    );

    const apkPath = result.outputPath as string;
    assert.ok(fs.statSync(apkPath).size > 0);
    const entries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' });
    assert.match(entries, /^AndroidManifest\.xml$/m);
    assert.match(entries, /^assets\/index\.android\.bundle$/m);
    assert.match(entries, /^lib\/arm64-v8a\/libreactnative\.so$/m);
    const bundle = execFileSync('unzip', ['-p', apkPath, 'assets/index.android.bundle'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    assert.match(bundle, /BARE_SCAFFOLD_ENTRYPOINT_VERIFIED/);
  },
);
