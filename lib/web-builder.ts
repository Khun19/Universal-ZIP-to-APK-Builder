import * as fs from 'fs';
import * as path from 'path';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface WebBuildResult {
  success: boolean;
  outputDir?: string;
  logs: string[];
  error?: string;
}

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const PUBLIC_NPM_REGISTRY = 'https://registry.npmjs.org';
const PWA_WORKBOX_PACKAGE = 'workbox-window';
const VITE_PWA_PACKAGE = 'vite-plugin-pwa';
const MINIMUM_RELEASE_AGE_ERROR = 'ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION';

/**
 * Replit-generated package-lock files can contain resolved tarball URLs that
 * point at Replit's private package firewall. Those URLs are not portable to
 * Termux, CI, Docker, or other local environments. Remove only those
 * environment-specific `resolved` fields and preserve the lockfile's
 * integrity hashes so npm can resolve the package from the public registry.
 */
export function sanitizeNpmLockfile(projectPath: string): number {
  const lockfilePath = path.join(projectPath, 'package-lock.json');
  if (!fs.existsSync(lockfilePath)) return 0;

  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8')) as unknown;
  let sanitized = 0;

  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    const record = value as Record<string, unknown>;
    if (typeof record.resolved === 'string') {
      try {
        const url = new URL(record.resolved);
        if (url.hostname === 'package-firewall.replit.internal' || url.hostname.endsWith('.replit.internal')) {
          delete record.resolved;
          sanitized += 1;
        }
      } catch {
        // Leave non-URL resolved values untouched.
      }
    }

    for (const child of Object.values(record)) visit(child);
  };

  visit(lockfile);
  if (sanitized > 0) fs.writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
  return sanitized;
}

function detectPackageManager(projectPath: string): PackageManager {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';

  if (fs.existsSync(path.join(projectPath, 'bun.lock')) || fs.existsSync(path.join(projectPath, 'bun.lockb'))) {
    try {
      execFileSync('bun', ['--version'], { stdio: 'ignore' });
      return 'bun';
    } catch {
      return 'pnpm';
    }
  }

  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function webProjectScore(directory: string): number {
  let score = 0;
  const packageJsonPath = path.join(directory, 'package.json');
  const indexPath = path.join(directory, 'index.html');

  if (fs.existsSync(indexPath)) score = 3;
  if (fs.existsSync(packageJsonPath)) {
    score = Math.max(score, 1);
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (typeof packageJson.scripts?.build === 'string') score = 4;
    } catch {
      // buildWebProject will report the useful package.json parse error later.
    }
  }
  return score;
}

export function findWebProjectRoot(projectPath: string): string {
  const candidates: Array<{ directory: string; depth: number }> = [];
  const queue: Array<{ directory: string; depth: number }> = [{ directory: projectPath, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (webProjectScore(current.directory) > 0) candidates.push(current);
    if (current.depth >= 3) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || ['node_modules', '.git', '.gradle', 'build', 'dist', 'workspace'].includes(entry.name) || entry.name === '.workspace') continue;
      queue.push({ directory: path.join(current.directory, entry.name), depth: current.depth + 1 });
    }
  }

  candidates.sort((left, right) => webProjectScore(right.directory) - webProjectScore(left.directory) || left.depth - right.depth);
  return candidates[0]?.directory || projectPath;
}

function getInstallArgs(manager: PackageManager, projectPath: string): string[] {
  switch (manager) {
    case 'pnpm':
      return ['install', '--ignore-workspace', '--dangerously-allow-all-builds'];
    case 'npm':
      return fs.existsSync(path.join(projectPath, 'package-lock.json')) ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund'];
    case 'yarn':
      return ['install', '--frozen-lockfile'];
    case 'bun':
      return ['install'];
  }
}

/** Returns true when the generated project declares or configures vite-plugin-pwa. */
export function detectVitePluginPwaUsage(projectPath: string, packageJson: PackageJson): boolean {
  const dependencyGroups = [packageJson.dependencies, packageJson.devDependencies, packageJson.optionalDependencies, packageJson.peerDependencies];
  if (dependencyGroups.some((group) => Boolean(group?.[VITE_PWA_PACKAGE]))) return true;

  const configNames = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs', 'vite.config.cts', 'vite.config.cjs'];
  return configNames.some((name) => {
    const configPath = path.join(projectPath, name);
    if (!fs.existsSync(configPath)) return false;
    try {
      return fs.readFileSync(configPath, 'utf8').includes(VITE_PWA_PACKAGE);
    } catch {
      return false;
    }
  });
}

