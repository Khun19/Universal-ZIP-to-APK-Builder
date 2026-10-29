import * as fs from 'node:fs';
import * as path from 'node:path';

export type DetectedFramework = 'Expo' | 'React Native' | 'Capacitor' | 'Flutter' | 'Native Android' | 'React/Vite Web App' | 'Unknown';

export interface ProjectCandidate {
  appRoot: string;
  relativeAppRoot: string;
  framework: DetectedFramework;
  score: number;
  packageName?: string;
  hasAndroidProject: boolean;
}

export interface ProjectLayout {
  status: 'selected' | 'ambiguous' | 'blocked';
  archiveRoot: string;
  appRoot?: string;
  relativeAppRoot?: string;
  workspaceRoot?: string;
  relativeWorkspaceRoot?: string;
  framework?: DetectedFramework;
  candidates: ProjectCandidate[];
  dependencyProtocols: string[];
  logs: string[];
  error?: string;
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', '.gradle', 'build', 'dist', 'coverage', '.next', '.workspace']);
const MAX_DEPTH = 5;
const MAX_MANIFESTS = 500;

function inside(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function dependencyMap(pkg: Record<string, unknown>): Record<string, unknown> {
  return { ...record(pkg.dependencies), ...record(pkg.devDependencies), ...record(pkg.optionalDependencies) };
}

function hasAndroid(root: string): boolean {
  const android = path.join(root, 'android');
  return fs.existsSync(path.join(android, 'settings.gradle')) ||
    fs.existsSync(path.join(android, 'settings.gradle.kts')) ||
    (fs.existsSync(path.join(root, 'settings.gradle')) && fs.existsSync(path.join(root, 'app')));
}

function frameworkFor(root: string, pkg: Record<string, unknown>): { framework: DetectedFramework; score: number; buildable: boolean } {
  const deps = dependencyMap(pkg);
  const scripts = record(pkg.scripts);
  const android = hasAndroid(root);
  if (typeof deps.expo === 'string') return { framework: 'Expo', score: 100 + (android ? 4 : 0), buildable: true };
  if (typeof deps['react-native'] === 'string') return { framework: 'React Native', score: 90 + (android ? 4 : 0), buildable: true };
  if (typeof deps['@capacitor/core'] === 'string' || typeof deps['@capacitor/android'] === 'string') {
    return { framework: 'Capacitor', score: 85 + (android ? 4 : 0), buildable: true };
  }
  if (fs.existsSync(path.join(root, 'pubspec.yaml')) && fs.existsSync(path.join(root, 'lib', 'main.dart'))) {
    return { framework: 'Flutter', score: 95 + (android ? 4 : 0), buildable: true };
  }
  if (android && (fs.existsSync(path.join(root, 'build.gradle')) || fs.existsSync(path.join(root, 'build.gradle.kts')))) {
    return { framework: 'Native Android', score: 88, buildable: true };
  }
  const hasViteConfig = fs.readdirSync(root, { withFileTypes: true }).some(entry => entry.isFile() && /^vite\\.config\\.[^/]+$/.test(entry.name));
  const hasWebEntry = fs.existsSync(path.join(root, 'index.html'));
  if (typeof deps.vite === 'string' && (typeof deps.react === 'string' || hasWebEntry) && (hasWebEntry || hasViteConfig)) {
    return { framework: 'React/Vite Web App', score: 70, buildable: true };
  }
  // A workspace root with only tooling and workspace references is not itself an app.
  const workspaceOnly = Boolean(pkg.workspaces) || fs.existsSync(path.join(root, 'pnpm-workspace.yaml'));
  const hasBuildScript = typeof scripts.build === 'string';
  if (!workspaceOnly && hasBuildScript && fs.existsSync(path.join(root, 'index.html'))) {
    return { framework: 'React/Vite Web App', score: 55, buildable: true };
  }
  return { framework: 'Unknown', score: 0, buildable: false };
}

function listManifestDirs(root: string): string[] {
  const results: string[] = [];
  const queue: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];
  while (queue.length && results.length < MAX_MANIFESTS) {
    const current = queue.shift()!;
    const hasPackage = fs.existsSync(path.join(current.dir, 'package.json'));
    const hasFlutterManifest = fs.existsSync(path.join(current.dir, 'pubspec.yaml')) && fs.existsSync(path.join(current.dir, 'lib', 'main.dart'));
    const hasNativeAndroid = hasAndroid(current.dir) && (
      fs.existsSync(path.join(current.dir, 'build.gradle')) ||
      fs.existsSync(path.join(current.dir, 'build.gradle.kts'))
    );
    if (hasPackage || hasFlutterManifest || hasNativeAndroid) results.push(current.dir);
    if (current.depth >= MAX_DEPTH) continue;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(current.dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || SKIP_DIRS.has(entry.name)) continue;
      const child = path.join(current.dir, entry.name);
      if (inside(root, child)) queue.push({ dir: child, depth: current.depth + 1 });
    }
  }
  return results;
}

