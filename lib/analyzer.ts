import * as path from 'path';

export interface AnalysisResult {
  projectType:
    | 'Native Android'
    | 'Capacitor'
    | 'React/Vite Web App'
    | 'Plain HTML/JS'
    | 'Unknown';
  confidence: number;
  evidence: string[];
  warnings: string[];
}

/**
 * Validate an archive entry before it is ever resolved against a workspace.
 * The check is deliberately conservative: absolute paths, drive-qualified
 * paths, NUL/control characters, and normalized traversal are rejected.
 */
export function validateZipEntry(entryPath: string): boolean {
  if (typeof entryPath !== 'string' || entryPath.length === 0 || entryPath.length > 4096) {
    return false;
  }

  if (entryPath.includes('\0') || /[\x00-\x1f\x7f]/.test(entryPath)) {
    return false;
  }

  const normalized = entryPath.replace(/\\/g, '/');

  if (
    normalized.startsWith('/') ||
    /^[A-Za-z]:($|\/)/.test(normalized)
  ) {
    return false;
  }

  const normalizedPath = path.posix.normalize(normalized);
  if (normalizedPath === '..' || normalizedPath.startsWith('../')) {
    return false;
  }

  return true;
}

export function analyzeProjectFiles(filePaths: string[]): AnalysisResult {
  const evidence: string[] = [];
  const warnings: string[] = [];
  const normalizedPaths = filePaths.map((filePath) =>
    filePath.replace(/\\/g, '/'),
  );

  const hasBuildGradle = normalizedPaths.some(
    (filePath) =>
      filePath.endsWith('build.gradle') ||
      filePath.endsWith('build.gradle.kts'),
  );
  const hasAndroidManifest = normalizedPaths.some((filePath) =>
    filePath.endsWith('AndroidManifest.xml'),
  );
  const hasCapacitorConfig = normalizedPaths.some((filePath) =>
    /(^|\/)capacitor\.config\.(json|js|cjs|ts|mjs)$/.test(filePath),
  );
  const hasAndroidDirectory = normalizedPaths.some((filePath) =>
    /^android\/(settings\.gradle|settings\.gradle\.kts|app\/)/.test(
      filePath,
    ),
  );

  if (hasCapacitorConfig) {
    evidence.push('Capacitor configuration detected');
    if (hasAndroidDirectory) {
      evidence.push('Capacitor Android platform detected');
    } else {
      warnings.push(
        'Capacitor Android platform is missing; the build will try to add it using the local Capacitor CLI',
      );
    }
    return {
      projectType: 'Capacitor',
      confidence: hasAndroidDirectory ? 98 : 90,
      evidence,
      warnings,
    };
  }

  if (hasBuildGradle && hasAndroidManifest) {
    evidence.push('build.gradle detected');
    evidence.push('AndroidManifest.xml detected');
    return {
      projectType: 'Native Android',
      confidence: 95,
      evidence,
      warnings,
    };
  }

  const hasPackageJson = normalizedPaths.some((filePath) =>
    filePath.endsWith('package.json'),
  );
  const hasViteConfig = normalizedPaths.some((filePath) =>
    filePath.includes('vite.config.'),
  );
  const hasIndexHtml = normalizedPaths.some((filePath) =>
    filePath.endsWith('index.html'),
  );

  if (hasPackageJson && (hasViteConfig || hasIndexHtml)) {
    evidence.push('package.json detected');
    if (hasViteConfig) evidence.push('Vite config detected');
    if (hasIndexHtml) evidence.push('index.html detected');
    return {
      projectType: 'React/Vite Web App',
      confidence: 90,
      evidence,
      warnings,
    };
  }

  if (hasIndexHtml && !hasPackageJson) {
    evidence.push('index.html detected without package.json');
    return {
      projectType: 'Plain HTML/JS',
      confidence: 80,
      evidence,
      warnings: ['Advanced framework configuration not found'],
    };
  }

  warnings.push('Could not determine exact project type');
  return { projectType: 'Unknown', confidence: 0, evidence, warnings };
}
