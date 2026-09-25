import * as fs from 'fs';
import * as path from 'path';

export interface ReactNativeSourceBuildResult {
  changed: boolean;
  mode: 'source';
  reason: string;
}

const RN_INCLUDE_BUILD = "includeBuild('../node_modules/react-native')";

const RN_SUBSTITUTION_BLOCK = [
  "includeBuild('../node_modules/react-native') {",
  '    dependencySubstitution {',
  "        substitute(module('com.facebook.react:react-android'))",
  "            .using(project(':packages:react-native:ReactAndroid'))",
  "        substitute(module('com.facebook.react:react-native'))",
  "            .using(project(':packages:react-native:ReactAndroid'))",
  "        substitute(module('com.facebook.react:hermes-android'))",
  "            .using(project(':packages:react-native:ReactAndroid:hermes-engine'))",
  "        substitute(module('com.facebook.react:hermes-engine'))",
  "            .using(project(':packages:react-native:ReactAndroid:hermes-engine'))",
  '    }',
  '}',
].join('\\n');

function hasReactNativeSourceBuild(settings: string): boolean {
  return (
    settings.includes(RN_INCLUDE_BUILD) &&
    settings.includes('com.facebook.react:react-android') &&
    settings.includes('com.facebook.react:hermes-android') &&
    settings.includes(':packages:react-native:ReactAndroid')
  );
}

/**
 * Configure a React Native Android workspace to consume ReactAndroid and
 * Hermes from the installed react-native package.
 *
 * This is the source-build mechanism documented by React Native itself.
 * The builder applies it inside the disposable extracted workspace; it does
 * not fork, vendor, or replace React Native.
 */
export function prepareReactNativeSourceBuild(
  projectPath: string,
  androidProjectPath: string,
): ReactNativeSourceBuildResult {
  const reactNativePackage = path.join(projectPath, 'node_modules', 'react-native');
  if (!fs.existsSync(path.join(reactNativePackage, 'settings.gradle.kts'))) {
    throw new Error(
      'React Native source-build preparation requires node_modules/react-native/settings.gradle.kts.',
    );
  }

  const settingsPath = path.join(androidProjectPath, 'settings.gradle');
  const settingsKtsPath = path.join(androidProjectPath, 'settings.gradle.kts');
  const settingsPathToUse = fs.existsSync(settingsPath) ? settingsPath : settingsKtsPath;

  if (!fs.existsSync(settingsPathToUse)) {
    throw new Error('React Native Android project has no settings.gradle/settings.gradle.kts.');
  }

  if (settingsPathToUse.endsWith('.kts')) {
    throw new Error(
      'React Native source-build preparation currently requires Groovy android/settings.gradle.',
    );
  }

  const original = fs.readFileSync(settingsPathToUse, 'utf8');
  if (hasReactNativeSourceBuild(original)) {
    return {
      changed: false,
      mode: 'source',
      reason: 'Official React Native source-build composite is already configured.',
    };
  }

  const block = '\n\n// Official React Native build-from-source integration.\n' + RN_SUBSTITUTION_BLOCK + '\n';
  const updated = original.replace(/\\s*$/, '') + block;

  fs.writeFileSync(settingsPathToUse, updated);
  return {
    changed: true,
    mode: 'source',
    reason: 'Added the official React Native source-build composite and dependency substitutions.',
  };
}

export function isReactNativeProject(projectPath: string): boolean {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
    };
    const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
    return typeof deps['react-native'] === 'string';
  } catch {
    return false;
  }
}

export function getReactNativeBuildCommand(androidProjectPath: string): string {
  const wrapper = path.join(androidProjectPath, 'gradlew');
  return fs.existsSync(wrapper)
    ? 'bash ./gradlew assembleDebug --no-daemon --stacktrace'
    : 'gradle assembleDebug --no-daemon --stacktrace';
}