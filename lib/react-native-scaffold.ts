import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const execFileAsync = promisify(execFile);

export interface ReactNativeScaffoldResult {
  reactNativeVersion: string;
  cliVersion: string;
  androidPath: string;
}

/**
 * Conservative compatibility map for the React Native Community CLI.
 * Unknown framework versions are rejected rather than scaffolded with a
 * potentially incompatible "latest" CLI.
 */
export function communityCliVersionForReactNative(version: string): string | undefined {
  const match = /^0\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
  if (!match) return undefined;
  const minor = Number(match[1]);
  const compatible: Record<number, string> = {
    71: '10.2.4',
    72: '11.3.7',
    73: '12.3.6',
    74: '13.6.9',
    75: '14.1.0',
    76: '15.0.1',
  };
  return compatible[minor];
}

function readInstalledReactNativeVersion(projectPath: string, declared: unknown): string {
  const packagePath = path.join(projectPath, 'node_modules', 'react-native', 'package.json');
  if (fs.existsSync(packagePath)) {
    const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version?: unknown };
    if (typeof parsed.version === 'string') return parsed.version;
  }

  if (typeof declared === 'string' && /^0\.\d+\.\d+$/.test(declared)) {
    return declared;
  }

  throw new Error(
    'Cannot safely generate the bare React Native Android platform: the installed react-native version could not be resolved exactly.',
  );
}

/**
 * Resolve the bare React Native JavaScript entry point deterministically.
 * package.json "main" is authoritative when present; otherwise accept exactly
 * one conventional index entry. Never silently bundle a different entry file.
 */
export function resolveReactNativeEntryFile(projectPath: string): string {
  const projectRoot = path.resolve(projectPath);
  const packagePath = path.join(projectRoot, 'package.json');
  let declaredMain: unknown;
  if (fs.existsSync(packagePath)) {
    const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { main?: unknown };
    declaredMain = parsed.main;
  }

  if (declaredMain !== undefined) {
    if (typeof declaredMain !== 'string' || declaredMain.trim() === '') {
      throw new Error('React Native package.json main must be a non-empty relative entry path.');
    }
    const entryPath = path.resolve(projectRoot, declaredMain);
    const relativePath = path.relative(projectRoot, entryPath);
    if (!relativePath || relativePath.startsWith('..' + path.sep) || relativePath === '..' || path.isAbsolute(relativePath)) {
      throw new Error('React Native package.json main must resolve inside the project directory.');
    }
    if (!fs.existsSync(entryPath) || !fs.statSync(entryPath).isFile()) {
      throw new Error(`Configured React Native entry point does not exist: ${declaredMain}`);
    }
    return relativePath.split(path.sep).join('/');
  }

  const candidates = ['index.js', 'index.ts', 'index.tsx'].filter((candidate) =>
    fs.existsSync(path.join(projectRoot, candidate)) &&
    fs.statSync(path.join(projectRoot, candidate)).isFile(),
  );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) {
    throw new Error('No React Native entry point found; set package.json main or provide exactly one of index.js, index.ts, or index.tsx.');
  }
  throw new Error(`Ambiguous React Native entry points (${candidates.join(', ')}); set package.json main explicitly.`);
}

/**
 * Generate the native platform in a temporary CLI project, validate it, then
 * copy only android/ into the user's project. The user's JS/TS source, package
 * manifest, assets and app configuration are never replaced.
 */
