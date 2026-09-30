import { test } from 'node:test';
import assert from 'node:assert';
import { assertReactNativeToolchainPreflight } from '../lib/m6-preflight.ts';
import {
  classifyBuildFailure,
  isVersionAtLeast,
  minimumGradleForAgp,
  parseAgpVersion,
  parseGradleWrapperVersion,
  parseMajorVersion,
} from '../lib/m6-evidence.ts';

test('M6 evidence parsers capture the canonical RN Android toolchain', () => {
  assert.strictEqual(parseMajorVersion('openjdk version "17.0.20" 2025-01-21'), 17);
  assert.strictEqual(
    parseGradleWrapperVersion(
      'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-all.zip',
    ),
    '8.10.2',
  );
  assert.strictEqual(
    parseAgpVersion(
      "id 'com.android.application' version '8.7.3' apply false",
    ),
    '8.7.3',
  );
  assert.strictEqual(minimumGradleForAgp('8.7.3'), '8.9');
  assert.strictEqual(isVersionAtLeast('8.10.2', '8.9'), true);
  assert.strictEqual(isVersionAtLeast('8.8', '8.9'), false);
});

test('M6 evidence classification distinguishes native and resource failures', () => {
  assert.strictEqual(classifyBuildFailure('clang linker failed while building hermes'), 'NATIVE_TOOLCHAIN');
  assert.strictEqual(classifyBuildFailure('Java 21 is not supported by this Gradle build'), 'JDK_COMPATIBILITY');
  assert.strictEqual(classifyBuildFailure('No space left on device'), 'RESOURCE_DISK');
  assert.strictEqual(classifyBuildFailure('Connection refused while downloading Gradle'), 'NETWORK_OR_TIMEOUT');
});

test('M6 evidence does not guess unknown AGP compatibility', () => {
  assert.strictEqual(minimumGradleForAgp('9.4.1'), undefined);
});


test('M6 preflight accepts the canonical RN 0.76.9 toolchain contract', () => {
  assert.doesNotThrow(() => assertReactNativeToolchainPreflight({
    nodeVersion: 'v24.18.0',
    packageManager: 'pnpm@11.23.0',
    reactNativeVersion: '0.76.9',
    javaVersion: 'openjdk version "17.0.20"',
    javaMajor: 17,
    javaHome: '/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk',
    gradleWrapperVersion: '8.10.2',
    agpVersion: '8.7.3',
    androidSdk: '/data/data/com.termux/files/home/android-sdk',
    abi: 'arm64',
    checks: { jdk17: 'PASS', gradleAgpCompatibility: 'PASS' },
    failures: [],
  }));
});
