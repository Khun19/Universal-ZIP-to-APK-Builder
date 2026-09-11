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
  blockers: string[];
}

export function validateZipEntry(entryPath: string): boolean {
  if (entryPath.includes('..') || path.isAbsolute(entryPath)) {
    return false;
  }
  if (/^[a-zA-Z]:\\/.test(entryPath)) {
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
      blockers: [],
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
      blockers: [],
    };
  }

  const hasPackageJson = normalizedPaths.some((filePath) =>
    filePath.endsWith('package.json'),
  );

  const backendEvidence: string[] = [];

  const serverFiles = normalizedPaths.filter((filePath) =>
    /(^|\/)(server|backend|api|routes)(\/|\.)/i.test(filePath) ||
    /(^|\/)(server|app|api)\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(filePath),
  );

  if (serverFiles.length) {
    backendEvidence.push(
      `Backend/server source detected: ${serverFiles.slice(0, 5).join(', ')}`,
    );
  }

  const packageJsonPath = normalizedPaths.find((filePath) =>
    filePath.endsWith('package.json'),
  );

  if (packageJsonPath) {
    const packageIndex = normalizedPaths.indexOf(packageJsonPath);
    void packageIndex;
  }

  const backendDependencyNames = [
    'express',
    'fastify',
    'koa',
    'hono',
    '@hapi/hapi',
    'nestjs',
    '@nestjs/core',
    'elysia',
  ];

  const likelyEnvFiles = normalizedPaths.filter((filePath) =>
    /(^|\/)\.env(\..*)?$/i.test(filePath),
  );

  if (likelyEnvFiles.length) {
    backendEvidence.push('Environment configuration detected');
  }
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
    if (backendEvidence.length) {
      evidence.push(...backendEvidence);
      return {
        projectType: 'React/Vite Web App',
        confidence: 96,
        evidence,
        warnings,
        blockers: [
          'Backend/server functionality was detected. The static WebView wrapper cannot execute the project server runtime.',
        ],
      };
    }

    return {
      projectType: 'React/Vite Web App',
      confidence: 90,
      evidence,
      warnings,
      blockers: [],
    };
  }

  if (hasIndexHtml && !hasPackageJson) {
    evidence.push('index.html detected without package.json');
    return {
      projectType: 'Plain HTML/JS',
      confidence: 80,
      evidence,
      warnings: ['Advanced framework configuration not found'],
        blockers: [],
    };
  }

  warnings.push('Could not determine exact project type');
  return { projectType: 'Unknown', confidence: 0, evidence, warnings, blockers: [] };
}
