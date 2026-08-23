import * as path from 'path';

export interface AnalysisResult {
  projectType: 'Native Android' | 'React/Vite Web App' | 'Plain HTML/JS' | 'Unknown';
  confidence: number;
  evidence: string[];
  warnings: string[];
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

  const hasBuildGradle = filePaths.some(f => f.endsWith('build.gradle') || f.endsWith('build.gradle.kts'));
  const hasAndroidManifest = filePaths.some(f => f.includes('AndroidManifest.xml'));

  if (hasBuildGradle && hasAndroidManifest) {
    evidence.push('build.gradle detected');
    evidence.push('AndroidManifest.xml detected');
    return { projectType: 'Native Android', confidence: 95, evidence, warnings };
  }

  const hasPackageJson = filePaths.some(f => f.endsWith('package.json'));
  const hasViteConfig = filePaths.some(f => f.includes('vite.config.'));
  const hasIndexHtml = filePaths.some(f => f.includes('index.html'));

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
