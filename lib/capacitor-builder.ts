import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

function detectPackageManager(projectPath: string): PackageManager {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (
    fs.existsSync(path.join(projectPath, 'bun.lock')) ||
    fs.existsSync(path.join(projectPath, 'bun.lockb'))
  ) {
    return 'bun';
  }

  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn';
  }

  return 'npm';
}

function capacitorCommand(
  manager: PackageManager,
  operation: 'add' | 'sync',
): { command: string; args: string[] } {
  switch (manager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['exec', 'cap', operation, 'android'],
      };
    case 'npm':
      return {
        command: 'npx',
        args: ['--no-install', 'cap', operation, 'android'],
      };
    case 'yarn':
      return {
        command: 'yarn',
        args: ['cap', operation, 'android'],
      };
    case 'bun':
      return {
        command: 'bunx',
        args: ['--no-install', 'cap', operation, 'android'],
      };
  }
}


function isCompleteAndroidProject(androidProjectPath: string): boolean {
  return (
    fs.existsSync(path.join(androidProjectPath, 'app')) &&
    (
      fs.existsSync(path.join(androidProjectPath, 'settings.gradle')) ||
      fs.existsSync(path.join(androidProjectPath, 'settings.gradle.kts'))
    )
  );
}
export interface CapacitorSyncResult {
  androidProjectPath: string;
  logs: string[];
}

export async function syncCapacitorAndroid(
  projectPath: string,
): Promise<CapacitorSyncResult> {
  const logs: string[] = [];
  const androidProjectPath = path.join(projectPath, 'android');
  const manager = detectPackageManager(projectPath);

  if (!isCompleteAndroidProject(androidProjectPath)) {
    if (fs.existsSync(androidProjectPath)) {
      const quarantinePath = path.join(
        projectPath,
        `.android-incomplete-${Date.now()}`,
      );
      fs.renameSync(androidProjectPath, quarantinePath);
      logs.push(`Existing incomplete Android platform moved to ${quarantinePath}.`);
    }

    const add = capacitorCommand(manager, 'add');
    logs.push(`Android platform missing or incomplete; running: ${add.command} ${add.args.join(' ')}`);
    const addResult = await execFileAsync(add.command, add.args, {
      cwd: projectPath,
      timeout: 10 * 60 * 1000,
      maxBuffer: 4 * 1024 * 1024,
    });

    if (addResult.stdout) logs.push(`[Capacitor add]: ${String(addResult.stdout)}`);
    if (addResult.stderr) logs.push(`[Capacitor add stderr]: ${String(addResult.stderr)}`);
  }

  if (!isCompleteAndroidProject(androidProjectPath)) {
    throw new Error(
      'Capacitor CLI did not create a complete Android Gradle platform',
    );
  }

  const sync = capacitorCommand(manager, 'sync');
  logs.push(`Running: ${sync.command} ${sync.args.join(' ')}`);
  const syncResult = await execFileAsync(sync.command, sync.args, {
    cwd: projectPath,
    timeout: 10 * 60 * 1000,
    maxBuffer: 4 * 1024 * 1024,
  });

  if (syncResult.stdout) logs.push(`[Capacitor sync]: ${String(syncResult.stdout)}`);
  if (syncResult.stderr) logs.push(`[Capacitor sync stderr]: ${String(syncResult.stderr)}`);

  return {
    androidProjectPath,
    logs,
  };
}