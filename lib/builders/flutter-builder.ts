import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface FlutterBuildResult {
  success: boolean;
  apkPath?: string;
  logs: string[];
  error?: string;
}

async function run(command: string, cwd: string, logs: string[]): Promise<void> {
  logs.push(`Executing: ${command}`);
  const { stdout, stderr } = await execAsync(command, {
    cwd,
    timeout: Number(process.env.BUILD_TIMEOUT_MS || 20 * 60 * 1000),
    maxBuffer: 1024 * 1024,
  });
  if (stdout) logs.push(`[Flutter Output]: ${stdout.slice(-4000)}`);
  if (stderr) logs.push(`[Flutter Stderr]: ${stderr.slice(-2000)}`);
}

function findApk(projectPath: string): string | undefined {
  const candidates = [
    path.join(projectPath, 'build', 'app', 'outputs', 'flutter-apk', 'app-debug.apk'),
    path.join(projectPath, 'build', 'app', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export async function buildFlutterProject(projectPath: string): Promise<FlutterBuildResult> {
  const logs: string[] = [];
  try {
    logs.push('Flutter project build started.');
    await run('flutter --version', projectPath, logs);
    await run('flutter pub get', projectPath, logs);
    await run('flutter build apk --debug', projectPath, logs);

    const apkPath = findApk(projectPath);
    if (!apkPath) {
      return { success: false, logs, error: 'Flutter build completed without producing a debug APK.' };
    }
    logs.push(`Flutter produced APK: ${apkPath}`);
    return { success: true, apkPath, logs };
  } catch (error: any) {
    logs.push(`Flutter build failure: ${error.message}`);
    return { success: false, logs, error: error.message };
  }
}
