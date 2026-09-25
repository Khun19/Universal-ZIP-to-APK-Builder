import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BuildStrategy } from './strategy.ts';
import { injectAndroidWrapper } from './template.ts';
import { buildWebProject, findWebProjectRoot } from './web-builder.ts';
import { syncCapacitorAndroid } from './capacitor-builder.ts';
import { parseBuildTimeoutMs } from '@workspace/shared';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const BUILD_TIMEOUT_MS = parseBuildTimeoutMs(process.env.BUILD_TIMEOUT_MS);

export interface BuildJobResult {
  success: boolean;
  logs: string[];
  outputPath?: string;
  error?: string;
}

/**
 * Recursively find every *.apk file under a directory.
 */
function findApks(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...findApks(full));
    else if (entry.name.endsWith('.apk')) results.push(full);
  }
  return results;
}

function isAndroidProject(directory: string): boolean {
  return (
    fs.existsSync(path.join(directory, 'app')) &&
    (fs.existsSync(path.join(directory, 'settings.gradle')) ||
      fs.existsSync(path.join(directory, 'settings.gradle.kts')))
  );
}

/**
 * Accept both a Gradle project at the ZIP root and projects nested under
 * android/ or a single top-level directory.
 */
function findAndroidProjectRoot(projectPath: string): string | undefined {
  if (isAndroidProject(projectPath)) return projectPath;

  const androidPath = path.join(projectPath, 'android');
  if (isAndroidProject(androidPath)) return androidPath;

  const queue: Array<{ directory: string; depth: number }> = [
    { directory: projectPath, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= 2) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name === 'node_modules' ||
        entry.name === '.gradle' ||
        entry.name === 'build'
      ) {
        continue;
      }

      const child = path.join(current.directory, entry.name);
      if (isAndroidProject(child)) return child;
      queue.push({ directory: child, depth: current.depth + 1 });
    }
  }

  return undefined;
}

/**
 * Termux ships a native AAPT2 binary that must be selected explicitly for
 * Android Gradle Plugin builds. Apply the same override to existing native
 * projects as the generated WebView template uses.
 */
export function ensureAapt2Override(androidProjectPath: string): boolean {
  const configuredAapt2 =
    process.env.AAPT2_PATH || '/data/data/com.termux/files/usr/bin/aapt2';

  if (!fs.existsSync(configuredAapt2)) return false;

  const propertiesPath = path.join(androidProjectPath, 'gradle.properties');
  const current = fs.existsSync(propertiesPath)
    ? fs.readFileSync(propertiesPath, 'utf8')
    : '';
  const overrideLine = `android.aapt2FromMavenOverride=${configuredAapt2}`;
  const lines = current.split(/\r?\n/);
  const overrideIndex = lines.findIndex((line) =>
    line.trim().startsWith('android.aapt2FromMavenOverride='),
  );

  if (overrideIndex >= 0) {
    lines[overrideIndex] = overrideLine;
  } else {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    lines.push(overrideLine);
  }

  fs.writeFileSync(propertiesPath, `${lines.join('\n')}\n`);
  return true;
}

/**
 * Some native projects define a custom debug signing config that expects
 * debug.keystore at the Gradle root instead of Android's usual ~/.android
 * location. Make that existing local debug keystore available without
 * changing the project's signing configuration.
 */
export function ensureReferencedDebugKeystore(
  androidProjectPath: string,
): boolean {
  const expectedPath = path.join(androidProjectPath, 'debug.keystore');
  if (fs.existsSync(expectedPath)) return true;

  const gradleFiles = [
    path.join(androidProjectPath, 'build.gradle'),
    path.join(androidProjectPath, 'build.gradle.kts'),
    path.join(androidProjectPath, 'app', 'build.gradle'),
    path.join(androidProjectPath, 'app', 'build.gradle.kts'),
  ];
  const referencesKeystore = gradleFiles.some((filePath) => {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf8');
    return /debug\.keystore|debugConfig/.test(content);
  });

  if (!referencesKeystore) return false;

  const homeDir = process.env.HOME || '/data/data/com.termux/files/home';
  const sourcePath = path.join(homeDir, '.android', 'debug.keystore');
  if (!fs.existsSync(sourcePath)) return false;

  fs.copyFileSync(sourcePath, expectedPath);
  return true;
}

