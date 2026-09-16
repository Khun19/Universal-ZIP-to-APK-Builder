import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import AdmZip from 'adm-zip';

const execFileAsync = promisify(execFile);

export interface FlutterBuildResult {
  success: boolean;
  apkPath?: string;
  logs: string[];
  error?: string;
  sha256?: string;
}

async function run(command: string, args: string[], cwd: string, logs: string[]): Promise<void> {
  logs.push(`Executing: ${command} ${args.join(' ')}`);
  const { stdout, stderr } = await execFileAsync(command, args, {
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

function verifyApk(apkPath: string): string {
  const stat = fs.statSync(apkPath);
  if (!stat.isFile() || stat.size <= 0) throw new Error('Flutter APK is missing or empty.');
  const zip = new AdmZip(apkPath);
  if (!zip.getEntry('AndroidManifest.xml')) throw new Error('Flutter APK is not a valid Android APK: AndroidManifest.xml is missing.');
  return crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex');
}

export async function buildFlutterProject(projectPath: string): Promise<FlutterBuildResult> {
  const logs: string[] = [];
  try {
    if (!fs.existsSync(path.join(projectPath, 'pubspec.yaml'))) {
      throw new Error('Flutter project is missing pubspec.yaml.');
    }
    logs.push('Flutter project build started.');
    await run('flutter', ['--version'], projectPath, logs);
    await run('flutter', ['pub', 'get'], projectPath, logs);
    await run('flutter', ['build', 'apk', '--debug'], projectPath, logs);
    const apkPath = findApk(projectPath);
    if (!apkPath) return { success: false, logs, error: 'Flutter build completed without producing a debug APK.' };
    const sha256 = verifyApk(apkPath);
    logs.push(`Verified real Flutter APK: ${apkPath} (SHA-256 ${sha256}).`);
    return { success: true, apkPath, logs, sha256 };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    logs.push(`Flutter build failure: ${message}`);
    return { success: false, logs, error: message };
  }
}
