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

function detectPackageManager(projectPath: string): PackageManager {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (
    fs.existsSync(path.join(projectPath, 'bun.lock')) ||
    fs.existsSync(path.join(projectPath, 'bun.lockb'))
  ) {
    try {
      execFileSync('bun', ['--version'], { stdio: 'ignore' });
      return 'bun';
    } catch {
      return 'pnpm';
    }
  }

  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn';
  }

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

/**
 * ZIP archives often contain a single top-level project directory. Discover
 * that directory before running package-manager commands so the extracted
 * project is not mistaken for an empty workspace.
 */
export function findWebProjectRoot(projectPath: string): string {
  const candidates: Array<{ directory: string; depth: number }> = [];
  const queue: Array<{ directory: string; depth: number }> = [
    { directory: projectPath, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (webProjectScore(current.directory) > 0) {
      candidates.push(current);
    }

    if (current.depth >= 3) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.gradle' ||
        entry.name === 'build' ||
        entry.name === 'dist' ||
        entry.name === '.workspace'
      ) {
        continue;
      }

      queue.push({
        directory: path.join(current.directory, entry.name),
        depth: current.depth + 1,
      });
    }
  }

  candidates.sort(
    (left, right) =>
      webProjectScore(right.directory) - webProjectScore(left.directory) ||
      left.depth - right.depth,
  );

  return candidates[0]?.directory || projectPath;
}

function getInstallArgs(
  manager: PackageManager,
  projectPath: string,
): string[] {
  switch (manager) {
    case 'pnpm':
      return [
        'install',
        '--ignore-workspace',
        '--dangerously-allow-all-builds',
      ];
    case 'npm':
      return fs.existsSync(path.join(projectPath, 'package-lock.json'))
        ? ['ci', '--no-audit', '--no-fund']
        : ['install', '--no-audit', '--no-fund'];
    case 'yarn':
      return ['install', '--frozen-lockfile'];
    case 'bun':
      return ['install'];
  }
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(command, args, {
    cwd,
    timeout: 10 * 60 * 1000,
    maxBuffer: 4 * 1024 * 1024,
  });

  return {
    stdout: String(result.stdout ?? ''),
    stderr: String(result.stderr ?? ''),
  };
}

export async function buildWebProject(
  projectPath: string,
): Promise<WebBuildResult> {
  const logs: string[] = [];

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');

    // A static HTML project does not need a package manager or node_modules.
    if (!fs.existsSync(packageJsonPath)) {
      if (!fs.existsSync(path.join(projectPath, 'index.html'))) {
        return {
          success: false,
          logs,
          error: 'No package.json or index.html found',
        };
      }

      logs.push(
        'No package.json found; treating project as static HTML/JS.',
      );

      return {
        success: true,
        outputDir: projectPath,
        logs,
      };
    }

    let packageJson: {
      scripts?: Record<string, string>;
    };

    try {
      packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf8'),
      );
    } catch (error: any) {
      return {
        success: false,
        logs,
        error: `Invalid package.json: ${error.message}`,
      };
    }

    if (
      !packageJson.scripts ||
      typeof packageJson.scripts.build !== 'string'
    ) {
      return {
        success: false,
        logs,
        error: 'package.json does not define scripts.build',
      };
    }

    const manager = detectPackageManager(projectPath);
    const installArgs = getInstallArgs(manager, projectPath);

    logs.push(`Detected package manager: ${manager}`);
    logs.push(`Running: ${manager} ${installArgs.join(' ')}`);

    const installResult = await runCommand(
      manager,
      installArgs,
      projectPath,
    );

    if (installResult.stdout) {
      logs.push(`[Install stdout]: ${installResult.stdout}`);
    }

    if (installResult.stderr) {
      logs.push(`[Install stderr]: ${installResult.stderr}`);
    }

    // A successful package-manager exit code is the source of truth.
    // Zero-dependency projects may legitimately have no node_modules folder.
    logs.push('Dependency installation completed successfully.');

    logs.push(`Running: ${manager} run build`);

    const buildResult = await runCommand(
      manager,
      ['run', 'build'],
      projectPath,
    );

    if (buildResult.stdout) {
      logs.push(`[Build stdout]: ${buildResult.stdout}`);
    }

    if (buildResult.stderr) {
      logs.push(`[Build stderr]: ${buildResult.stderr}`);
    }

    const candidates = ['dist', 'build', 'out', 'www'];

    for (const directory of candidates) {
      const fullPath = path.join(projectPath, directory);

      if (fs.existsSync(fullPath)) {
        logs.push(`Build output found: ${fullPath}`);

        return {
          success: true,
          outputDir: fullPath,
          logs,
        };
      }
    }

    return {
      success: false,
      logs,
      error:
        'Web build completed but no dist, build, out, or www directory was found',
    };
  } catch (error: any) {
    logs.push(`Web build failed: ${error.message}`);

    if (error.stdout) {
      logs.push(`[Command stdout]: ${String(error.stdout)}`);
    }

    if (error.stderr) {
      logs.push(`[Command stderr]: ${String(error.stderr)}`);
    }

    return {
      success: false,
      logs,
      error: error.message,
    };
  }
}
