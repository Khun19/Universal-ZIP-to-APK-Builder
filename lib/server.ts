import { analyzeProjectFiles, validateZipEntry } from './analyzer.ts';
import { resolveProjectLayout } from './project-layout.ts';
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

  // 2. Resolve the actual app root without assuming the archive root is the app.
  const layout = resolveProjectLayout(projectPath);
  const layoutLogs = layout.logs;
  if (layout.status !== 'selected' || !layout.appRoot || !layout.relativeAppRoot) {
    return {
      success: false,
      logs: [...layoutLogs, ...(layout.candidates.length ? layout.candidates.map((candidate) =>
        `[Layout candidate] ${candidate.relativeAppRoot} — ${candidate.framework} (score ${candidate.score})`,
      ) : [])],
      error: layout.error || 'Unable to resolve a unique buildable app root',
    };
  }

  const appRoot = layout.appRoot;
  const appRelativeRoot = layout.relativeAppRoot;
  const packageJsonPath = path.join(appRoot, 'package.json');
  let packageJson: Record<string, unknown> = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        logs: [...layoutLogs, 'Unable to parse package.json for the selected app root'],
        error: 'Invalid package.json',
      };
    }
  }

  const appFilePaths = appRelativeRoot === '.'
    ? filePaths
    : filePaths.map((filePath) => {
        const normalized = filePath.replace(/\\\\/g, '/');
        const relative = path.isAbsolute(filePath)
          ? path.relative(projectPath, filePath).split(path.sep).join('/')
          : normalized.replace(/^\\.\\//, '');
        return relative.startsWith(appRelativeRoot + '/')
          ? relative.slice(appRelativeRoot.length + 1)
          : '';
      }).filter(Boolean);

  const analysis = analyzeProjectFiles(appFilePaths, packageJson);
  const detectionLogs = [
    ...layoutLogs,
    `[Layout] app root selected: ${appRelativeRoot}`,
    `[Layout] workspace root: ${layout.relativeWorkspaceRoot ?? 'none'}`,
    ...analysis.checks.map((check) =>
      '[Detection ' + check.stage + '] ' + (check.passed ? 'PASS' : 'FAIL') + ' — ' + check.detail,
    ),
  ];
  detectionLogs.push('[Detection result] ' + analysis.projectType + ' (' + analysis.confidence + '% confidence)');
  detectionLogs.push(...analysis.evidence.map((item) => '[Detection evidence] ' + item));
  detectionLogs.push(...analysis.warnings.map((item) => '[Detection warning] ' + item));
  if (analysis.projectType === 'Unknown') {
    return {
      success: false,
      logs: detectionLogs,
      error: 'Unable to determine project type from the selected app root',
    };
  }

  // 3. Strategy Determination
  const strategy = determineBuildStrategy(analysis);

  // 4. Build Worker Execution
  const jobResult = await executeBuildJob(
    appRoot,
    strategy,
    payload.appName,
  );

  return {
    success: jobResult.success,
    projectType: analysis.projectType,
    strategyName: strategy.strategyName,
    logs: [...detectionLogs, ...jobResult.logs],
    outputPath: jobResult.outputPath,
    error: jobResult.error
  };
}

export { handleBuildRequest };
