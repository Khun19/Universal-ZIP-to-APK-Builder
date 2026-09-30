import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import {
  M6ToolchainPreflight,
  minimumGradleForAgp,
  parseAgpVersion,
  parseGradleWrapperVersion,
  parseMajorVersion,
  isVersionAtLeast,
} from './m6-evidence.ts';

const execFileAsync = promisify(execFile);

function findJava17Home(): string | undefined {
  const prefix = process.env.PREFIX;
  const candidates = [
    process.env.JAVA_17_HOME,
    prefix ? path.join(prefix, 'lib/jvm/java-17-openjdk') : undefined,
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/java-17-openjdk-amd64',
    '/usr/lib/jvm/java-17-openjdk-arm64',
  ].filter((value): value is string => Boolean(value));
  return candidates.find((value) => fs.existsSync(path.join(value, 'bin', 'java')));
}

function readFirstExisting(...files: string[]): string {
  for (const file of files) {
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  return '';
}

export async function collectReactNativeToolchainPreflight(
  projectPath: string,
  androidProjectPath: string,
  packageJson: Record<string, unknown>,
): Promise<M6ToolchainPreflight> {
  const failures: string[] = [];
  const reactNativeVersion =
    String((packageJson.dependencies as Record<string, unknown> | undefined)?.['react-native'] ?? 'unknown');

  const packageManager = fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : fs.existsSync(path.join(projectPath, 'yarn.lock'))
      ? 'yarn'
      : fs.existsSync(path.join(projectPath, 'bun.lockb')) || fs.existsSync(path.join(projectPath, 'bun.lock'))
        ? 'bun'
        : 'npm';

  const javaHome = findJava17Home();
  let javaVersion = 'unavailable';
  let javaMajor: number | null = null;

  if (javaHome) {
    try {
      const result = await execFileAsync(path.join(javaHome, 'bin', 'java'), ['-version'], {
        env: {
          ...process.env,
          JAVA_HOME: javaHome,
          PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
        },
        timeout: 10_000,
        maxBuffer: 64 * 1024,
      });
      javaVersion = String(result.stderr || result.stdout || '').trim().split(/\r?\n/)[0] || 'unknown';
      javaMajor = parseMajorVersion(javaVersion);
    } catch (error: any) {
      const output = String(error?.stderr || error?.stdout || error?.message || '');
      javaVersion = output.trim().split(/\r?\n/)[0] || 'unavailable';
      javaMajor = parseMajorVersion(output);
    }
  }

  if (!javaHome || javaMajor !== 17) {
    failures.push('M6 requires JDK 17 for the React Native Android baseline.');
  }

  const rootGradle = readFirstExisting(
    path.join(androidProjectPath, 'build.gradle'),
    path.join(androidProjectPath, 'build.gradle.kts'),
  );
  const wrapperProperties = readFirstExisting(
    path.join(androidProjectPath, 'gradle/wrapper/gradle-wrapper.properties'),
  );

  const agpVersion = parseAgpVersion(rootGradle);
  const gradleWrapperVersion = parseGradleWrapperVersion(wrapperProperties);
  const minimumGradle = minimumGradleForAgp(agpVersion);

  let gradleAgpCompatibility: 'PASS' | 'FAIL' | 'UNVERIFIED' = 'UNVERIFIED';
  if (agpVersion && gradleWrapperVersion && minimumGradle) {
    gradleAgpCompatibility = isVersionAtLeast(gradleWrapperVersion, minimumGradle)
      ? 'PASS'
      : 'FAIL';
    if (gradleAgpCompatibility === 'FAIL') {
      failures.push(
        `AGP ${agpVersion} requires Gradle >= ${minimumGradle}; wrapper declares ${gradleWrapperVersion}.`,
      );
    }
  }

  let packageManagerVersion = 'unavailable';
  try {
    const result = await execFileAsync(packageManager, ['--version'], {
      cwd: projectPath,
      timeout: 10_000,
      maxBuffer: 64 * 1024,
    });
    packageManagerVersion = String(result.stdout || '').trim();
  } catch {
    // Dependency installation reports the actionable failure.
  }

  const androidSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

  return {
    nodeVersion: process.version,
    packageManager: `${packageManager}@${packageManagerVersion || 'unknown'}`,
    reactNativeVersion,
    javaVersion,
    javaMajor,
    javaHome,
    gradleWrapperVersion,
    agpVersion,
    androidSdk,
    abi: process.arch,
    checks: {
      jdk17: failures.some((failure) => failure.includes('JDK 17')) ? 'FAIL' : 'PASS',
      gradleAgpCompatibility,
    },
    failures,
  };
}

export function assertReactNativeToolchainPreflight(preflight: M6ToolchainPreflight): void {
  if (preflight.checks.jdk17 === 'FAIL') {
    throw new Error(preflight.failures.find((failure) => failure.includes('JDK 17')) || 'JDK 17 preflight failed.');
  }
  if (preflight.checks.gradleAgpCompatibility === 'FAIL') {
    throw new Error(
      preflight.failures.find((failure) => failure.includes('AGP ')) ||
      'Gradle/AGP compatibility preflight failed.',
    );
  }
}
