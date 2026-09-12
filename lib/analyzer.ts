import * as path from 'path';

export interface AnalysisResult {
  projectType: 'Native Android' | 'Flutter' | 'Capacitor' | 'React/Vite Web App' | 'Plain HTML/JS' | 'Unknown';
  confidence: number;
  evidence: string[];
  warnings: string[];
}

export function validateZipEntry(entryPath: string): boolean {
  if (entryPath.includes('..') || path.isAbsolute(entryPath)) return false;
  if (/^[a-zA-Z]:\\/.test(entryPath)) return false;
  return true;
}

export function analyzeProjectFiles(filePaths: string[]): AnalysisResult {
  const evidence: string[] = [];
  const warnings: string[] = [];
  const normalizedPaths = filePaths.map((filePath) => filePath.replace(/\\/g, '/'));
  const hasFlutterManifest = normalizedPaths.some((p) => /(^|\/)pubspec\.yaml$/.test(p));
  const hasFlutterMain = normalizedPaths.some((p) => /(^|\/)lib\/main\.dart$/.test(p));
  const hasFlutterAndroid = normalizedPaths.some((p) => /^android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(p));
  const hasBuildGradle = normalizedPaths.some((p) => p.endsWith('build.gradle') || p.endsWith('build.gradle.kts'));
  const hasAndroidManifest = normalizedPaths.some((p) => p.endsWith('AndroidManifest.xml'));
  const hasCapacitorConfig = normalizedPaths.some((p) => /(^|\/)capacitor\.config\.(json|js|cjs|ts|mjs)$/.test(p));
  const hasAndroidDirectory = normalizedPaths.some((p) => /^android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(p));

  // Flutter must be checked before native Android because every normal Flutter
  // Android project contains Gradle files and an AndroidManifest.
  if (hasFlutterManifest && hasFlutterMain) {
    evidence.push('pubspec.yaml detected');
    evidence.push('lib/main.dart detected');
    if (hasFlutterAndroid) evidence.push('Flutter Android platform detected');
    else warnings.push('Flutter Android platform is missing; flutter build apk may regenerate required files only when supported by the project.');
    return { projectType: 'Flutter', confidence: hasFlutterAndroid ? 99 : 94, evidence, warnings };
  }

  if (hasCapacitorConfig) {
    evidence.push('Capacitor configuration detected');
    if (hasAndroidDirectory) evidence.push('Capacitor Android platform detected');
    else warnings.push('Capacitor Android platform is missing; the build will try to add it using the local Capacitor CLI');
    return { projectType: 'Capacitor', confidence: hasAndroidDirectory ? 98 : 90, evidence, warnings };
  }

  if (hasBuildGradle && hasAndroidManifest) {
    evidence.push('build.gradle detected');
    evidence.push('AndroidManifest.xml detected');
    return { projectType: 'Native Android', confidence: 95, evidence, warnings };
  }

  const hasPackageJson = normalizedPaths.some((p) => p.endsWith('package.json'));
  const hasViteConfig = normalizedPaths.some((p) => p.includes('vite.config.'));
  const hasIndexHtml = normalizedPaths.some((p) => p.endsWith('index.html'));
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