/** Checks the generated project's local dependency tree without importing it. */
export function hasInstalledPackage(projectPath: string, packageName: string): boolean {
  return fs.existsSync(path.join(projectPath, 'node_modules', ...packageName.split('/')));
}

export function getPwaWorkboxInstallArgs(): string[] {
  return ['add', PWA_WORKBOX_PACKAGE, '--ignore-workspace', '--dangerously-allow-all-builds'];
}

/** Returns the narrowly-scoped pnpm arguments used to stabilize a generated PWA workspace. */
export function getPwaLockfileStabilizeArgs(): string[] {
  return ['install', '--lockfile-only', '--ignore-workspace', '--dangerously-allow-all-builds', '--config.minimum-release-age=0'];
}

/**
 * Returns a valid pnpm CLI invocation with the age override BEFORE the command.
 * Placing the config option before `run` ensures pnpm consumes it as pnpm config
 * rather than forwarding it to the package's build script.
 */
export function getPwaMinimumReleaseAgeRetryArgs(args: string[]): string[] {
  return ['--config.minimum-release-age=0', ...args];
}

/** Explicit environment override for generated PWA build retries. */
export function getPwaMinimumReleaseAgeRetryEnv(): NodeJS.ProcessEnv {
  return { PNPM_CONFIG_MINIMUM_RELEASE_AGE: '0' };
}

/** Returns true only for the pnpm minimum-release-age policy error. */
export function isMinimumReleaseAgeViolation(output: string): boolean {
  return output.includes(MINIMUM_RELEASE_AGE_ERROR);
}

