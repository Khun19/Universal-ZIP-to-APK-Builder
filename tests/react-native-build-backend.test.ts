import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isReactNativeProject, prepareReactNativeSourceBuild } from '../lib/react-native-build-backend.ts';

test('React Native backend recognizes a real RN package and configures official source build', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-backend-'));
  const android = path.join(root, 'android');
  const rn = path.join(root, 'node_modules', 'react-native');
  fs.mkdirSync(android, { recursive: true });
  fs.mkdirSync(rn, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ dependencies: { 'react-native': '0.76.9' } }),
  );
  fs.writeFileSync(path.join(rn, 'settings.gradle.kts'), 'rootProject.name = "react-native-build-from-source"');
  fs.writeFileSync(
    path.join(android, 'settings.gradle'),
    [
      "pluginManagement { includeBuild('../node_modules/@react-native/gradle-plugin') }",
      "rootProject.name = 'Fixture'",
      "include ':app'",
      '',
    ].join('\n'),
  );

  assert.strictEqual(isReactNativeProject(root), true);
  const result = prepareReactNativeSourceBuild(root, android);
  assert.strictEqual(result.changed, true);

  const settings = fs.readFileSync(path.join(android, 'settings.gradle'), 'utf8');
  assert.match(settings, /includeBuild\('\.\.\/node_modules\/react-native'\)/);
  assert.match(settings, /com\.facebook\.react:react-android/);
  assert.match(settings, /com\.facebook\.react:hermes-android/);
  assert.match(settings, /:packages:react-native:ReactAndroid:hermes-engine/);

  const second = prepareReactNativeSourceBuild(root, android);
  assert.strictEqual(second.changed, false);

  fs.rmSync(root, { recursive: true, force: true });
});