function findWorkspaceRoot(archiveRoot: string, appRoot: string): string | undefined {
  let current = appRoot;
  let found: string | undefined;
  while (inside(archiveRoot, current)) {
    const pkg = readJson(path.join(current, 'package.json'));
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml')) || (pkg && pkg.workspaces)) found = current;
    if (current === archiveRoot) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return found;
}

export function resolveProjectLayout(extractionRoot: string): ProjectLayout {
  const archiveRoot = path.resolve(extractionRoot);
  const logs = [`[Layout] archive root: ${archiveRoot}`];
  if (!fs.existsSync(archiveRoot) || !fs.statSync(archiveRoot).isDirectory()) {
    return { status: 'blocked', archiveRoot, candidates: [], dependencyProtocols: [], logs, error: 'Extracted archive root is missing or is not a directory.' };
  }

  const candidates: ProjectCandidate[] = [];
  for (const dir of listManifestDirs(archiveRoot)) {
    const pkg = readJson(path.join(dir, 'package.json')) ?? {};
    const signature = frameworkFor(dir, pkg);
    if (!signature.buildable) continue;
    candidates.push({
      appRoot: dir,
      relativeAppRoot: path.relative(archiveRoot, dir).split(path.sep).join('/') || '.',
      framework: signature.framework,
      score: signature.score,
      packageName: typeof pkg.name === 'string' ? pkg.name : undefined,
      hasAndroidProject: hasAndroid(dir),
    });
  }

  // A React Native/Expo app's nested android/ directory is its native
  // platform project, not a second independent app root. Suppress only this
  // structural child candidate; independent nested native apps remain ambiguous.
  const embeddedAndroidRoots = new Set(
    candidates
      .filter(parent => parent.framework === 'React Native' || parent.framework === 'Expo')
      .map(parent => path.resolve(parent.appRoot, 'android')),
  );
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];
    if (candidate.framework === 'Native Android' && embeddedAndroidRoots.has(path.resolve(candidate.appRoot))) {
      logs.push(`[Layout] ignored embedded Android platform root: ${candidate.relativeAppRoot}`);
      candidates.splice(index, 1);
    }
  }

  // Also support native/Flutter projects that do not have package.json.
  if (!candidates.length && fs.existsSync(path.join(archiveRoot, 'pubspec.yaml')) && fs.existsSync(path.join(archiveRoot, 'lib', 'main.dart'))) {
    candidates.push({ appRoot: archiveRoot, relativeAppRoot: '.', framework: 'Flutter', score: 95, hasAndroidProject: hasAndroid(archiveRoot) });
  }

  candidates.sort((a, b) => b.score - a.score || a.relativeAppRoot.localeCompare(b.relativeAppRoot));
  logs.push(`[Layout] buildable app candidates: ${candidates.length}`);
  if (!candidates.length) {
    return { status: 'blocked', archiveRoot, candidates, dependencyProtocols: [], logs, error: 'No supported buildable app manifest was found within the bounded search depth (5). Add a supported framework manifest or inspect the ZIP structure.' };
  }

  // If multiple app roots are present, do not silently pick one even if one scores higher.
  if (candidates.length > 1) {
    logs.push(`[Layout] ambiguous candidates: ${candidates.map(c => c.relativeAppRoot + ' (' + c.framework + ')').join(', ')}`);
    return { status: 'ambiguous', archiveRoot, candidates, dependencyProtocols: [], logs, error: 'Multiple buildable app roots were found. Select a target app explicitly; Builder will not guess.' };
  }

  const candidate = candidates[0];
  const pkg = readJson(path.join(candidate.appRoot, 'package.json')) ?? {};
  const deps = dependencyMap(pkg);
  const protocols = Object.entries(deps)
    .filter(([, value]) => typeof value === 'string' && /^(workspace:|catalog:)/.test(value as string))
    .map(([name, value]) => `${name}=${String(value)}`);
  const workspaceRoot = findWorkspaceRoot(archiveRoot, candidate.appRoot);
  const workspaceLockfile = workspaceRoot && (
    fs.existsSync(path.join(workspaceRoot, 'pnpm-lock.yaml')) ||
    fs.existsSync(path.join(workspaceRoot, 'package-lock.json')) ||
    fs.existsSync(path.join(workspaceRoot, 'yarn.lock'))
  );

  logs.push(`[Layout] selected app root: ${candidate.relativeAppRoot}`);
  logs.push(`[Layout] framework: ${candidate.framework}`);
  logs.push(`[Layout] workspace root: ${workspaceRoot ? path.relative(archiveRoot, workspaceRoot).split(path.sep).join('/') || '.' : 'none'}`);
  logs.push(`[Layout] dependency protocols: ${protocols.length ? protocols.join(', ') : 'none'}`);

  if (protocols.length && !workspaceRoot) {
    return { status: 'blocked', archiveRoot, candidates, dependencyProtocols: protocols, logs, error: `Workspace dependency references require a workspace root, but none was found: ${protocols.join(', ')}` };
  }
  const workspacePackage = workspaceRoot ? readJson(path.join(workspaceRoot, 'package.json')) : undefined;
  const workspaceMetadata = record(workspacePackage?.workspaces);
  const workspacePackages = Array.isArray(workspacePackage?.workspaces)
    ? workspacePackage?.workspaces as unknown[]
    : Array.isArray(workspaceMetadata.packages) ? workspaceMetadata.packages as unknown[] : [];
  const workspaceCatalog = record(workspaceMetadata.catalog);
  const canRecoverPnpmWorkspace = Boolean(
    workspaceRoot &&
    workspacePackages.length > 0 &&
    fs.existsSync(path.join(workspaceRoot, 'pnpm-lock.yaml')) &&
    Object.keys(workspaceCatalog).length > 0
  );
  if (protocols.some(value => value.includes('=catalog:')) &&
      (!workspaceRoot || (!fs.existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml')) && !canRecoverPnpmWorkspace))) {
    return { status: 'blocked', archiveRoot, candidates, dependencyProtocols: protocols, logs, error: 'catalog: dependencies were found but pnpm workspace/catalog metadata is incomplete. Builder can recover a missing pnpm-workspace.yaml only when package.json provides workspace package patterns and a catalog map.' };
  }
  if (workspaceRoot && protocols.length && !workspaceLockfile) {
    return { status: 'blocked', archiveRoot, candidates, dependencyProtocols: protocols, logs, error: 'Workspace dependencies were found but no workspace lockfile is present. Refusing an implicit install that could rewrite dependency state.' };
  }

  return {
    status: 'selected',
    archiveRoot,
    appRoot: candidate.appRoot,
    relativeAppRoot: candidate.relativeAppRoot,
    workspaceRoot,
    relativeWorkspaceRoot: workspaceRoot ? path.relative(archiveRoot, workspaceRoot).split(path.sep).join('/') || '.' : undefined,
    framework: candidate.framework,
    candidates,
    dependencyProtocols: protocols,
    logs,
  };
}
