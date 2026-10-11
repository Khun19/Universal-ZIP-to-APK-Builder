import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

  const parent = path.dirname(projectRoot);
  const tempRoot = path.join(parent, `.builder-rn-scaffold-${path.basename(projectRoot)}`);
  const scaffoldProject = path.join(tempRoot, 'BuilderScaffold');
  const generatedAndroid = path.join(scaffoldProject, 'android');

  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });

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
    return { reactNativeVersion, cliVersion, androidPath };
  } catch (error) {
    fs.rmSync(androidPath, { recursive: true, force: true });
    throw error;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
