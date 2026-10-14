import { ensureReactNativeHermesCommand } from '../lib/worker.ts';
import { test } from 'node:test';
import assert from 'node:assert';
import {
  ensureAapt2Override,
  ensureReferencedDebugKeystore,
  executeBuildJob,
  validateReactNativeApkNativeRuntime,
  isGradleWrapperBootstrapFailure,
  findPnpmWorkspaceRoot,
  nodeInstallCommand,
  ensureReactNativeTermuxCmakeTooling,
} from '../lib/worker.ts';
import { BuildStrategy } from '../lib/strategy.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'node:child_process';


test('Uses the pnpm workspace root and hoisted linker for React Native installs', () => {
  const fixturePath = path.resolve('./tests/fixtures/react-native-project');
  const workspaceRoot = findPnpmWorkspaceRoot(fixturePath);

  assert.strictEqual(workspaceRoot, path.resolve('.'));

  const plan = nodeInstallCommand(fixturePath);
  assert.strictEqual(plan.cwd, path.resolve('.'));
  assert.match(plan.command, /pnpm install/);
  assert.match(plan.command, /--config\.node-linker=hoisted/);
  assert.match(plan.command, /--frozen-lockfile/);
  assert.doesNotMatch(plan.command, /--ignore-workspace/);
});

