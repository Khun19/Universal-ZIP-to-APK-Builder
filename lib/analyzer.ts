import * as path from 'path';

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
}

export function validateZipEntry(entryPath: string): boolean {
  if (entryPath.includes('..') || path.isAbsolute(entryPath)) return false;
  if (/^[a-zA-Z]:\\/.test(entryPath)) return false;
  return true;
}

export function analyzeProjectFiles(
  filePaths: string[],
  packageJson: Record<string, unknown> = {},
): AnalysisResult {
  const evidence: string[] = [];
  const warnings: string[] = [];
  const normalizedPaths = filePaths.map((filePath) => filePath.replace(/\\/g, '/'));

  const hasBuildGradle = normalizedPaths.some((filePath) => filePath.endsWith('build.gradle') || filePath.endsWith('build.gradle.kts'));
  const hasAndroidManifest = normalizedPaths.some((filePath) => filePath.endsWith('AndroidManifest.xml'));
  const hasCapacitorConfig = normalizedPaths.some((filePath) => /(^|\/)capacitor\.config\.(json|js|cjs|ts|mjs)$/.test(filePath));
  const hasAndroidDirectory = normalizedPaths.some((filePath) => /^android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(filePath));

  if (hasCapacitorConfig) {
    evidence.push('Capacitor configuration detected');
    if (hasAndroidDirectory) evidence.push('Capacitor Android platform detected');
    else warnings.push('Capacitor Android platform is missing; the build will try to add it using the local Capacitor CLI');
    return { projectType: 'Capacitor', confidence: hasAndroidDirectory ? 98 : 90, evidence, warnings };
  }

  const hasFlutterMarkers = normalizedPaths.some((filePath) => filePath === 'pubspec.yaml' || filePath.endsWith('/pubspec.yaml'));
  const hasFlutterDirectory = normalizedPaths.some((filePath) => filePath === 'lib/main.dart' || filePath.endsWith('/lib/main.dart'));
  const hasFlutterAndroid = normalizedPaths.some((filePath) => /^android\/(app\/|settings\.gradle|settings\.gradle\.kts)/.test(filePath));
  if (hasFlutterMarkers && hasFlutterDirectory) {
    evidence.push('Flutter pubspec.yaml detected');
    evidence.push('Flutter lib/main.dart detected');
    if (hasFlutterAndroid) evidence.push('Flutter Android platform detected');
    else warnings.push('Flutter Android platform is missing; run flutter create . with the local Flutter SDK before building');
    return { projectType: 'Flutter', confidence: hasFlutterAndroid ? 99 : 94, evidence, warnings };
  }

  const dependencies = {
    ...((packageJson.dependencies as Record<string, unknown> | undefined) ?? {}),
    ...((packageJson.devDependencies as Record<string, unknown> | undefined) ?? {}),
  };
  const hasExpoConfig = normalizedPaths.some((filePath) => /(^|\/)app\.config\.(js|ts|json)$/.test(filePath) || /(^|\/)app\.json$/.test(filePath));
  const hasExpoDependency = typeof dependencies.expo === 'string';
  const hasReactNativeDependency = typeof dependencies['react-native'] === 'string';
  const hasAndroidProject = normalizedPaths.some((filePath) => /^android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(filePath));
  if (hasExpoDependency || hasExpoConfig) {
    evidence.push('Expo project markers detected');
    if (hasExpoDependency) evidence.push('expo dependency detected');
    if (hasExpoConfig) evidence.push('Expo configuration detected');
    if (hasAndroidProject) evidence.push('Android project detected');
    else warnings.push('Android platform is missing; local Expo prebuild is required before Gradle');
    return { projectType: 'Expo', confidence: hasAndroidProject ? 97 : 92, evidence, warnings };
  }
  if (hasReactNativeDependency) {
    evidence.push('React Native dependency detected');
    if (hasAndroidProject) evidence.push('Android project detected');
    else warnings.push('Android platform is missing; a native Android project is required for local APK builds');
    return { projectType: 'React Native', confidence: hasAndroidProject ? 97 : 88, evidence, warnings };
  }

  if (hasBuildGradle && hasAndroidManifest) {
    evidence.push('build.gradle detected');
    evidence.push('AndroidManifest.xml detected');
    return { projectType: 'Native Android', confidence: 95, evidence, warnings };
  }

  const hasPackageJson = normalizedPaths.some((filePath) => filePath.endsWith('package.json'));
  const hasViteConfig = normalizedPaths.some((filePath) => filePath.includes('vite.config.'));
  const hasIndexHtml = normalizedPaths.some((filePath) => filePath.endsWith('index.html'));

  if (hasPackageJson && (hasViteConfig || hasIndexHtml)) {
    evidence.push('package.json detected');
    if (hasViteConfig) evidence.push('Vite config detected');
    if (hasIndexHtml) evidence.push('index.html detected');
    return { projectType: 'React/Vite Web App', confidence: 90, evidence, warnings };
  }

  if (hasIndexHtml && !hasPackageJson) {
    evidence.push('index.html detected without package.json');
    return { projectType: 'Plain HTML/JS', confidence: 80, evidence, warnings: ['Advanced framework configuration not found'] };
  }

  warnings.push('Could not determine exact project type');
  return { projectType: 'Unknown', confidence: 0, evidence, warnings };
}
