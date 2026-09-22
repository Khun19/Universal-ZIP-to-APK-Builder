import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { analyzeProjectFiles } from './analyzer.ts';

const execFileAsync = promisify(execFile);
const MANIFEST_NAME = 'package.json';
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '.gradle']);

export type RepairClassification = 'AUTO_REPAIR' | 'NEEDS_INPUT' | 'BLOCKED' | 'UNSAFE';

export interface RepairIssue {
  issueId: string;
  rule: string;
  classification: RepairClassification;
  file: string;
  value: unknown;
  reason: string;
  requiredInput?: string;
  sourceEvidence: string[];
}

export interface RepairEvidence {
  repairId: string;
  issueId: string;
  repairRule: string;
  original: unknown;
  repaired: unknown;
  reason: string;
  sourceEvidence: string[];
  workspacePath: string;
  inputZipHash: string | null;
  inputProjectHash: string;
  repairedProjectHash?: string;
  timestamp: string;
}

export interface AutoRepairResult {
  success: boolean;
  dryRun: boolean;
  buildReady: boolean;
  projectPath: string;
  filePaths: string[];
  issues: RepairIssue[];
  plan: Array<{ issueId: string; rule: string; file: string; from: unknown; to: unknown }>;
  evidence: RepairEvidence[];
  analysis: ReturnType<typeof analyzeProjectFiles>;
  blocker?: RepairIssue;
}

export interface ResolvedLockfile { fileName: 'package-lock.json' | 'pnpm-lock.yaml' | 'yarn.lock' | 'bun.lock' | 'bun.lockb'; content: string | Buffer; }
export type LockfileResolver = (manifest: Record<string, unknown>, sourceRoot: string) => Promise<string | ResolvedLockfile>;

export interface AutoRepairOptions {
  dryRun?: boolean;
  inputZipHash?: string | null;
  resolveLockfile?: LockfileResolver;
}

interface PlannedMutation {
  issue: RepairIssue;
  file: string;
  from: unknown;
  to: unknown;
  apply: (workspaceRoot: string) => Promise<void>;
}

const dependencyGroups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const;

function issue(rule: string, classification: RepairClassification, file: string, value: unknown, reason: string, sourceEvidence: string[], requiredInput?: string): RepairIssue {
  return { issueId: `issue-${randomUUID()}`, rule, classification, file, value, reason, sourceEvidence, ...(requiredInput ? { requiredInput } : {}) };
}

function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function hashTree(root: string): Promise<string> {
  const hash = createHash('sha256');
  const walk = async (dir: string, relative = ''): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (relative === '' && EXCLUDED_DIRS.has(entry.name)) continue;
      const rel = path.posix.join(relative.split(path.sep).join('/'), entry.name);
      if (rel === '.builder/auto-repair-evidence.json') continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in repair input: ${rel}`);
      if (entry.isDirectory()) {
        if (rel === '.builder') {
          const children = await fs.readdir(absolute);
          if (children.length === 0 || children.every((child) => child === 'auto-repair-evidence.json')) continue;
        }
        hash.update(`dir:${rel}\0`);
        await walk(absolute, rel);
      } else if (entry.isFile()) {
        hash.update(`file:${rel}\0`);
        hash.update(await fs.readFile(absolute));
      }
    }
  };
  await walk(root);
  return hash.digest('hex');
}

async function copyTreeSafe(source: string, destination: string): Promise<void> {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in repair input: ${from}`);
    if (entry.isDirectory()) await copyTreeSafe(from, to);
    else if (entry.isFile()) {
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to, 1);
    }
  }
}

