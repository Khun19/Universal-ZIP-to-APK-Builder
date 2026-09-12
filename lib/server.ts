import { analyzeProjectFiles, validateZipEntry } from './analyzer.ts';
import { analyzeFlutterCapabilities } from './analyzer/flutter.ts';
import { determineBuildStrategy } from './strategy.ts';
import { executeBuildJob } from './worker.ts';
import { buildFlutterProject } from './builders/flutter-builder.ts';

export interface BuildRequestPayload { projectPath: string; filePaths: string[]; appName?: string; }
export interface BuildResponse { success: boolean; projectType?: string; strategyName?: string; logs: string[]; outputPath?: string; error?: string; }

async function handleBuildRequest(payload: BuildRequestPayload): Promise<BuildResponse> {
  const { projectPath, filePaths } = payload;
  for (const filePath of filePaths) {
    if (!validateZipEntry(filePath)) return { success: false, logs: [`Security violation detected for path: ${filePath}`], error: 'Path traversal or invalid file path detected' };
  }

  const analysis = analyzeProjectFiles(filePaths);
  if (analysis.projectType === 'Unknown') return { success: false, logs: analysis.warnings, error: 'Unable to determine project type' };
  const strategy = determineBuildStrategy(analysis);

  if (strategy.strategyName === 'flutter') {
    const capabilities = analyzeFlutterCapabilities(projectPath);
    const flutterResult = await buildFlutterProject(projectPath);
    const logs = [...analysis.evidence, ...capabilities.evidence, ...capabilities.warnings, ...flutterResult.logs];
    return { success: flutterResult.success, projectType: analysis.projectType, strategyName: strategy.strategyName, logs, outputPath: flutterResult.apkPath, error: flutterResult.error };
  }

  const jobResult = await executeBuildJob(projectPath, strategy, payload.appName);
  return { success: jobResult.success, projectType: analysis.projectType, strategyName: strategy.strategyName, logs: jobResult.logs, outputPath: jobResult.outputPath, error: jobResult.error };
}

export { handleBuildRequest };