/**
 * Verify that a file is an actual, non-empty, valid Android APK
 * (a real zip archive containing AndroidManifest.xml) rather than a
 * placeholder. Throws if validation fails.
 */
async function assertRealApk(filePath: string): Promise<{ size: number; sha256: string }> {
  const info = fs.statSync(filePath);
  if (!info.isFile() || info.size <= 0) {
    throw new Error(`APK artifact at ${filePath} is missing or empty`);
  }

  const { stdout } = await execAsync(`unzip -Z1 "${filePath}"`, { maxBuffer: 2 * 1024 * 1024 });
  if (!stdout.split(/\r?\n/).includes('AndroidManifest.xml')) {
    throw new Error(`File at ${filePath} is not a valid APK (no AndroidManifest.xml found)`);
  }

  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return { size: info.size, sha256: hash.digest('hex') };
}

function commandErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error ?? '');
  const value = error as {
    message?: unknown;
    stdout?: unknown;
    stderr?: unknown;
  };
  return [value.message, value.stdout, value.stderr]
    .filter((part) => part !== undefined && part !== null)
    .map(String)
    .join('\n');
}

/**
 * A wrapper bootstrap failure is different from a Gradle project failure.
 * Only the former is safe to retry with the installed Termux Gradle.
 */
export function isGradleWrapperBootstrapFailure(error: unknown): boolean {
  const text = commandErrorText(error);
  const wrapperBootstrap = /GradleWrapperMain|org\.gradle\.wrapper\.Install|Downloading .*gradle.*distribution|Could not install Gradle distribution/i.test(text);
  const networkFailure = /Connection refused|UnknownHostException|SocketTimeoutException|timed out|network is unreachable|unable to access/i.test(text);
  return wrapperBootstrap && networkFailure;
}

function findJavaHome(version: 17 | 21): string | undefined {
  const prefix = process.env.PREFIX;
  const versionHome = version === 21
    ? 'java-21-openjdk'
    : 'java-17-openjdk';

  const envHome = version === 21
    ? process.env.JAVA_21_HOME
    : process.env.JAVA_17_HOME;

  const candidates = [
    envHome,
    prefix ? path.join(prefix, `lib/jvm/${versionHome}`) : undefined,
    `/usr/lib/jvm/${versionHome}`,
    `/usr/lib/jvm/${versionHome}-amd64`,
    `/usr/lib/jvm/${versionHome}-arm64`,
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'bin', 'java')),
  );
}

/**
 * Detect the Java source/target requirement from Android Gradle files.
 *
 * Capacitor 7 / modern Android projects may require Java 21, while older
 * Android projects commonly require Java 17. Prefer the highest explicit
 * requirement found in the project, but only when that JDK is installed.
 */
function detectProjectJavaVersion(androidProjectPath: string): 17 | 21 {
  const gradleFiles: string[] = [];

  const collectGradleFiles = (directory: string, depth = 0): void => {
    if (depth > 3 || !fs.existsSync(directory)) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (
        entry.name === 'build' ||
        entry.name === '.gradle' ||
        entry.name === 'node_modules'
      ) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);

      if (
        entry.isFile() &&
        (entry.name === 'build.gradle' ||
          entry.name === 'build.gradle.kts')
      ) {
        gradleFiles.push(fullPath);
      } else if (entry.isDirectory()) {
        collectGradleFiles(fullPath, depth + 1);
      }
    }
  };

  collectGradleFiles(androidProjectPath);

  let highestRequired: 17 | 21 = 17;

  for (const filePath of gradleFiles) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    // JavaVersion.VERSION_21 / JavaLanguageVersion.of(21)
    if (
      /VERSION_21|JavaLanguageVersion\.of\(\s*21\s*\)|sourceCompatibility\s*[=:]\s*['"]?21\b|targetCompatibility\s*[=:]\s*['"]?21\b/i.test(
        content,
      )
    ) {
      highestRequired = 21;
    }
  }

  return highestRequired;
}