async function findPackageManifests(root: string): Promise<Array<{ file: string; json: Record<string, unknown> }>> {
  const found: Array<{ file: string; json: Record<string, unknown> }> = [];
  let visited = 0;
  const walk = async (dir: string): Promise<void> => {
    const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (++visited > 5000) throw new Error('Project contains too many entries to inspect safely');
      if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in repair input: ${path.join(dir, entry.name)}`);
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) await walk(absolute);
      } else if (entry.isFile() && entry.name === MANIFEST_NAME) {
        try {
          const json = JSON.parse(await fs.readFile(absolute, 'utf8')) as Record<string, unknown>;
          found.push({ file: absolute, json });
        } catch (error) {
          throw new Error(`Invalid package.json at ${absolute}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  };
  await walk(root);
  return found;
}

function dependencyEntries(manifest: Record<string, unknown>): Array<{ group: string; name: string; value: string }> {
  const result: Array<{ group: string; name: string; value: string }> = [];
  for (const group of dependencyGroups) {
    const deps = manifest[group];
    if (!deps || typeof deps !== 'object' || Array.isArray(deps)) continue;
    for (const [name, value] of Object.entries(deps as Record<string, unknown>)) {
      if (typeof value === 'string') result.push({ group, name, value });
    }
  }
  return result;
}

