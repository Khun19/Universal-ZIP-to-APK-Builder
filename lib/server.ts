import { analyzeProjectFiles, validateZipEntry } from './analyzer.ts';
import { determineBuildStrategy } from './strategy.ts';
import { executeBuildJob } from './worker.ts';
import * as fs from 'fs';
import * as path from 'path';

export interface BuildRequestPayload {
  projectPath: string;
  filePaths: string[];
  appName?: string;
}

export interface BuildResponse {
  success: boolean;
  projectType?: string;
  strategyName?: string;
  logs: string[];
  outputPath?: string;
  error?: string;
}

/**
 * Core API Controller to handle incoming build requests from ZIP uploads
 */
async function handleBuildRequest(payload: BuildRequestPayload): Promise<BuildResponse> {
  const { projectPath, filePaths } = payload;

  // 1. Security Check on all file paths
  for (const filePath of filePaths) {
    if (!validateZipEntry(filePath)) {
      return {
        success: false,
        logs: [`Security violation detected for path: ${filePath}`],
        error: 'Path traversal or invalid file path detected'
      };
    }
  }

  // 2. Project Analysis & Framework Detection
  let packageJson: Record<string, unknown> = {};
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        logs: ['Unable to parse package.json for project analysis'],
        error: 'Invalid package.json',
      };
    }
  }
  const analysis = analyzeProjectFiles(filePaths, packageJson);
  if (analysis.projectType === 'Unknown') {
    return {
      success: false,
      logs: analysis.warnings,
      error: 'Unable to determine project type'
    };
  }

  // 3. Strategy Determination
  const strategy = determineBuildStrategy(analysis);

  // 4. Build Worker Execution
  const jobResult = await executeBuildJob(
    projectPath,
    strategy,
    payload.appName,
  );

  return {
    success: jobResult.success,
    projectType: analysis.projectType,
    strategyName: strategy.strategyName,
    logs: jobResult.logs,
    outputPath: jobResult.outputPath,
    error: jobResult.error
  };
}

export { handleBuildRequest };