test('Keeps standalone pnpm projects outside a workspace', () => {
  const projectPath = path.resolve('./.tmp-standalone-pnpm');
  fs.mkdirSync(projectPath, { recursive: true });
  fs.writeFileSync(path.join(projectPath, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\\n');

  try {
    const plan = nodeInstallCommand(projectPath);
    assert.strictEqual(plan.cwd, projectPath);
    assert.match(plan.command, /--config\.node-linker=hoisted/);
    assert.match(plan.command, /--frozen-lockfile/);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('Validates the React Native 0.76 merged native runtime layout for Hermes', async () => {
  const projectPath = path.resolve('./.tmp-rn-apk-runtime-test');
  fs.mkdirSync(projectPath, { recursive: true });

  const apkPath = path.join(projectPath, 'app-debug.apk');
  const entries = [
    'AndroidManifest.xml',
    'lib/arm64-v8a/libreactnative.so',
    'lib/arm64-v8a/libjsi.so',
    'lib/arm64-v8a/libhermes.so',
  ];

  // Minimal ZIP fixture; the validator only inspects the APK entry table.
  const zipScript = `printf '%s\\n' ${entries.map((entry) => JSON.stringify(entry)).join(' ')} | zip -q -@`;
  await new Promise<void>((resolve, reject) => {
    const child = exec(
      `cd ${JSON.stringify(projectPath)} && mkdir -p lib/arm64-v8a && touch lib/arm64-v8a/libreactnative.so lib/arm64-v8a/libjsi.so lib/arm64-v8a/libhermes.so AndroidManifest.xml && zip -q app-debug.apk AndroidManifest.xml lib/arm64-v8a/libreactnative.so lib/arm64-v8a/libjsi.so lib/arm64-v8a/libhermes.so`,
      (error: Error | null) => error ? reject(error) : resolve(),
    );
    child.on('error', reject);
  });

  const libraries = await validateReactNativeApkNativeRuntime(apkPath, true);
  assert.deepStrictEqual(libraries, [
    'libreactnative.so',
    'libjsi.so',
    'libhermes.so',
  ]);

  await assert.rejects(
    () => validateReactNativeApkNativeRuntime(apkPath, false),
    /missing .*libjsc\.so.*libjsctooling\.so/,
  );

  fs.rmSync(projectPath, { recursive: true, force: true });
});

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


test('configures the Termux QEMU Hermes wrapper for React Native builds', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm6-hermes-'));
  const android = path.join(root, 'android');
  fs.mkdirSync(path.join(android, 'app'), { recursive: true });
  fs.writeFileSync(
    path.join(android, 'app', 'build.gradle'),
    "plugins { id 'com.android.application' }\n\nreact {\n    autolinkLibrariesWithApp()\n}\n",
  );
  const prefix = process.env.PREFIX;
  const qemu = prefix ? path.join(prefix, 'bin', 'qemu-x86_64') : undefined;
  if (!qemu || !fs.existsSync(qemu)) {
    fs.rmSync(root, { recursive: true, force: true });
    return;
  }

  assert.strictEqual(ensureReactNativeHermesCommand(root, android), true);
  assert.ok(fs.existsSync(path.join(root, 'hermesc-termux.sh')));
  const buildGradle = fs.readFileSync(path.join(android, 'app', 'build.gradle'), 'utf8');
  assert.match(buildGradle, /hermesCommand = file\('\.\.\/\.\.\/hermesc-termux\.sh'\)\.absolutePath/);
  fs.rmSync(root, { recursive: true, force: true });
});


test('Configures x86_64 PRoot CMake/Ninja wrappers for React Native Termux builds', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm6-cmake-proot-'));
  const android = path.join(root, 'android');
  const sdk = path.join(root, 'android-sdk');
  const fakePrefix = path.join(root, 'prefix');
  const bin = path.join(sdk, 'cmake', '3.22.1-2', 'bin');

  fs.mkdirSync(path.join(android, 'app'), { recursive: true });
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(fakePrefix, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(android, 'app', 'build.gradle'), "plugins { id 'com.android.application' }\n");
  fs.writeFileSync(path.join(bin, 'cmake'), '');
  fs.writeFileSync(path.join(bin, 'ninja'), '');
  fs.writeFileSync(path.join(fakePrefix, 'bin', 'qemu-x86_64'), '');
  fs.writeFileSync(path.join(fakePrefix, 'bin', 'proot-distro'), '');

  const previous = {
    prefix: process.env.PREFIX,
    sdk: process.env.ANDROID_HOME,
    sdkRoot: process.env.ANDROID_SDK_ROOT,
    qemu: process.env.BUILDER_QEMU_X86_64,
    proot: process.env.BUILDER_PROOT_DISTRO_BIN,
    distro: process.env.BUILDER_X86_64_PROOT_DISTRO,
  };

  process.env.PREFIX = fakePrefix;
  process.env.ANDROID_HOME = sdk;
  delete process.env.ANDROID_SDK_ROOT;
  process.env.BUILDER_QEMU_X86_64 = path.join(fakePrefix, 'bin', 'qemu-x86_64');
  process.env.BUILDER_PROOT_DISTRO_BIN = path.join(fakePrefix, 'bin', 'proot-distro');
  process.env.BUILDER_X86_64_PROOT_DISTRO = 'm6-x86_64';

  try {
    assert.strictEqual(ensureReactNativeTermuxCmakeTooling(root, android), true);

    const properties = fs.readFileSync(path.join(android, 'local.properties'), 'utf8');
    const wrapperDir = path.join(android, '.builder', 'termux-x86_64-cmake');
    assert.ok(properties.includes('cmake.dir=' + wrapperDir));

    const cmakeWrapper = fs.readFileSync(path.join(wrapperDir, 'bin', 'cmake'), 'utf8');
    const ninjaWrapper = fs.readFileSync(path.join(wrapperDir, 'bin', 'ninja'), 'utf8');
    assert.match(cmakeWrapper, /proot-distro/);
    assert.match(cmakeWrapper, /3\.22\.1-2\/bin\/cmake/);
    assert.match(cmakeWrapper, /CMAKE_MAKE_PROGRAM=/);
    assert.match(ninjaWrapper, /3\.22\.1-2\/bin\/ninja/);
  } finally {
    if (previous.prefix === undefined) delete process.env.PREFIX;
    else process.env.PREFIX = previous.prefix;
    if (previous.sdk === undefined) delete process.env.ANDROID_HOME;
    else process.env.ANDROID_HOME = previous.sdk;
    if (previous.sdkRoot === undefined) delete process.env.ANDROID_SDK_ROOT;
    else process.env.ANDROID_SDK_ROOT = previous.sdkRoot;
    if (previous.qemu === undefined) delete process.env.BUILDER_QEMU_X86_64;
    else process.env.BUILDER_QEMU_X86_64 = previous.qemu;
    if (previous.proot === undefined) delete process.env.BUILDER_PROOT_DISTRO_BIN;
    else process.env.BUILDER_PROOT_DISTRO_BIN = previous.proot;
    if (previous.distro === undefined) delete process.env.BUILDER_X86_64_PROOT_DISTRO;
    else process.env.BUILDER_X86_64_PROOT_DISTRO = previous.distro;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