function workspaceCatalogs(rootManifest: Record<string, unknown>, pnpmWorkspace: string): Map<string, string> {
  const catalogs = new Map<string, string>();
  const workspaces = rootManifest.workspaces as Record<string, unknown> | undefined;
  const npmCatalog = workspaces?.catalog;
  if (npmCatalog && typeof npmCatalog === 'object' && !Array.isArray(npmCatalog)) {
    for (const [name, version] of Object.entries(npmCatalog as Record<string, unknown>)) {
      if (typeof version === 'string') catalogs.set(name, version);
    }
  }
  const lines = pnpmWorkspace.split(/\r?\n/);
  let section: 'catalog' | 'catalogs' | '' = '';
  let catalogName = '';
  for (const line of lines) {
    const top = line.match(/^(catalogs?):\s*$/);
    if (top) { section = top[1] as 'catalog' | 'catalogs'; catalogName = ''; continue; }
    if (/^[^\s#]/.test(line)) { section = ''; continue; }
    const indent = line.match(/^(\s*)/g)?.[0].length ?? 0;
    const pair = line.trim().match(/^['"]?([^:'"]+)['"]?:\s*['"]?([^'"#]+?)['"]?\s*(?:#.*)?$/);
    if (!pair) continue;
    if (section === 'catalog' && indent >= 2) catalogs.set(pair[1].trim(), pair[2].trim());
    else if (section === 'catalogs' && indent === 2) catalogName = pair[1].trim();
    else if (section === 'catalogs' && indent >= 4 && catalogName) catalogs.set(`${catalogName}:${pair[1].trim()}`, pair[2].trim());
  }
  return catalogs;
}

async function defaultLockfileResolver(manifest: Record<string, unknown>, sourceRoot: string): Promise<ResolvedLockfile> {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-builder-lock-'));
  try {
    await copyTreeSafe(sourceRoot, temp);
    await fs.writeFile(path.join(temp, 'package.json'), canonicalJson(manifest));
    await fs.rm(path.join(temp, '.npmrc'), { force: true });
    const declaredManager = typeof manifest.packageManager === 'string' ? manifest.packageManager : '';
    const usePnpm = declaredManager.startsWith('pnpm@') || await fs.stat(path.join(sourceRoot, 'pnpm-workspace.yaml')).then(() => true, () => false);
    const useYarn = declaredManager.startsWith('yarn@');
    const useBun = declaredManager.startsWith('bun@');
    const manager = usePnpm ? 'pnpm' : useYarn ? 'yarn' : useBun ? 'bun' : 'npm';
    const userConfig = path.join(temp, '.repair-user.npmrc');
    const globalConfig = path.join(temp, '.repair-global.npmrc');
    await fs.writeFile(userConfig, '');
    await fs.writeFile(globalConfig, '');
    const yarnMajor = Number(declaredManager.match(/^yarn@(\d+)/)?.[1] ?? 1);
    const args = usePnpm
      ? ['install', '--lockfile-only', '--ignore-scripts', '--config.ignore-scripts=true']
      : useYarn && yarnMajor >= 2
        ? ['install', '--mode=update-lockfile', '--ignore-scripts']
        : useYarn
          ? ['install', '--ignore-scripts', '--non-interactive']
          : useBun
            ? ['install', '--lockfile-only', '--ignore-scripts']
            : ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund', `--userconfig=${userConfig}`, `--globalconfig=${globalConfig}`];
    await execFileAsync(manager, args, {
      cwd: temp,
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false' },
    });
    let fileName: ResolvedLockfile['fileName'] = usePnpm ? 'pnpm-lock.yaml' : useYarn ? 'yarn.lock' : useBun ? 'bun.lock' : 'package-lock.json';
    if (useBun && !(await fs.stat(path.join(temp, fileName)).then(() => true, () => false))) fileName = 'bun.lockb';
    const lock = await fs.readFile(path.join(temp, fileName));
    if (fileName === 'package-lock.json') JSON.parse(lock.toString('utf8'));
    const content = fileName === 'bun.lockb' ? lock : lock.toString('utf8').endsWith('\n') ? lock.toString('utf8') : `${lock.toString('utf8')}\n`;
    return { fileName, content };
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

function pathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function collectWorkspacePackages(root: string, manifests: Array<{ file: string; json: Record<string, unknown> }>): Promise<Map<string, { dir: string; version: string; ambiguous?: boolean }>> {
  const packages = new Map<string, { dir: string; version: string; ambiguous?: boolean }>();
  for (const manifest of manifests) {
    const name = manifest.json.name;
    const version = manifest.json.version;
    if (typeof name === 'string' && typeof version === 'string') {
      if (packages.has(name)) packages.set(name, { ...packages.get(name)!, ambiguous: true });
      else packages.set(name, { dir: path.dirname(manifest.file), version });
    }
  }
  return packages;
}

export async function runAutoRepair(sourceRoot: string, sourceFilePaths: string[], options: AutoRepairOptions = {}): Promise<AutoRepairResult> {
  const root = path.resolve(sourceRoot);
  const normalizedPaths = sourceFilePaths.map((entry) => entry.replace(/\\/g, '/'));
  const sourceProjectHash = await hashTree(root);
  const packagePath = path.join(root, MANIFEST_NAME);
  let rootManifest: Record<string, unknown> = {};
  if (await fs.stat(packagePath).then((s) => s.isFile()).catch(() => false)) {
    rootManifest = JSON.parse(await fs.readFile(packagePath, 'utf8')) as Record<string, unknown>;
  }
  const manifests = await findPackageManifests(root);
  const packageMap = await collectWorkspacePackages(root, manifests);
  const issues: RepairIssue[] = [];
  const mutations: PlannedMutation[] = [];
  const packageChanges: Array<{ issue: RepairIssue; group: string; name: string; original: string; repaired: string }> = [];
  const rootManifestFile = path.relative(root, packagePath).split(path.sep).join('/');
  const rootDeps = dependencyEntries(rootManifest);
  const catalogFile = path.join(root, 'pnpm-workspace.yaml');
  const catalogText = await fs.readFile(catalogFile, 'utf8').catch(() => '');
  const catalogs = workspaceCatalogs(rootManifest, catalogText);

  for (const dep of rootDeps) {
    if (/^workspace:(\*|\^|~)$/.test(dep.value)) {
      const local = packageMap.get(dep.name);
      if (local?.ambiguous) {
        issues.push(issue('workspace-dependency', 'BLOCKED', rootManifestFile, { name: dep.name, value: dep.value }, 'Multiple local packages declare the referenced workspace name, so the source cannot be selected deterministically.', [`${dep.group}.${dep.name}=${dep.value}`], `Keep exactly one workspace package named ${dep.name} in the uploaded project.`));
        continue;
      }
      if (!local || !pathInside(root, local.dir)) {
        issues.push(issue('workspace-dependency', 'BLOCKED', rootManifestFile, { name: dep.name, value: dep.value }, 'Referenced workspace package source or version metadata is unavailable inside the uploaded project.', [`${dep.group}.${dep.name}=${dep.value}`], `Provide package ${dep.name} and its package.json inside the source ZIP.`));
        continue;
      }
      const relative = path.relative(path.dirname(packagePath), local.dir).split(path.sep).join('/') || '.';
      const repaired = `file:${relative.startsWith('.') ? relative : `./${relative}`}`;
      const found = issue('workspace-dependency', 'AUTO_REPAIR', rootManifestFile, { name: dep.name, value: dep.value }, 'Resolved the workspace reference to the available local package directory.', [`${dep.group}.${dep.name}=${dep.value}`, `${path.relative(root, local.dir).split(path.sep).join('/')}/package.json name=${dep.name} version=${local.version}`]);
      issues.push(found);
      packageChanges.push({ issue: found, group: dep.group, name: dep.name, original: dep.value, repaired });
    } else if (dep.value.startsWith('catalog:')) {
      const suffix = dep.value.slice('catalog:'.length);
      const key = suffix ? `${suffix}:${dep.name}` : dep.name;
      const resolved = catalogs.get(key);
      if (!resolved) {
        issues.push(issue('catalog-dependency', 'BLOCKED', rootManifestFile, { name: dep.name, value: dep.value }, 'No matching catalog definition is available in package.json or pnpm-workspace.yaml.', [`${dep.group}.${dep.name}=${dep.value}`], `Provide a catalog entry for ${dep.name} or replace the catalog reference in the source project.`));
        continue;
      }
      const found = issue('catalog-dependency', 'AUTO_REPAIR', rootManifestFile, { name: dep.name, value: dep.value }, 'Resolved the catalog reference from a project-local catalog definition.', [`${dep.group}.${dep.name}=${dep.value}`, `catalog.${key}=${resolved}`]);
      issues.push(found);
      packageChanges.push({ issue: found, group: dep.group, name: dep.name, original: dep.value, repaired: resolved });
    } else if (dep.value.startsWith('file:')) {
      const raw = dep.value.slice('file:'.length);
      const candidate = path.resolve(path.dirname(packagePath), raw);
      if (!pathInside(root, candidate)) {
        issues.push(issue('external-project-reference', 'BLOCKED', rootManifestFile, { name: dep.name, value: dep.value }, 'The file dependency resolves outside the uploaded project context.', [`${dep.group}.${dep.name}=${dep.value}`], `Include ${dep.name} source within the uploaded project or provide an approved workspace source.`));
      } else if (!(await fs.stat(candidate).then((s) => s.isDirectory() || s.isFile()).catch(() => false))) {
        issues.push(issue('external-project-reference', 'BLOCKED', rootManifestFile, { name: dep.name, value: dep.value }, 'The referenced local project source does not exist in the uploaded context.', [`${dep.group}.${dep.name}=${dep.value}`], `Include the source path ${raw} in the uploaded project.`));
      }
    }
  }

  // TypeScript project references may point outside a nested project but must remain inside this source context.
  for (const rel of normalizedPaths.filter((p) => /^tsconfig(?:\.[^/]+)?\.json$/.test(path.posix.basename(p)))) {
    const absolute = path.resolve(root, rel);
    if (!pathInside(root, absolute)) {
      issues.push(issue('external-project-reference', 'UNSAFE', rel, rel, 'Project configuration path escapes the uploaded workspace.', [`archive entry ${rel}`]));
      continue;
    }
    const config = JSON.parse(await fs.readFile(absolute, 'utf8')) as { references?: Array<{ path?: unknown }> };
    for (const ref of config.references ?? []) {
      if (typeof ref.path !== 'string') continue;
      const target = path.resolve(path.dirname(absolute), ref.path);
      if (!pathInside(root, target)) {
        issues.push(issue('external-project-reference', 'BLOCKED', rel, ref.path, 'TypeScript project reference resolves outside the uploaded project context.', [`${rel}: references[].path=${ref.path}`], `Include the referenced project within the uploaded source.`));
      } else if (!(await fs.stat(target).then((s) => s.isDirectory() || s.isFile()).catch(() => false))) {
        issues.push(issue('external-project-reference', 'BLOCKED', rel, ref.path, 'Referenced TypeScript project source is missing.', [`${rel}: references[].path=${ref.path}`], `Include the referenced source at ${ref.path}.`));
      } else if (ref.path.startsWith('..')) {
        issues.push(issue('external-project-reference', 'AUTO_REPAIR', rel, ref.path, 'Referenced source exists in the uploaded workspace and is copied into the isolated repair workspace.', [`${rel}: references[].path=${ref.path}`, `resolved source=${path.relative(root, target).split(path.sep).join('/')}`]));
      }
    }
  }

  let lockResult: ResolvedLockfile | undefined;
  const hasLock = ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'].some((name) => normalizedPaths.includes(name));
  if (Object.keys(rootManifest).length > 0 && !hasLock) {
    const unresolved = issues.find((entry) => entry.classification !== 'AUTO_REPAIR');
    const declaredManager = typeof rootManifest.packageManager === 'string' ? rootManifest.packageManager : '';
    const recognizedManager = !declaredManager || ['npm@', 'pnpm@', 'yarn@', 'bun@'].some((prefix) => declaredManager.startsWith(prefix));
    const usesPnpm = declaredManager.startsWith('pnpm@') || await fs.stat(path.join(root, 'pnpm-workspace.yaml')).then(() => true, () => false);
    const managerConflict = declaredManager && !declaredManager.startsWith('pnpm@') && await fs.stat(path.join(root, 'pnpm-workspace.yaml')).then(() => true, () => false);
    const usesYarn = declaredManager.startsWith('yarn@');
    const hasPnpmHook = normalizedPaths.some((entry) => path.posix.basename(entry) === '.pnpmfile.cjs' || path.posix.basename(entry) === '.pnpmfile.mjs');
    const hasYarnHook = usesYarn && normalizedPaths.some((entry) => entry === '.yarnrc' || entry === '.yarnrc.yml' || entry.startsWith('.yarn/plugins/'));
    if (unresolved) {
      // Other safe repairs may still be applied; lock resolution is blocked until inputs are complete.
      issues.push(issue('missing-lockfile', 'BLOCKED', rootManifestFile, null, `Lockfile generation is deferred because ${String((unresolved.value as { name?: unknown })?.name ?? unresolved.rule)} is unresolved.`, ['package.json declares dependencies but no supported lockfile is present.'], 'Resolve the reported dependency/source metadata and retry.'));
    } else if (!recognizedManager) {
      issues.push(issue('missing-lockfile', 'BLOCKED', rootManifestFile, declaredManager, `The declared package manager ${declaredManager} does not have an allowlisted lockfile resolver.`, [`packageManager=${declaredManager}`], 'Provide a supported npm, pnpm, Yarn, or Bun packageManager declaration.'));
    } else if (managerConflict) {
      issues.push(issue('missing-lockfile', 'NEEDS_INPUT', rootManifestFile, declaredManager, 'packageManager conflicts with pnpm-workspace.yaml, so the correct lockfile resolver cannot be selected deterministically.', [`packageManager=${declaredManager}`, 'pnpm-workspace.yaml is present.'], 'Declare the intended package manager or remove stale workspace configuration.'));
    } else if (usesPnpm && hasPnpmHook) {
      issues.push(issue('missing-lockfile', 'UNSAFE', rootManifestFile, '.pnpmfile.cjs/.pnpmfile.mjs', 'A pnpm hook can execute project-controlled code during package resolution and is not allowed during Auto-Repair.', ['pnpmfile hook detected in uploaded project.'], 'Remove the pnpm hook or provide a complete lockfile so package resolution is not required.'));
    } else if (hasYarnHook) {
      issues.push(issue('missing-lockfile', 'UNSAFE', rootManifestFile, '.yarnrc / .yarn/plugins', 'Yarn project configuration may load project-controlled plugin or Yarn executable code during package resolution.', ['Yarn executable/plugin configuration detected in uploaded project.'], 'Remove the executable Yarn hook or provide a complete yarn.lock so package resolution is not required.'));
    } else {
      const normalizedManifest = structuredClone(rootManifest);
      for (const change of packageChanges) {
        const deps = normalizedManifest[change.group] as Record<string, unknown>;
        deps[change.name] = change.repaired;
      }
      try {
        const resolved = await (options.resolveLockfile ?? defaultLockfileResolver)(normalizedManifest, root);
        lockResult = typeof resolved === 'string' ? { fileName: 'package-lock.json', content: resolved } : resolved;
        const found = issue('missing-lockfile', 'AUTO_REPAIR', lockResult.fileName, null, `Generated a ${lockResult.fileName} for the declared dependency graph with lifecycle scripts disabled.`, ['package.json contains explicit dependency specifiers.', `Allowlisted ${declaredManager || 'detected package manager'} lockfile-only resolution with lifecycle scripts disabled.`]);
        issues.push(found);
      } catch (error) {
        issues.push(issue('missing-lockfile', 'BLOCKED', rootManifestFile, null, `Dependency graph could not be resolved without guessing: ${error instanceof Error ? error.message : String(error)}`, ['package.json contains dependencies but no lockfile is present.'], 'Provide a complete supported lockfile or make the declared dependencies resolvable from the configured package registry.'));
      }
    }
  }

  for (const change of packageChanges) {
    mutations.push({
      issue: change.issue, file: rootManifestFile, from: change.original, to: change.repaired,
      apply: async (workspaceRoot) => {
        const file = path.join(workspaceRoot, rootManifestFile);
        const manifest = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
        const deps = manifest[change.group] as Record<string, unknown>;
        deps[change.name] = change.repaired;
        await fs.writeFile(file, canonicalJson(manifest));
      },
    });
  }
  if (lockResult !== undefined) {
    const lockIssue = issues.find((entry) => entry.rule === 'missing-lockfile' && entry.classification === 'AUTO_REPAIR')!;
    mutations.push({ issue: lockIssue, file: lockResult.fileName, from: null, to: `generated ${lockResult.fileName}`, apply: async (workspaceRoot) => { await fs.writeFile(path.join(workspaceRoot, lockResult!.fileName), lockResult!.content); } });
  }

  const expo = typeof (rootManifest.dependencies as Record<string, unknown> | undefined)?.expo === 'string' || normalizedPaths.some((entry) => /(^|\/)app\.config\.(js|ts|json)$/.test(entry) || /(^|\/)app\.json$/.test(entry));
  const hasAndroid = normalizedPaths.some((entry) => /^android\/(settings\.gradle(\.kts)?|app\/)/.test(entry));
  if (expo && !hasAndroid) {
    issues.push(issue('managed-expo-android-generation', 'AUTO_REPAIR', 'android/', null, 'Managed Expo project is reliably detected; existing strategy may generate Android scaffolding using its supported prebuild operation.', ['Expo dependency or app configuration detected.', 'No android/ project is present.']));
  }

  const unsafe = issues.find((entry) => entry.classification === 'UNSAFE');
  const plan = mutations.map(({ issue: entry, file, from, to }) => ({ issueId: entry.issueId, rule: entry.rule, file, from, to }));
  const allowedRules = new Set(['workspace-dependency', 'catalog-dependency', 'missing-lockfile']);
  const policyFailure = mutations.find((mutation) =>
    !allowedRules.has(mutation.issue.rule) ||
    mutation.issue.classification !== 'AUTO_REPAIR' ||
    !pathInside(root, path.resolve(root, mutation.file))
  );
  if (policyFailure) throw new Error(`Repair policy rejected unallowlisted operation: ${policyFailure.issue.rule}`);
  const initialAnalysis = analyzeProjectFiles(normalizedPaths, rootManifest);

  if (unsafe) {
    return { success: false, dryRun: Boolean(options.dryRun), buildReady: false, projectPath: root, filePaths: normalizedPaths, issues, plan: [], evidence: [], analysis: initialAnalysis, blocker: unsafe };
  }

  if (options.dryRun) {
    return { success: true, dryRun: true, buildReady: !issues.some((entry) => entry.classification === 'BLOCKED' || entry.classification === 'NEEDS_INPUT'), projectPath: root, filePaths: normalizedPaths, issues, plan, evidence: [], analysis: initialAnalysis, blocker: issues.find((entry) => entry.classification === 'BLOCKED' || entry.classification === 'NEEDS_INPUT') };
  }

  const repairRoot = await fs.mkdtemp(path.join(path.dirname(root), `${path.basename(root)}-repair-`));
  await copyTreeSafe(root, repairRoot);
  const evidence: RepairEvidence[] = [];
  try {
    for (const mutation of mutations) {
      const beforeHash = await hashTree(repairRoot);
      await mutation.apply(repairRoot);
      const afterHash = await hashTree(repairRoot);
      evidence.push({
        repairId: `repair-${randomUUID()}`, issueId: mutation.issue.issueId, repairRule: mutation.issue.rule,
        original: mutation.from, repaired: mutation.to, reason: mutation.issue.reason,
        sourceEvidence: mutation.issue.sourceEvidence, workspacePath: repairRoot,
        inputZipHash: options.inputZipHash ?? null, inputProjectHash: sourceProjectHash,
        repairedProjectHash: afterHash, timestamp: new Date().toISOString(),
      });
      if (beforeHash === afterHash) throw new Error(`Repair ${mutation.issue.rule} did not change workspace state`);
    }
    for (const informational of issues.filter((entry) => entry.rule === 'external-project-reference' && entry.classification === 'AUTO_REPAIR')) {
      evidence.push({
        repairId: `repair-${randomUUID()}`, issueId: informational.issueId, repairRule: informational.rule,
        original: informational.value, repaired: informational.value, reason: informational.reason,
        sourceEvidence: informational.sourceEvidence, workspacePath: repairRoot,
        inputZipHash: options.inputZipHash ?? null, inputProjectHash: sourceProjectHash,
        repairedProjectHash: await hashTree(repairRoot), timestamp: new Date().toISOString(),
      });
    }
    const evidencePath = path.join(repairRoot, '.builder', 'auto-repair-evidence.json');
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(evidencePath, canonicalJson(evidence));
    const repairedFilePaths = [...normalizedPaths, ...mutations.map((mutation) => mutation.file)].filter((value, index, all) => all.indexOf(value) === index);
    const repairedManifest = await fs.readFile(path.join(repairRoot, MANIFEST_NAME), 'utf8').then((text) => JSON.parse(text) as Record<string, unknown>).catch(() => ({}));
    const postAnalysis = analyzeProjectFiles(repairedFilePaths, repairedManifest);
    const blocker = issues.find((entry) => entry.classification === 'BLOCKED' || entry.classification === 'NEEDS_INPUT');
    const finalProjectHash = await hashTree(repairRoot);
    for (const item of evidence) item.repairedProjectHash = finalProjectHash;
    await fs.writeFile(evidencePath, canonicalJson(evidence));
    return { success: !blocker, dryRun: false, buildReady: !blocker && postAnalysis.projectType !== 'Unknown', projectPath: repairRoot, filePaths: repairedFilePaths, issues, plan, evidence, analysis: postAnalysis, blocker };
  } catch (error) {
    await fs.rm(repairRoot, { recursive: true, force: true });
    throw error;
  }
}
