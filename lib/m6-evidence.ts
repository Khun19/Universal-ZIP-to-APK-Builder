export type M6GateId =
  | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7'
  | 'G8' | 'G9' | 'G10' | 'G11' | 'G12' | 'G13';

export type M6StageName =
  | 'detection'
  | 'dependency-install'
  | 'toolchain-preflight'
  | 'metro-bundle'
  | 'native-compile'
  | 'apk-validation'
  | 'install'
  | 'launch'
  | 'rn-initialization'
  | 'ui-render'
  | 'interaction';

export interface M6StageEvidence {
  stage: M6StageName;
  startedAt: string;
  durationMs: number;
  status: 'PASS' | 'FAIL';
  errorClass?: string;
}

export interface M6ToolchainPreflight {
  nodeVersion: string;
  packageManager: string;
  reactNativeVersion: string;
  javaVersion: string;
  javaMajor: number | null;
  javaHome?: string;
  gradleWrapperVersion?: string;
  agpVersion?: string;
  androidSdk?: string;
  abi?: string;
  checks: {
    jdk17: 'PASS' | 'FAIL';
    gradleAgpCompatibility: 'PASS' | 'FAIL' | 'UNVERIFIED';
  };
  failures: string[];
}

export interface M6BuildEvidence {
  schemaVersion: 1;
  milestone: 'M6';
  strategy: 'react-native';
  gates: Partial<Record<M6GateId, 'PASS' | 'FAIL' | 'UNVERIFIED'>>;
  stages: M6StageEvidence[];
  toolchain?: M6ToolchainPreflight;
  artifact?: {
    path: string;
    sizeBytes: number;
    sha256: string;
  };
  failure?: {
    gate: M6GateId;
    classification: string;
    message: string;
  };
}

export function parseMajorVersion(versionOutput: string): number | null {
  const match = versionOutput.match(/(?:openjdk|java|jdk)[^0-9]*([0-9]+)(?:[._-][0-9]+)*/i)
    ?? versionOutput.match(/version\s+"([0-9]+)(?:[._-][0-9]+)*/i);
  return match ? Number(match[1]) : null;
}

export function parseGradleWrapperVersion(properties: string): string | undefined {
  const match = properties.match(/gradle-([0-9]+(?:\.[0-9]+)+)-(?:all|bin)\.zip/i);
  return match?.[1];
}

export function parseAgpVersion(buildGradle: string): string | undefined {
  const match =
    buildGradle.match(/com\.android\.application['"]?\s+version\s+['"]([0-9]+(?:\.[0-9]+)+)['"]/)
    ?? buildGradle.match(/id\(['"]com\.android\.application['"]\)\s+version\s+['"]([0-9]+(?:\.[0-9]+)+)['"]/);
  return match?.[1];
}

function numericVersion(version: string): number[] {
  return version.split('.').map((part) => Number(part) || 0);
}

export function isVersionAtLeast(actual: string, minimum: string): boolean {
  const a = numericVersion(actual);
  const b = numericVersion(minimum);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv;
  }
  return true;
}

/**
 * Minimum Gradle versions documented by Android Developers for AGP 8.x
 * versions used by the M6 baseline. Unknown versions remain UNVERIFIED
 * instead of being guessed.
 */
export function minimumGradleForAgp(agpVersion?: string): string | undefined {
  if (!agpVersion) return undefined;
  const majorMinor = agpVersion.split('.').slice(0, 2).join('.');
  const minimums: Record<string, string> = {
    '8.7': '8.9',
    '8.8': '8.10.2',
    '8.9': '8.11.1',
    '8.10': '8.11.1',
    '8.11': '8.13',
    '8.12': '8.13',
    '8.13': '8.13',
  };
  return minimums[majorMinor];
}

export function classifyBuildFailure(message: string): string {
  const text = message.toLowerCase();
  if (/aapt2|android\.aapt2frommavenoverride/.test(text)) return 'ANDROID_AAPT2';
  if (/unsupported class file major|requires java|java home|jdk/.test(text)) return 'JDK_COMPATIBILITY';
  if (/plugin .*com\.android\.application|android gradle plugin|agp/.test(text)) return 'AGP_CONFIGURATION';
  if (/could not resolve|could not find|dependency|maven|npm|pnpm|yarn/.test(text)) return 'DEPENDENCY_RESOLUTION';
  if (/hermes|hermesc|jsi|reactnativejni|c\+\+|ndk|clang|linker/.test(text)) return 'NATIVE_TOOLCHAIN';
  if (/metro|bundle|javascript/.test(text)) return 'METRO_BUNDLE';
  if (/outofmemory|out of memory|heap space/.test(text)) return 'RESOURCE_MEMORY';
  if (/no space left|disk space|enospc/.test(text)) return 'RESOURCE_DISK';
  if (/timeout|timed out|connection refused|unknownhost|network/.test(text)) return 'NETWORK_OR_TIMEOUT';
  return 'UNKNOWN_BUILD_FAILURE';
}

export function createM6Evidence(): M6BuildEvidence {
  return {
    schemaVersion: 1,
    milestone: 'M6',
    strategy: 'react-native',
    gates: {
      G1: 'UNVERIFIED', G2: 'UNVERIFIED', G3: 'UNVERIFIED',
      G4: 'UNVERIFIED', G5: 'UNVERIFIED', G6: 'UNVERIFIED',
      G7: 'UNVERIFIED', G8: 'UNVERIFIED', G9: 'UNVERIFIED',
      G10: 'UNVERIFIED', G11: 'UNVERIFIED', G12: 'UNVERIFIED',
      G13: 'UNVERIFIED',
    },
    stages: [],
  };
}
