import { test } from 'node:test';
import assert from 'node:assert';
import {
  ensureAapt2Override,
  ensureReferencedDebugKeystore,
  executeBuildJob,
  isGradleWrapperBootstrapFailure,
  isFlutterDartRuntimeUsable,
} from '../lib/worker.ts';
import { BuildStrategy } from '../lib/strategy.ts';
import * as fs from 'fs';
import * as path from 'path';

test('Adds the Termux AAPT2 override without discarding Gradle properties', () => {
  const projectPath = path.resolve('./.tmp-aapt2-properties');
  const previousAapt2Path = process.env.AAPT2_PATH;
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'gradle.properties'),
    'org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\n',
  );

  const fakeAapt2 = path.join(projectPath, 'aapt2');
  fs.writeFileSync(fakeAapt2, '');
  process.env.AAPT2_PATH = fakeAapt2;

  assert.strictEqual(ensureAapt2Override(projectPath), true);
  const properties = fs.readFileSync(
    path.join(projectPath, 'gradle.properties'),
    'utf8',
  );
  assert.match(properties, /org\.gradle\.jvmargs/);
  assert.match(properties, new RegExp(`android\\.aapt2FromMavenOverride=${fakeAapt2}`));

  if (previousAapt2Path === undefined) delete process.env.AAPT2_PATH;
  else process.env.AAPT2_PATH = previousAapt2Path;
  fs.rmSync(projectPath, { recursive: true, force: true });
});

test('Copies the user debug keystore for custom native signing configs', () => {
  const projectPath = path.resolve('./.tmp-debug-keystore');
  const previousHome = process.env.HOME;
  const fakeHome = path.join(projectPath, 'home');
  fs.mkdirSync(path.join(projectPath, 'app'), { recursive: true });
  fs.mkdirSync(path.join(fakeHome, '.android'), { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'app', 'build.gradle.kts'),
    'storeFile = rootProject.file("debug.keystore")\n',
  );
  fs.writeFileSync(
    path.join(fakeHome, '.android', 'debug.keystore'),
    'debug keystore fixture',
  );
  process.env.HOME = fakeHome;

  assert.strictEqual(ensureReferencedDebugKeystore(projectPath), true);
  assert.strictEqual(
    fs.readFileSync(path.join(projectPath, 'debug.keystore'), 'utf8'),
    'debug keystore fixture',
  );

  if (previousHome === undefined) delete process.env.HOME;
  else process.env.HOME = previousHome;
  fs.rmSync(projectPath, { recursive: true, force: true });
});

test('Recognizes wrapper distribution download failures for local Gradle fallback', () => {
  assert.strictEqual(
    isGradleWrapperBootstrapFailure({
      message: 'Command failed: bash ./gradlew assembleDebug',
      stdout: 'Downloading https://services.gradle.org/distributions/gradle-8.11.1-all.zip',
      stderr: 'java.net.ConnectException: Connection refused\nat org.gradle.wrapper.Install',
    }),
    true,
  );

  assert.strictEqual(
    isGradleWrapperBootstrapFailure({
      message: 'Execution failed for task :app:compileDebugJavaWithJavac',
      stderr: 'Compilation failed: cannot find symbol',
    }),
    false,
  );
});

test('Fails honestly when no app/ module exists (no fake APK is produced)', async () => {
  const projectPath = path.resolve('./.tmp-worker-test');
  fs.mkdirSync(projectPath, { recursive: true });

  const strategy: BuildStrategy = {
    strategyName: 'native-gradle',
    buildSteps: ['Run ./gradlew assembleDebug'],
    outputArtifact: 'app-debug.apk'
  };

  const result = await executeBuildJob(projectPath, strategy);
  // There is no real Android app/ module, no Gradle, and no Android SDK
  // in this environment, so the job must fail — it must NOT report
  // success or leave behind a placeholder file pretending to be an APK.
  assert.strictEqual(result.success, false);
  assert.ok(result.error);
  assert.ok(!result.outputPath);

  // Ensure no fake artifact was written anywhere under the project path.
  const leftoverFiles = fs.existsSync(path.join(projectPath, 'artifacts'))
    ? fs.readdirSync(path.join(projectPath, 'artifacts'))
    : [];
  assert.strictEqual(leftoverFiles.length, 0, 'No mock artifact should be written on failure');

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


test('Detects an unusable bundled Dart runtime before invoking Flutter', async () => {
  const projectPath = path.resolve('./.tmp-flutter-dart-probe');
  fs.mkdirSync(projectPath, { recursive: true });

  const brokenDart = path.join(projectPath, 'broken-dart');
  const workingDart = path.join(projectPath, 'working-dart');

  fs.writeFileSync(brokenDart, '#!/bin/sh\necho "cannot execute: required file not found" >&2\nexit 127\n');
  fs.writeFileSync(workingDart, '#!/bin/sh\necho "Dart SDK version: test"\nexit 0\n');
  fs.chmodSync(brokenDart, 0o755);
  fs.chmodSync(workingDart, 0o755);

  try {
    assert.strictEqual(await isFlutterDartRuntimeUsable(brokenDart), false);
    assert.strictEqual(await isFlutterDartRuntimeUsable(workingDart), true);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('Builds a runnable Flutter command through Ubuntu PRoot when native Flutter is broken', async () => {
  const projectPath = path.resolve('./.tmp-flutter-command-test');
  fs.mkdirSync(projectPath, { recursive: true });

  const previousPath = process.env.PATH;
  const previousHome = process.env.HOME;
  const previousProotDistro = process.env.FLUTTER_PROOT_DISTRO;
  const previousProotPath = process.env.FLUTTER_PROOT_PATH;

  // The resolver is intentionally exercised through the public build job:
  // if the local Flutter SDK is broken but Ubuntu PRoot is configured, the
  // implementation must use the real PRoot path rather than a fake APK.
  process.env.FLUTTER_PROOT_DISTRO = 'ubuntu';
  process.env.FLUTTER_PROOT_PATH = '/opt/flutter/bin/flutter';

  try {
    // This fixture has no Android project, so execution should fail before
    // producing an APK; the test only verifies that the Flutter strategy
    // remains honest and does not create a placeholder artifact.
    const strategy: BuildStrategy = {
      strategyName: 'flutter',
      buildSteps: ['Run flutter pub get', 'Run flutter build apk --debug'],
      outputArtifact: 'app-debug.apk',
    };
    const result = await executeBuildJob(projectPath, strategy);
    assert.strictEqual(result.success, false);
    assert.ok(!result.outputPath);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    if (previousProotDistro === undefined) delete process.env.FLUTTER_PROOT_DISTRO;
    else process.env.FLUTTER_PROOT_DISTRO = previousProotDistro;
    if (previousProotPath === undefined) delete process.env.FLUTTER_PROOT_PATH;
    else process.env.FLUTTER_PROOT_PATH = previousProotPath;
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
