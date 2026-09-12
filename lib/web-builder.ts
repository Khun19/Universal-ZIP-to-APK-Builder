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

const PUBLIC_NPM_REGISTRY = 'https://registry.npmjs.org';
const ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION = '4.60.1';

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

async function runCommand(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, {
    cwd,
    timeout: 10 * 60 * 1000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  return { stdout: String(result.stdout ?? ''), stderr: String(result.stderr ?? '') };
}

function commandErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error ?? '');
  const record = error as Record<string, unknown>;
  return [record.message, record.stdout, record.stderr].filter(Boolean).map(String).join('\n');
}

function hasVitePwaDependency(packageJson: Record<string, unknown>): boolean {
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const dependencies = packageJson[field];
    if (dependencies && typeof dependencies === 'object' && ('@vite-pwa/plugin' in dependencies || 'vite-plugin-pwa' in dependencies)) return true;
  }
  return false;
}

/**
 * Workbox's service-worker bundle uses Rollup/Terser internally. On Android
 * ARM64, newer Rollup releases can hit the known "Unexpected early exit"
 * lifecycle failure in Terser's renderChunk hook. Keep the compatibility
 * change isolated to the extracted build workspace and only apply it after
 * that exact failure is observed. The source ZIP is never modified.
 *
 * pnpm 11 no longer reads packageJson.pnpm.overrides for this purpose. The
 * temporary workspace config must therefore remain active while both the
 * compatibility install AND the retry build execute. The caller deliberately
 * does not use --ignore-workspace during this retry.
 */
export function applyAndroidArm64PwaRollupCompatibility(projectPath: string): boolean {
  if (process.platform !== 'android' || !fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return false;

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
  if (!hasVitePwaDependency(packageJson)) return false;

  const workspaceConfigPath = path.join(projectPath, 'pnpm-workspace.yaml');
  if (fs.existsSync(workspaceConfigPath)) return false;

  fs.writeFileSync(workspaceConfigPath, `overrides:\n  rollup: ${ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION}\n`);
  return true;
}

export function isAndroidArm64PwaTerserFailure(error: unknown): boolean {
  if (process.platform !== 'android') return false;
  const text = commandErrorText(error);
  return /Unexpected early exit/i.test(text) && /\(terser\) renderChunk/i.test(text);
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

    let packageJson: { scripts?: Record<string, string> };
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error: any) {
      return { success: false, logs, error: `Invalid package.json: ${error.message}` };
    }

    if (!packageJson.scripts || typeof packageJson.scripts.build !== 'string') return { success: false, logs, error: 'package.json does not define scripts.build' };

    const manager = detectPackageManager(projectPath);
    const installArgs = getInstallArgs(manager, projectPath);

    if (manager === 'npm') {
      const sanitized = sanitizeNpmLockfile(projectPath);
      if (sanitized > 0) logs.push(`Removed ${sanitized} non-portable Replit npm lockfile URL(s).`);
    }

    logs.push(`Detected package manager: ${manager}`);
    logs.push(`Running: ${manager} ${installArgs.join(' ')}`);

    const commandEnv: NodeJS.ProcessEnv = manager === 'pnpm'
      ? { PNPM_CONFIG_IGNORE_WORKSPACE: 'true' }
      : manager === 'npm'
        ? { NPM_CONFIG_REGISTRY: PUBLIC_NPM_REGISTRY }
        : {};

    let installResult = await runCommand(manager, installArgs, projectPath, commandEnv);
    if (installResult.stdout) logs.push(`[Install stdout]: ${installResult.stdout}`);
    if (installResult.stderr) logs.push(`[Install stderr]: ${installResult.stderr}`);
    logs.push('Dependency installation completed successfully.');

    const runBuild = async (env = commandEnv, args = ['run', 'build']): Promise<void> => {
      logs.push(`Running: ${manager} ${args.join(' ')}`);
      const buildResult = await runCommand(manager, args, projectPath, env);
      if (buildResult.stdout) logs.push(`[Build stdout]: ${buildResult.stdout}`);
      if (buildResult.stderr) logs.push(`[Build stderr]: ${buildResult.stderr}`);
    };

    try {
      await runBuild();
    } catch (buildError: unknown) {
      if (!isAndroidArm64PwaTerserFailure(buildError)) throw buildError;
      if (!applyAndroidArm64PwaRollupCompatibility(projectPath)) throw buildError;

      const compatibilityConfigPath = path.join(projectPath, 'pnpm-workspace.yaml');
      const compatibilityInstallArgs = manager === 'pnpm'
        ? ['install', '--dangerously-allow-all-builds']
        : installArgs;
      const compatibilityEnv: NodeJS.ProcessEnv = manager === 'pnpm'
        ? { ...commandEnv, PNPM_CONFIG_IGNORE_WORKSPACE: undefined }
        : commandEnv;

      try {
        logs.push(`Detected Android ARM64 PWA/Terser lifecycle failure; applying temporary Rollup ${ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION} compatibility pin.`);
        logs.push(`Compatibility workspace: ${compatibilityConfigPath}`);
        logs.push(`Re-running: ${manager} ${compatibilityInstallArgs.join(' ')}`);
        installResult = await runCommand(manager, compatibilityInstallArgs, projectPath, compatibilityEnv);
        if (installResult.stdout) logs.push(`[Compatibility install stdout]: ${installResult.stdout}`);
        if (installResult.stderr) logs.push(`[Compatibility install stderr]: ${installResult.stderr}`);
        logs.push('Compatibility dependency installation completed successfully.');

        if (manager === 'pnpm') {
          const installedRollupPath = path.join(projectPath, 'node_modules', '.pnpm', `rollup@${ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION}`);
          logs.push(`Checking compatibility Rollup: ${installedRollupPath}`);
          if (!fs.existsSync(installedRollupPath)) {
            throw new Error(`Compatibility install did not install Rollup ${ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION}`);
          }
          logs.push(`Verified Rollup ${ANDROID_PWA_ROLLUP_COMPATIBILITY_VERSION} is installed.`);
        }

        await runBuild(compatibilityEnv);
      } finally {
        if (fs.existsSync(compatibilityConfigPath)) fs.unlinkSync(compatibilityConfigPath);
      }
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
