import { test } from 'node:test';
import assert from 'node:assert';
import {
  ensureAapt2Override,
  ensureReferencedDebugKeystore,
  executeBuildJob,
  isGradleWrapperBootstrapFailure,
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