export async function generateReactNativeAndroidScaffold(
  projectPath: string,
  declaredReactNativeVersion: unknown,
): Promise<ReactNativeScaffoldResult> {
  const projectRoot = path.resolve(projectPath);
  const androidPath = path.join(projectRoot, 'android');
  if (fs.existsSync(androidPath)) {
    throw new Error('Refusing to generate a scaffold over an existing android/ directory.');
  }

  const reactNativeVersion = readInstalledReactNativeVersion(projectRoot, declaredReactNativeVersion);
  const cliVersion = communityCliVersionForReactNative(reactNativeVersion);
  if (!cliVersion) {
    throw new Error(
      `No verified React Native Community CLI compatibility mapping exists for React Native ${reactNativeVersion}; refusing to use an unpinned CLI.`,
    );
  }

  // Keep the CLI project outside the repository/workspace ancestry. Otherwise
  // npm inherits the Builder's root package.json overrides (pnpm-style keys
  // such as "esbuild>@esbuild/darwin-arm64") and fails with EINVALIDPACKAGENAME.
  // os.tmpdir() gives npm an isolated project ancestry while preserving the
  // Android SDK/JDK environment variables required by the build.
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'builder-rn-scaffold-'));
  const scaffoldProject = path.join(tempRoot, 'BuilderScaffold');
  const generatedAndroid = path.join(scaffoldProject, 'android');

  try {
    await execFileAsync(
      'npx',
      [
        '--yes',
        `@react-native-community/cli@${cliVersion}`,
        'init',
        'BuilderScaffold',
        '--version',
        reactNativeVersion,
        '--skip-install',
        '--skip-git-init',
      ],
      { cwd: tempRoot, timeout: Number(process.env.BUILD_TIMEOUT_MS) || 30 * 60 * 1000, maxBuffer: 8 * 1024 * 1024 },
    );

    const required = [
      path.join(generatedAndroid, 'settings.gradle'),
      path.join(generatedAndroid, 'settings.gradle.kts'),
    ];
    const hasSettings = required.some((file) => fs.existsSync(file));
    const hasAppBuild = [
      path.join(generatedAndroid, 'app', 'build.gradle'),
      path.join(generatedAndroid, 'app', 'build.gradle.kts'),
    ].some((file) => fs.existsSync(file));
    const hasManifest = fs.existsSync(path.join(generatedAndroid, 'app', 'src', 'main', 'AndroidManifest.xml'));
    const hasActivity = fs.existsSync(path.join(generatedAndroid, 'app', 'src', 'main', 'java')) ||
      fs.existsSync(path.join(generatedAndroid, 'app', 'src', 'main', 'kotlin'));

    if (!hasSettings || !hasAppBuild || !hasManifest || !hasActivity) {
      throw new Error(
        'React Native Community CLI completed without the required Android Gradle, manifest, or activity files.',
      );
    }

    fs.cpSync(generatedAndroid, androidPath, { recursive: true, errorOnExist: true });

    // A native APK can compile without the React Native Gradle plugin being
    // applied to :app. In that case assembleDebug succeeds but never registers
    // createBundleDebugJsAndAssets, leaving an APK that needs Metro at runtime.
    const appBuildGradle = path.join(androidPath, 'app', 'build.gradle');
    if (!fs.existsSync(appBuildGradle)) {
      throw new Error('Generated React Native Android scaffold is missing app/build.gradle; cannot ensure a bundled debug APK.');
    }

    let gradle = fs.readFileSync(appBuildGradle, 'utf8');
    const hasReactPlugin =
      /id\s*\(?\s*['"]com\.facebook\.react['"]/.test(gradle) ||
      /apply\s+plugin\s*:\s*['"]com\.facebook\.react['"]/.test(gradle);

    if (!hasReactPlugin) {
      const pluginsBlock = /plugins\s*\{/;
      if (pluginsBlock.test(gradle)) {
        gradle = gradle.replace(pluginsBlock, (match) => match + '\n    id("com.facebook.react")');
      } else {
        const androidPlugin = /apply\s+plugin\s*:\s*['"]com\.android\.application['"]/;
        if (!androidPlugin.test(gradle)) {
          throw new Error('Generated React Native app/build.gradle does not declare the Android application plugin; cannot safely apply the React Native Gradle plugin.');
        }
        gradle = gradle.replace(androidPlugin, (match) => match + '\napply plugin: "com.facebook.react"');
      }
    }

    // Debuggable variants skip JS bundling and require Metro. Force a bundle
    // into the debug APK so it can launch offline on a physical device.
    const debuggableVariants = /debuggableVariants\s*=\s*\[[^\]]*\]/;
    if (debuggableVariants.test(gradle)) {
      gradle = gradle.replace(debuggableVariants, 'debuggableVariants = []');
    } else {
      const reactBlock = /react\s*\{/;
      if (reactBlock.test(gradle)) {
        gradle = gradle.replace(reactBlock, (match) => match + '\n    debuggableVariants = []');
      } else {
        const pluginsBlockWithBody = /(^|\n)(plugins\s*\{[\s\S]*?\n\})/;
        if (!pluginsBlockWithBody.test(gradle)) {
          throw new Error('Generated React Native app/build.gradle has neither react { } nor a supported plugins { } configuration.');
        }
        gradle = gradle.replace(pluginsBlockWithBody, (match) => match + '\n\nreact {\n    debuggableVariants = []\n}');
      }
    }

    const pluginIsConfigured =
      /id\s*\(?\s*['"]com\.facebook\.react['"]/.test(gradle) ||
      /apply\s+plugin\s*:\s*['"]com\.facebook\.react['"]/.test(gradle);
    if (!pluginIsConfigured || !/debuggableVariants\s*=\s*\[\s*\]/.test(gradle)) {
      throw new Error('Unable to configure the React Native Gradle plugin for a self-contained debug APK.');
    }

    fs.writeFileSync(appBuildGradle, gradle);

    // Do not rely exclusively on the Gradle plugin to bundle JavaScript:
    // some generated/template combinations can still assemble a native APK
    // without registering createBundleDebugJsAndAssets. Pre-bundle explicitly
    // into Android's source assets so the APK remains launchable without Metro.
    const reactNativeCli = path.join(projectRoot, 'node_modules', '.bin', 'react-native');
    if (!fs.existsSync(reactNativeCli)) {
      throw new Error('React Native CLI executable is missing; cannot create a self-contained Android JavaScript bundle.');
    }
    const entryFile = resolveReactNativeEntryFile(projectRoot);
    const androidAssetsPath = path.join(androidPath, 'app', 'src', 'main', 'assets');
    const jsBundlePath = path.join(androidAssetsPath, 'index.android.bundle');
    fs.mkdirSync(androidAssetsPath, { recursive: true });
    await execFileAsync(
      reactNativeCli,
      [
        'bundle',
        '--platform', 'android',
        '--dev', 'true',
        '--entry-file', entryFile,
        '--bundle-output', jsBundlePath,
        '--assets-dest', path.join(androidPath, 'app', 'src', 'main', 'res'),
      ],
      {
        cwd: projectRoot,
        timeout: Number(process.env.BUILD_TIMEOUT_MS) || 30 * 60 * 1000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    if (!fs.existsSync(jsBundlePath) || fs.statSync(jsBundlePath).size === 0) {
      throw new Error('React Native bundle command completed without creating android/app/src/main/assets/index.android.bundle.');
    }

    return { reactNativeVersion, cliVersion, androidPath };
  } catch (error) {
    fs.rmSync(androidPath, { recursive: true, force: true });
    throw error;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