async function runCommand(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, {
    cwd,
    timeout: 10 * 60 * 1000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  return { stdout: String(result.stdout ?? ''), stderr: String(result.stderr ?? '') };
}

export async function buildWebProject(projectPath: string): Promise<WebBuildResult> {
  const logs: string[] = [];

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      if (!fs.existsSync(path.join(projectPath, 'index.html'))) return { success: false, logs, error: 'No package.json or index.html found' };
      logs.push('No package.json found; treating project as static HTML/JS.');
      return { success: true, outputDir: projectPath, logs };
    }

    let packageJson: PackageJson;
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
    } catch (error: any) {
      return { success: false, logs, error: `Invalid package.json: ${error.message}` };
    }

    if (!packageJson.scripts || typeof packageJson.scripts.build !== 'string') return { success: false, logs, error: 'package.json does not define scripts.build' };

    const manager = detectPackageManager(projectPath);
    const installArgs = getInstallArgs(manager, projectPath);
    const usesVitePwa = detectVitePluginPwaUsage(projectPath, packageJson);

    if (manager === 'npm') {
      const sanitized = sanitizeNpmLockfile(projectPath);
      if (sanitized > 0) logs.push(`Removed ${sanitized} non-portable Replit npm lockfile URL(s).`);
    }

    logs.push(`Detected package manager: ${manager}`);
    logs.push(`Running: ${manager} ${installArgs.join(' ')}`);

    const installEnv = manager === 'npm' ? { NPM_CONFIG_REGISTRY: PUBLIC_NPM_REGISTRY } : undefined;
    let installResult: { stdout: string; stderr: string };
    try {
      installResult = await runCommand(manager, installArgs, projectPath, installEnv);
    } catch (error: any) {
      const combined = `${String(error.stdout ?? '')}\n${String(error.stderr ?? '')}\n${String(error.message ?? '')}`;
      if (!usesVitePwa || manager !== 'pnpm' || !isMinimumReleaseAgeViolation(combined)) throw error;

      logs.push('Generated PWA dependency install hit pnpm minimum-release-age policy. Retrying only this generated workspace with a local policy override.');
      const retryArgs = getPwaMinimumReleaseAgeRetryArgs(installArgs);
      logs.push(`Running: pnpm ${retryArgs.join(' ')}`);
      installResult = await runCommand('pnpm', retryArgs, projectPath);
      if (installResult.stdout) logs.push(`[PWA install retry stdout]: ${installResult.stdout}`);
      if (installResult.stderr) logs.push(`[PWA install retry stderr]: ${installResult.stderr}`);
      logs.push('Generated PWA dependency installation retry completed successfully.');
    }

    if (installResult.stdout) logs.push(`[Install stdout]: ${installResult.stdout}`);
    if (installResult.stderr) logs.push(`[Install stderr]: ${installResult.stderr}`);
    logs.push('Dependency installation completed successfully.');

    if (usesVitePwa && !hasInstalledPackage(projectPath, PWA_WORKBOX_PACKAGE)) {
      const pwaInstallArgs = getPwaWorkboxInstallArgs();
      logs.push('Detected vite-plugin-pwa without workbox-window. Installing compatibility dependency.');
      logs.push(`Running: pnpm ${pwaInstallArgs.join(' ')}`);
      let pwaInstallResult: { stdout: string; stderr: string };
      try {
        pwaInstallResult = await runCommand('pnpm', pwaInstallArgs, projectPath);
      } catch (error: any) {
        const combined = `${String(error.stdout ?? '')}\n${String(error.stderr ?? '')}\n${String(error.message ?? '')}`;
        if (!isMinimumReleaseAgeViolation(combined)) throw error;
        const retryArgs = getPwaMinimumReleaseAgeRetryArgs(pwaInstallArgs);
        logs.push('PWA compatibility dependency install hit minimum-release-age policy. Retrying only the generated workspace command with a local policy override.');
        logs.push(`Running: pnpm ${retryArgs.join(' ')}`);
        pwaInstallResult = await runCommand('pnpm', retryArgs, projectPath);
      }
      if (pwaInstallResult.stdout) logs.push(`[PWA dependency stdout]: ${pwaInstallResult.stdout}`);
      if (pwaInstallResult.stderr) logs.push(`[PWA dependency stderr]: ${pwaInstallResult.stderr}`);
      logs.push('workbox-window compatibility dependency installed successfully.');

      const stabilizeArgs = getPwaLockfileStabilizeArgs();
      logs.push('Stabilizing generated PWA workspace lockfile for dependency-age policy.');
      logs.push(`Running: pnpm ${stabilizeArgs.join(' ')}`);
      const stabilizeResult = await runCommand('pnpm', stabilizeArgs, projectPath);
      if (stabilizeResult.stdout) logs.push(`[PWA lockfile stdout]: ${stabilizeResult.stdout}`);
      if (stabilizeResult.stderr) logs.push(`[PWA lockfile stderr]: ${stabilizeResult.stderr}`);
      logs.push('Generated PWA workspace lockfile stabilized successfully.');
    }

    logs.push(`Running: ${manager} run build`);
    try {
      const buildResult = await runCommand(manager, ['run', 'build'], projectPath, installEnv);
      if (buildResult.stdout) logs.push(`[Build stdout]: ${buildResult.stdout}`);
      if (buildResult.stderr) logs.push(`[Build stderr]: ${buildResult.stderr}`);
    } catch (error: any) {
      const stdout = String(error.stdout ?? '');
      const stderr = String(error.stderr ?? '');
      const combined = `${stdout}\n${stderr}\n${String(error.message ?? '')}`;
      if (!usesVitePwa || manager !== 'pnpm' || !isMinimumReleaseAgeViolation(combined)) throw error;

      logs.push('PWA build hit pnpm minimum-release-age policy after compatibility install. Retrying generated workspace build with a local policy override.');
      const retryArgs = getPwaMinimumReleaseAgeRetryArgs(['run', 'build']);
      const retryEnv = getPwaMinimumReleaseAgeRetryEnv();
      logs.push(`Running: PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm ${retryArgs.join(' ')} (generated workspace policy retry)`);
      const retryResult = await runCommand('pnpm', retryArgs, projectPath, retryEnv);
      if (retryResult.stdout) logs.push(`[Build retry stdout]: ${retryResult.stdout}`);
      if (retryResult.stderr) logs.push(`[Build retry stderr]: ${retryResult.stderr}`);
      logs.push('PWA build policy retry completed successfully.');
    }

    for (const directory of ['dist', 'build', 'out', 'www']) {
      const fullPath = path.join(projectPath, directory);
      if (fs.existsSync(fullPath)) {
        logs.push(`Build output found: ${fullPath}`);
        return { success: true, outputDir: fullPath, logs };
      }
    }

    return { success: false, logs, error: 'Web build completed but no dist, build, out, or www directory was found' };
  } catch (error: any) {
    logs.push(`Web build failed: ${error.message}`);
    if (error.stdout) logs.push(`[Command stdout]: ${String(error.stdout)}`);
    if (error.stderr) logs.push(`[Command stderr]: ${String(error.stderr)}`);
    return { success: false, logs, error: error.message };
  }
}