function isFlutterAndroidProjectCompatible(androidProjectPath: string): boolean {
  const settingsCandidates = [
    path.join(androidProjectPath, 'settings.gradle'),
    path.join(androidProjectPath, 'settings.gradle.kts'),
  ];
  const appBuildCandidates = [
    path.join(androidProjectPath, 'app', 'build.gradle'),
    path.join(androidProjectPath, 'app', 'build.gradle.kts'),
  ];

  const settings = settingsCandidates.find((filePath) => fs.existsSync(filePath));
  const appBuild = appBuildCandidates.find((filePath) => fs.existsSync(filePath));
  if (!settings || !appBuild) return false;

  let settingsText = '';
  let appBuildText = '';
  try {
    settingsText = fs.readFileSync(settings, 'utf8');
    appBuildText = fs.readFileSync(appBuild, 'utf8');
  } catch {
    return false;
  }

  return /dev\.flutter\.flutter-plugin-loader/.test(settingsText) &&
    /dev\.flutter\.flutter-gradle-plugin/.test(appBuildText);
}

/**
 * Regenerate only android/ using a temporary Flutter scaffold.
 * The original pubspec.yaml, lib/, assets and other project files are not
 * passed through flutter create and therefore cannot be overwritten by it.
 */
async function regenerateFlutterAndroidPlatform(
  projectPath: string,
  logs: string[],
  flutterExecutor: FlutterExecutor,
): Promise<void> {
  const existingAndroidPath = path.join(projectPath, 'android');
  const parentDir = path.dirname(projectPath);
  const scaffoldPath = path.join(
    parentDir,
    '.flutter-android-scaffold-' + path.basename(projectPath),
  );
  const backupRoot = path.join(projectPath, '.builder');
  const backupPath = path.join(backupRoot, 'flutter-android-backup');

  fs.rmSync(scaffoldPath, { recursive: true, force: true });
  fs.mkdirSync(backupRoot, { recursive: true });
  if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { recursive: true, force: true });

  if (fs.existsSync(existingAndroidPath)) {
    fs.renameSync(existingAndroidPath, backupPath);
    logs.push('Backed up unsupported Flutter Android platform to ' + backupPath + '.');
  }

  try {
    logs.push('Generating a fresh Flutter Android platform in a temporary scaffold.');
    await execAsync(
      flutterCommand(
        flutterExecutor,
        'create -t app --project-name builder_android_scaffold --platforms=android ' + shellQuote(scaffoldPath),
      ),
      { cwd: projectPath, timeout: BUILD_TIMEOUT_MS, env: process.env },
    );

    const generatedAndroidPath = path.join(scaffoldPath, 'android');
    if (!fs.existsSync(path.join(generatedAndroidPath, 'app'))) {
      throw new Error('Flutter generated an Android scaffold without an android/app module.');
    }

    fs.cpSync(generatedAndroidPath, existingAndroidPath, { recursive: true, force: true });
    logs.push('Replaced unsupported android/ with the Flutter SDK-generated Android platform.');
  } catch (error) {
    fs.rmSync(existingAndroidPath, { recursive: true, force: true });
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, existingAndroidPath);
      logs.push('Restored the original android/ platform after regeneration failure.');
    }
    throw error;
  } finally {
    fs.rmSync(scaffoldPath, { recursive: true, force: true });
  }
}

