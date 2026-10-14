import * as path from 'path';

export interface DetectionCheck {
  stage: string;
  passed: boolean;
  detail: string;
}

export interface AnalysisResult {
  projectType:
    | 'Native Android'
    | 'Capacitor'
    | 'React/Vite Web App'
    | 'Plain HTML/JS'
    | 'Flutter'
    | 'React Native'
    | 'Expo'
    | 'Unknown';
  confidence: number;
  evidence: string[];
  warnings: string[];
  checks: DetectionCheck[];
}

export function validateZipEntry(entryPath: string): boolean {
  if (entryPath.includes('..') || path.isAbsolute(entryPath)) return false;
  if (/^[a-zA-Z]:\\/.test(entryPath)) return false;
  return true;
}

const hasPath = (paths: string[], suffix: string): boolean =>
  paths.some((filePath) => filePath === suffix || filePath.endsWith('/' + suffix));

const hasDependency = (dependencies: Record<string, unknown>, name: string): boolean =>
  typeof dependencies[name] === 'string' && String(dependencies[name]).trim().length > 0;

const hasAppConfigPath = (paths: string[]): boolean =>
  paths.some((p) => /(^|\/)app\.config\.(js|ts|json)$/.test(p));

export function analyzeProjectFiles(
  filePaths: string[],
  packageJson: Record<string, unknown> = {},
): AnalysisResult {
  const evidence: string[] = [];
  const warnings: string[] = [];
  const checks: DetectionCheck[] = [];
  const normalizedPaths = filePaths
    .map((filePath) => filePath.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+/g, '/'))
    .filter(Boolean);

  const record = (stage: string, passed: boolean, detail: string) => {
    checks.push({ stage, passed, detail });
  };
  const result = (projectType: AnalysisResult['projectType'], confidence: number): AnalysisResult =>
    ({ projectType, confidence, evidence, warnings, checks });

  record('1-path-normalization', normalizedPaths.length > 0,
    normalizedPaths.length > 0 ? String(normalizedPaths.length) + ' normalized project paths' : 'ZIP contains no usable project paths');

  const dependencies = {
    ...((packageJson.dependencies as Record<string, unknown> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, unknown> | undefined) ?? {}),
    ...((packageJson.optionalDependencies as Record<string, unknown> | undefined) ?? {}),
  };
  const hasPackageJson = hasPath(normalizedPaths, 'package.json');
  const hasAppJson = hasPath(normalizedPaths, 'app.json');
  const hasAppConfig = hasAppConfigPath(normalizedPaths);
  const hasExpoDependency = hasDependency(dependencies, 'expo');
  const hasReactNativeDependency = hasDependency(dependencies, 'react-native');
  const hasCapacitorConfig = normalizedPaths.some((p) => /(^|\/)capacitor\.config\.(json|js|cjs|ts|mjs)$/.test(p));
  const hasCapacitorDependency = hasDependency(dependencies, '@capacitor/core') || hasDependency(dependencies, '@capacitor/android');
  const hasFlutterManifest = hasPath(normalizedPaths, 'pubspec.yaml');
  const hasFlutterEntry = hasPath(normalizedPaths, 'lib/main.dart');
  const hasAndroidManifest = hasPath(normalizedPaths, 'AndroidManifest.xml');
  const hasGradleBuild = normalizedPaths.some((p) => p.endsWith('/build.gradle') || p.endsWith('/build.gradle.kts') || p === 'build.gradle' || p === 'build.gradle.kts');
  const hasAndroidProject = normalizedPaths.some((p) =>
    /(^|\/)android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(p));
  const hasViteConfig = normalizedPaths.some((p) => /(^|\/)vite\.config\.[^/]+$/.test(p));
  const hasIndexHtml = hasPath(normalizedPaths, 'index.html');
  const hasReactDependency = hasDependency(dependencies, 'react');
  const hasViteDependency = hasDependency(dependencies, 'vite');

  record('2-package-manifest', hasPackageJson || hasFlutterManifest || hasAndroidManifest,
    'package.json=' + hasPackageJson + '; pubspec.yaml=' + hasFlutterManifest + '; AndroidManifest.xml=' + hasAndroidManifest);
  record('3-framework-dependencies', hasExpoDependency || hasReactNativeDependency || hasCapacitorDependency || hasReactDependency || hasViteDependency,
    'expo=' + hasExpoDependency + '; react-native=' + hasReactNativeDependency + '; capacitor=' + hasCapacitorDependency + '; react=' + hasReactDependency + '; vite=' + hasViteDependency);
  record('4-platform-markers', hasAndroidProject || hasFlutterEntry || hasAppJson || hasAppConfig || hasCapacitorConfig || hasViteConfig || hasIndexHtml,
    'android=' + hasAndroidProject + '; flutter-entry=' + hasFlutterEntry + '; app.json=' + hasAppJson + '; app.config=' + hasAppConfig + '; capacitor.config=' + hasCapacitorConfig + '; vite.config=' + hasViteConfig + '; index.html=' + hasIndexHtml);

  // app.json is shared by plain React Native and Expo; it is never proof of Expo by itself.
  if (hasExpoDependency) {
    evidence.push('Explicit expo dependency found in package.json dependency sections');
    if (hasReactNativeDependency) evidence.push('React Native runtime dependency also present');
    if (hasAppConfig) evidence.push('Expo-specific app.config.* file present');
    if (hasAndroidProject) evidence.push('Android Gradle project present');
    if (!hasAndroidProject) warnings.push('Android platform missing; Expo prebuild is required for this confirmed Expo project');
    record('5-framework-decision', true, 'Expo selected because the expo package is explicitly declared');
    return result('Expo', hasAndroidProject ? 99 : 96);
  }

  if (hasReactNativeDependency) {
    evidence.push('Explicit react-native dependency found in package.json');
    if (hasAppJson) evidence.push('app.json present; treated as app metadata, not Expo proof');
    if (hasAppConfig) warnings.push('app.config.* exists without expo dependency; classified by declared runtime and Expo prebuild will not be assumed');
    if (hasAndroidProject) evidence.push('Android Gradle project present');
    else warnings.push('Android platform missing; Builder must generate a native Android project before APK compilation');
    record('5-framework-decision', true, 'React Native selected; Expo dependency absent');
    return result('React Native', hasAndroidProject ? 98 : 90);
  }

  if (hasCapacitorConfig && hasCapacitorDependency) {
    evidence.push('Capacitor config and @capacitor/core/@capacitor/android dependency both present');
    if (hasAndroidProject) evidence.push('Android platform present');
    else warnings.push('Capacitor Android platform missing; add/sync the Android platform before Gradle build');
    record('5-framework-decision', true, 'Capacitor selected from matching config and package dependency');
    return result('Capacitor', hasAndroidProject ? 99 : 94);
  }
  if (hasCapacitorConfig || hasCapacitorDependency) {
    warnings.push('Incomplete Capacitor signature: config and @capacitor/core or @capacitor/android dependency must agree');
    record('5-framework-decision', false, 'Capacitor evidence conflicts or is incomplete; continuing to other signatures');
  }

  if (hasFlutterManifest && hasFlutterEntry) {
    evidence.push('Both pubspec.yaml and lib/main.dart are present');
    if (hasAndroidProject) evidence.push('Flutter Android Gradle project present');
    else warnings.push('Flutter Android platform missing; run flutter create . with the local Flutter SDK before building');
    record('5-framework-decision', true, 'Flutter selected from paired manifest and Dart entry-point signatures');
    return result('Flutter', hasAndroidProject ? 99 : 95);
  }
  if (hasFlutterManifest || hasFlutterEntry) {
    warnings.push('Incomplete Flutter signature: both pubspec.yaml and lib/main.dart are required');
    record('5-framework-decision', false, 'Flutter markers are incomplete');
  }

  if (hasGradleBuild && hasAndroidManifest) {
    evidence.push('Gradle build file and AndroidManifest.xml both present');
    record('5-framework-decision', true, 'Native Android selected from paired Gradle and manifest signatures');
    return result('Native Android', 96);
  }
  if (hasGradleBuild || hasAndroidManifest) {
    warnings.push('Incomplete Native Android signature: Gradle build file and AndroidManifest.xml must both be present');
    record('5-framework-decision', false, 'Native Android markers are incomplete');
  }

  if (hasPackageJson && hasViteConfig && hasViteDependency && (hasReactDependency || hasIndexHtml)) {
    evidence.push('package.json, vite.config.*, vite dependency, and web/React entry marker present');
    record('5-framework-decision', true, 'React/Vite Web App selected from combined package and config evidence');
    return result('React/Vite Web App', 96);
  }
  if (hasPackageJson && hasIndexHtml && (hasReactDependency || (hasViteConfig && hasViteDependency)) &&
      !hasReactNativeDependency && !hasExpoDependency && !hasCapacitorConfig && !hasCapacitorDependency) {
    evidence.push('package.json and index.html paired with React or explicit Vite dependency/config');
    record('5-framework-decision', true, 'React/Vite Web App selected from framework dependency and web entry evidence');
    return result('React/Vite Web App', 93);
  }
  if (hasIndexHtml && !hasPackageJson) {
    evidence.push('index.html present without package.json');
    warnings.push('Only a plain HTML entry point was found; framework-specific dependencies were not identified');
    record('5-framework-decision', true, 'Plain HTML/JS selected from HTML entry point alone');
    return result('Plain HTML/JS', 80);
  }

  warnings.push('Could not determine the framework from a complete, non-conflicting signature; build blocked to avoid selecting the wrong toolchain');
  record('5-framework-decision', false, 'No framework met the required evidence threshold');
  return result('Unknown', 0);
}
