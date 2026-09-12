import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

export interface FlutterBuildResult {
  success: boolean;
  apkPath?: string;
  logs: string[];
  error?: string;
}

async function run(command: string, cwd: string, logs: string[]): Promise<void> {
  logs.push(`Executing: ${command}`);
  const { stdout, stderr } = await execAsync(command, { cwd, timeout: Number(process.env.BUILD_TIMEOUT_MS || 20 * 60 * 1000), maxBuffer: 1024 * 1024 });
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

function verifyApk(apkPath: string): { size: number; sha256: string } {
  const stat = fs.statSync(apkPath);
  if (!stat.isFile() || stat.size <= 0) throw new Error('Flutter APK is missing or empty.');
  const zip = new AdmZip(apkPath);
  if (!zip.getEntry('AndroidManifest.xml')) throw new Error('Flutter APK is not a valid Android APK: AndroidManifest.xml is missing.');
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex');
  return { size: stat.size, sha256 };
}

export async function buildFlutterProject(projectPath: string): Promise<FlutterBuildResult> {
  const logs: string[] = [];
  try {
    logs.push('Flutter project build started.');
    await run('flutter --version', projectPath, logs);
    await run('flutter pub get', projectPath, logs);
    await run('flutter build apk --debug', projectPath, logs);
    const apkPath = findApk(projectPath);
    if (!apkPath) return { success: false, logs, error: 'Flutter build completed without producing a debug APK.' };
    const verified = verifyApk(apkPath);
    logs.push(`Verified real Flutter APK: ${apkPath} (${verified.size} bytes, SHA-256 ${verified.sha256}).`);
    return { success: true, apkPath, logs };
  } catch (error: any) {
    logs.push(`Flutter build failure: ${error.message}`);
    return { success: false, logs, error: error.message };
  }
}