function getGradleEnvironment(androidProjectPath: string): NodeJS.ProcessEnv {
  const requiredVersion = detectProjectJavaVersion(androidProjectPath);

  // Use the project's required JDK when it is installed.
  // If Java 21 is required but unavailable, fall back to Java 17 only so
  // the actual Gradle/Javac error is preserved instead of failing silently.
  const selectedHome =
    findJavaHome(requiredVersion) ??
    (requiredVersion === 21 ? findJavaHome(17) : undefined);

  if (!selectedHome) return process.env;

  return {
    ...process.env,
    JAVA_HOME: selectedHome,
    PATH: `${path.join(selectedHome, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
  };
}
export function isGradleJavaCompatibilityFailure(error: unknown): boolean {
  const text = commandErrorText(error);
  return /Unsupported class file major version|requires Java .* to run|Could not determine java version/i.test(text);
}
function shellQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

interface FlutterExecutor {
  mode: 'native' | 'ubuntu-proot';
  commandPrefix: string;
  displayCommand: string;
}

async function resolveNativeFlutterPath(projectPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync('command -v flutter', {
      cwd: projectPath,
      timeout: 5_000,
      maxBuffer: 64 * 1024,
    });
    const resolved = String(stdout).trim();
    return resolved ? fs.realpathSync(resolved) : undefined;
  } catch {
    return undefined;
  }
}

function flutterRootFromExecutable(flutterExecutable: string): string {
  return path.dirname(path.dirname(flutterExecutable));
}

function flutterDartPath(flutterExecutable: string): string {
  return path.join(flutterRootFromExecutable(flutterExecutable), 'bin', 'cache', 'dart-sdk', 'bin', 'dart');
}

export async function isFlutterDartRuntimeUsable(dartPath: string): Promise<boolean> {
  try {
    await execFileAsync(dartPath, ['--version'], {
      timeout: 12_000,
      maxBuffer: 128 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

async function resolveFlutterExecutor(projectPath: string): Promise<FlutterExecutor> {
  const prootDistro = process.env.FLUTTER_PROOT_DISTRO || 'ubuntu';
  const prootFlutter = process.env.FLUTTER_PROOT_PATH || '/opt/flutter/bin/flutter';
  const nativeFlutter = await resolveNativeFlutterPath(projectPath);

  if (nativeFlutter) {
    const dartPath = flutterDartPath(nativeFlutter);

    if (fs.existsSync(dartPath)) {
      if (await isFlutterDartRuntimeUsable(dartPath)) {
        return {
          mode: 'native',
          commandPrefix: shellQuote(nativeFlutter),
          displayCommand: nativeFlutter,
        };
      }
    } else {
      try {
        await execAsync(shellQuote(nativeFlutter) + ' --version', {
          cwd: projectPath,
          timeout: 20_000,
          maxBuffer: 128 * 1024,
        });
        return {
          mode: 'native',
          commandPrefix: shellQuote(nativeFlutter),
          displayCommand: nativeFlutter,
        };
      } catch {
        // Fall through to the PRoot SDK.
      }
    }
  }

  try {
    await execAsync(
      'proot-distro login ' + shellQuote(prootDistro) + ' -- ' + shellQuote(prootFlutter) + ' --version',
      { cwd: projectPath, timeout: 30_000, maxBuffer: 128 * 1024 },
    );
  } catch (error) {
    const nativeDetail = nativeFlutter
      ? ' Native Flutter was found at ' + nativeFlutter + ' but its bundled Dart runtime is not executable.'
      : ' No native Flutter executable was found.';
    throw new Error(
      'No runnable Flutter SDK found.' +
      nativeDetail +
      ' Ubuntu PRoot fallback ' + prootDistro + ':' + prootFlutter +
      ' also failed: ' + commandErrorText(error),
    );
  }

  const androidHome = process.env.FLUTTER_PROOT_ANDROID_HOME || '/opt/android-sdk';
  const inner = [
    'export ANDROID_HOME=' + shellQuote(androidHome),
    'export ANDROID_SDK_ROOT=' + shellQuote(androidHome),
    'if command -v java >/dev/null 2>&1; then export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"; fi',
    'cd ' + shellQuote(projectPath),
    shellQuote(prootFlutter) + ' "$@"',
  ].join('; ');

  return {
    mode: 'ubuntu-proot',
    commandPrefix: 'proot-distro login ' + shellQuote(prootDistro) + ' -- sh -lc ' + shellQuote(inner) + ' --',
    displayCommand: 'proot-distro login ' + prootDistro + ' -- ' + prootFlutter,
  };
}

function flutterCommand(executor: FlutterExecutor, command: string): string {
  if (executor.mode === 'native') return executor.commandPrefix + ' ' + command;
  return executor.commandPrefix + ' ' + command.split(' ').map(shellQuote).join(' ');
}


export async function executeBuildJob(
  projectPath: string,
  strategy: BuildStrategy,
  appName?: string,
): Promise<BuildJobResult> {
  const logs: string[] = [];
  let syncedAndroidProjectPath: string | undefined;

  if (strategy.strategyName === 'unknown') {
    return {
      success: false,
      logs: ['Error: Unknown build strategy.'],
      error: 'Invalid strategy'
    };
  }

  try {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    logs.push(`Starting build execution for strategy: ${strategy.strategyName}`);

    // If Web Wrapper strategy, build web app first then inject Android template
    if (strategy.strategyName === 'web-wrapper') {
      logs.push('Building web application before Android wrapper...');

      const webProjectPath = findWebProjectRoot(projectPath);
      if (webProjectPath !== projectPath) {
        logs.push(`Nested web project detected: ${webProjectPath}`);
      }

      const webBuild = await buildWebProject(webProjectPath);
      logs.push(...webBuild.logs);

      if (!webBuild.success || !webBuild.outputDir) {
        const error = webBuild.error || 'Web build failed';
        logs.push(`Error: ${error}`);
        return { success: false, logs, error };
      }

      logs.push('Injecting Android WebView Wrapper Template...');
      injectAndroidWrapper(
        projectPath,
        webBuild.outputDir,
        appName || 'GeneratedApp',
      );
      logs.push('Android WebView template successfully generated.');
    }

    if (strategy.strategyName === 'capacitor') {
      logs.push('Building Capacitor web assets before Android sync...');

      const webProjectPath = findWebProjectRoot(projectPath);
      if (webProjectPath !== projectPath) {
        logs.push(`Nested Capacitor project detected: ${webProjectPath}`);
      }

      const webBuild = await buildWebProject(webProjectPath);
      logs.push(...webBuild.logs);

      if (!webBuild.success || !webBuild.outputDir) {
        const error = webBuild.error || 'Capacitor web build failed';
        logs.push(`Error: ${error}`);
        return { success: false, logs, error };
      }

      try {
        const syncResult = await syncCapacitorAndroid(webProjectPath);
        logs.push(...syncResult.logs);
        syncedAndroidProjectPath = syncResult.androidProjectPath;
        logs.push(`Capacitor Android project ready at ${syncedAndroidProjectPath}.`);
      } catch (syncError: any) {
        const error = `Capacitor Android sync failed: ${syncError.message}`;
        logs.push(`Error: ${error}`);
        return { success: false, logs, error };
      }
    }

    if (strategy.strategyName === 'flutter') {
      let flutterExecutor: FlutterExecutor;
      try {
        flutterExecutor = await resolveFlutterExecutor(projectPath);
        logs.push('Resolved Flutter executor: ' + flutterExecutor.displayCommand);
        if (flutterExecutor.mode === 'ubuntu-proot') {
          logs.push('Native Termux Flutter Dart runtime is unusable; using Ubuntu PRoot Flutter SDK.');
          logs.push('Flutter PRoot Android SDK: ' + (process.env.FLUTTER_PROOT_ANDROID_HOME || '/opt/android-sdk'));
        }
      } catch (resolveErr: any) {
        const error = resolveErr.message || 'Flutter SDK could not be resolved.';
        logs.push('Error: ' + error);
        return { success: false, logs, error };
      }

      const flutterAndroidPath = path.join(projectPath, 'android');

      try {
        if (!fs.existsSync(flutterAndroidPath)) {
          logs.push(
            'Flutter Android platform missing; generating it with flutter create --platforms=android.',
          );
          await regenerateFlutterAndroidPlatform(projectPath, logs, flutterExecutor);
        } else if (!isFlutterAndroidProjectCompatible(flutterAndroidPath)) {
          logs.push(
            'Existing Flutter Android platform is unsupported by the installed Flutter SDK.',
          );
          await regenerateFlutterAndroidPlatform(projectPath, logs, flutterExecutor);
        } else {
          logs.push('Existing Flutter Android platform is Flutter-compatible.');
        }
      } catch (flutterCreateErr: any) {
        const error = 'Flutter Android platform generation/recovery failed: ' + flutterCreateErr.message;
        logs.push('Error: ' + error);
        return { success: false, logs, error };
      }

      if (!fs.existsSync(path.join(projectPath, 'android', 'app'))) {
        const error = 'Flutter Android platform is not available after compatibility recovery: android/app is missing.';
        logs.push('Error: ' + error);
        return { success: false, logs, error };
      }
      const flutterAndroidProjectPath = path.join(projectPath, 'android');
      const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      const localPropertiesPath = path.join(flutterAndroidProjectPath, 'local.properties');
      const flutterAndroidSdk =
        flutterExecutor.mode === 'ubuntu-proot'
          ? (process.env.FLUTTER_PROOT_ANDROID_HOME || '/opt/android-sdk')
          : sdkPath;

      if (flutterAndroidSdk) {
        fs.writeFileSync(localPropertiesPath, `sdk.dir=${flutterAndroidSdk}\n`);
        logs.push(
          `Generated local.properties with ${flutterExecutor.mode === 'ubuntu-proot' ? 'PRoot guest' : 'native Termux'} Android SDK: ${flutterAndroidSdk}.`,
        );
      }

      if (flutterExecutor.mode === 'ubuntu-proot') {
        logs.push('Using the Ubuntu PRoot Android toolchain; leaving AAPT2 resolution to the guest SDK.');
      } else if (ensureAapt2Override(flutterAndroidProjectPath)) {
        logs.push(
          `Using AAPT2 override: ${process.env.AAPT2_PATH || '/data/data/com.termux/files/usr/bin/aapt2'}`,
        );
      }

      const flutterEnvironment = getGradleEnvironment(flutterAndroidProjectPath);
      logs.push(`Flutter Android build environment: JAVA_HOME=${flutterEnvironment.JAVA_HOME || 'default'}`);

      const flutterPubGetCommand = flutterCommand(flutterExecutor, 'pub get');
      const flutterBuildCommand = flutterCommand(flutterExecutor, 'build apk --debug');
      logs.push(`Executing Flutter command: ${flutterExecutor.displayCommand} pub get && ${flutterExecutor.displayCommand} build apk --debug`);

      try {
        const { stdout, stderr } = await execAsync(flutterPubGetCommand + ' && ' + flutterBuildCommand, {
          cwd: projectPath,
          timeout: BUILD_TIMEOUT_MS,
          env: flutterEnvironment,
        });
        if (stdout) logs.push(`[Flutter Output]: ${stdout.slice(-4000)}`);
        if (stderr) logs.push(`[Flutter Stderr]: ${stderr.slice(-2000)}`);
      } catch (flutterErr: any) {
        const stdout = flutterErr.stdout ? String(flutterErr.stdout).slice(-4000) : '';
        const stderr = flutterErr.stderr ? String(flutterErr.stderr).slice(-4000) : '';
        logs.push(`[Flutter Failure]: ${flutterErr.message}`);
        if (stdout) logs.push(`[Flutter Output]: ${stdout}`);
        if (stderr) logs.push(`[Flutter Stderr]: ${stderr}`);
        return {
          success: false,
          logs,
          error: `Flutter APK build failed: ${flutterErr.message}`,
        };
      }

      const flutterApks = findApks(path.join(projectPath, 'build', 'app', 'outputs', 'flutter-apk'));
      if (!flutterApks.length) {
        const error = 'Flutter completed without errors but no APK was found in build/app/outputs/flutter-apk/.';
        logs.push(`Error: ${error}`);
        return { success: false, logs, error };
      }

      const apkPath = flutterApks.find(p => p.endsWith('app-debug.apk')) ?? flutterApks.find(p => p.includes('debug')) ?? flutterApks[0];

      let validated: { size: number; sha256: string };
      try {
        validated = await assertRealApk(apkPath);
      } catch (validationErr: any) {
        logs.push(`Error: ${validationErr.message}`);
        return { success: false, logs, error: validationErr.message };
      }

      logs.push(
        `Build finished. Verified real Flutter APK at ${apkPath} (${validated.size} bytes, SHA-256 ${validated.sha256}).`,
      );

      return {
        success: true,
        logs,
        outputPath: apkPath,
      };
    }

    const androidProjectPath =
      syncedAndroidProjectPath && fs.existsSync(path.join(syncedAndroidProjectPath, 'app'))
        ? syncedAndroidProjectPath
        : findAndroidProjectRoot(projectPath);
    if (!androidProjectPath) {
      const error =
        'No Android Gradle project with an app/ module was found.';
      logs.push(`Error: ${error}`);
      return { success: false, logs, error };
    }

    // A real native Android build requires an app/ module to exist.
    // If it doesn't, there is nothing to build — fail honestly instead
    // of pretending a build happened.
    const appDir = path.join(androidProjectPath, 'app');
    if (!fs.existsSync(appDir)) {
      const error = 'No Android app module (app/) found — cannot run a Gradle build.';
      logs.push(`Error: ${error}`);
      return { success: false, logs, error };
    }

    const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    const localPropertiesPath = path.join(
      androidProjectPath,
      'local.properties',
    );
    if (sdkPath && !fs.existsSync(localPropertiesPath)) {
      fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkPath}\n`);
      logs.push('Generated local.properties from ANDROID_HOME.');
    }

    if (ensureAapt2Override(androidProjectPath)) {
      logs.push(
        `Using AAPT2 override: ${process.env.AAPT2_PATH || '/data/data/com.termux/files/usr/bin/aapt2'}`,
      );
    } else {
      logs.push(
        'AAPT2 override not applied because the configured AAPT2 binary was not found.',
      );
    }

    if (ensureReferencedDebugKeystore(androidProjectPath)) {
      logs.push(
        'Referenced debug.keystore was made available at the Gradle project root.',
      );
    }

    const gradlewPath = path.join(androidProjectPath, 'gradlew');
    let gradleCommand = 'gradle';

    if (fs.existsSync(gradlewPath)) {
      try {
        fs.chmodSync(gradlewPath, 0o755);
      } catch {
        // Non-fatal: chmod can fail on some filesystems; bash below can still
        // execute a readable wrapper script.
      }
      gradleCommand = 'bash ./gradlew';
      logs.push('Using the project Gradle Wrapper.');
    } else {
      // Do not generate a wrapper with a hard-coded version. Android projects
      // may require a newer Gradle than the builder template, especially when
      // they use a newer Android Gradle Plugin. The installed Gradle version
      // is the user's explicit build environment and is used as-is.
      logs.push(
        'gradlew not found — using the installed Gradle version without generating a wrapper.',
      );
      try {
        const { stdout } = await execAsync('gradle --version', {
          cwd: androidProjectPath,
          timeout: 30_000,
          maxBuffer: 256 * 1024,
        });
        const versionLine = stdout
          .split(/\r?\n/)
          .find((line) => line.trim().startsWith('Gradle '));
        logs.push(`Installed Gradle detected: ${versionLine?.trim() || 'unknown version'}`);
      } catch (gradleErr: any) {
        const error = `No project Gradle Wrapper and installed Gradle is unavailable: ${gradleErr.message}`;
        logs.push(`Error: ${error}`);
        return { success: false, logs, error };
      }
    }

    const command = `${gradleCommand} assembleDebug --no-daemon --stacktrace`;
    logs.push(`Executing Gradle command: ${command}`);
    const gradleEnvironment =
      gradleCommand === 'bash ./gradlew'
        ? getGradleEnvironment(androidProjectPath)
        : process.env;
    if (gradleEnvironment.JAVA_HOME !== process.env.JAVA_HOME) {
      logs.push(`Using Gradle Java runtime: ${gradleEnvironment.JAVA_HOME}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: androidProjectPath,
        timeout: BUILD_TIMEOUT_MS,
        env: gradleEnvironment,
      });
      if (stdout) logs.push(`[Gradle Output]: ${stdout.slice(-2000)}`);
      if (stderr) logs.push(`[Gradle Stderr]: ${stderr.slice(-1000)}`);
    } catch (cmdErr: any) {
      const stdout = cmdErr.stdout ? String(cmdErr.stdout).slice(-2000) : '';
      const stderr = cmdErr.stderr ? String(cmdErr.stderr).slice(-2000) : '';
      logs.push(`[Gradle Failure]: ${cmdErr.message}`);
      if (stdout) logs.push(`[Gradle Output]: ${stdout}`);
      if (stderr) logs.push(`[Gradle Stderr]: ${stderr}`);

      // A project Gradle wrapper may be present but unusable because its
      // distribution is not cached or cannot be downloaded on Termux.
      // Preserve wrapper-first behavior, but recover with the installed
      // Gradle only for an identifiable wrapper bootstrap/network failure.
      if (
        !isGradleWrapperBootstrapFailure(cmdErr) &&
        !isGradleJavaCompatibilityFailure(cmdErr)
      ) {
        return {
          success: false,
          logs,
          error: `Gradle build failed: ${cmdErr.message}`,
        };
      }

      logs.push(
        'Gradle Wrapper bootstrap failed; checking the installed Gradle fallback.',
      );

      try {
        const { stdout: versionOutput } = await execAsync('gradle --version', {
          cwd: androidProjectPath,
          timeout: 30_000,
          maxBuffer: 256 * 1024,
        });
        const versionLine = versionOutput
          .split(/\r?\n/)
          .find((line) => line.trim().startsWith('Gradle '));
        logs.push(
          `Installed Gradle fallback available: ${versionLine?.trim() || 'unknown version'}`,
        );

        const fallbackCommand = 'gradle assembleDebug --no-daemon --stacktrace';
        logs.push(`Executing fallback Gradle command: ${fallbackCommand}`);
        const fallbackResult = await execAsync(fallbackCommand, {
          cwd: androidProjectPath,
          timeout: BUILD_TIMEOUT_MS,
        });
        if (fallbackResult.stdout) {
          logs.push(`[Fallback Gradle Output]: ${String(fallbackResult.stdout).slice(-2000)}`);
        }
        if (fallbackResult.stderr) {
          logs.push(`[Fallback Gradle Stderr]: ${String(fallbackResult.stderr).slice(-1000)}`);
        }
        logs.push('Installed Gradle fallback completed successfully.');
      } catch (fallbackErr: any) {
        const fallbackStdout = fallbackErr.stdout
          ? String(fallbackErr.stdout).slice(-2000)
          : '';
        const fallbackStderr = fallbackErr.stderr
          ? String(fallbackErr.stderr).slice(-2000)
          : '';
        logs.push(`[Fallback Gradle Failure]: ${fallbackErr.message}`);
        if (fallbackStdout) logs.push(`[Fallback Gradle Output]: ${fallbackStdout}`);
        if (fallbackStderr) logs.push(`[Fallback Gradle Stderr]: ${fallbackStderr}`);
        return {
          success: false,
          logs,
          error: `Gradle wrapper and installed Gradle fallback failed: ${fallbackErr.message}`,
        };
      }
    }

    // Locate the actual APK produced by Gradle. Do not assume a filename —
    // search the real output tree.
    const apks = findApks(path.join(androidProjectPath, 'app/build/outputs/apk'));
    if (!apks.length) {
      const error = 'Gradle finished without errors but no APK was found in app/build/outputs/apk/. The build did not actually produce an artifact.';
      logs.push(`Error: ${error}`);
      return { success: false, logs, error };
    }

    // Prefer a debug APK if multiple were produced (e.g. flavors).
    const apkPath = apks.find(p => p.includes('debug')) ?? apks[0];

    let validated: { size: number; sha256: string };
    try {
      validated = await assertRealApk(apkPath);
    } catch (validationErr: any) {
      logs.push(`Error: ${validationErr.message}`);
      return { success: false, logs, error: validationErr.message };
    }

    logs.push(
      `Build finished. Verified real APK at ${apkPath} (${validated.size} bytes, SHA-256 ${validated.sha256}).`
    );

    return {
      success: true,
      logs,
      outputPath: apkPath
    };
  } catch (err: any) {
    logs.push(`Fatal build failure: ${err.message}`);
    return {
      success: false,
      logs,
      error: err.message
    };
  }
}
