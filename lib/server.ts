import { validateZipEntry } from './analyzer.ts';
import { determineBuildStrategy } from './strategy.ts';
import { executeBuildJob } from './worker.ts';
import { runAutoRepair, type RepairEvidence, type RepairIssue } from './auto-repair.ts';
import { sha256 } from './security/src/index.ts';
import * as fs from 'fs';
import * as path from 'path';

export interface BuildRequestPayload {
  projectPath: string;
  filePaths: string[];
  appName?: string;
  inputZipPath?: string;
  dryRun?: boolean;
}

export interface BuildResponse {
  success: boolean;
  projectType?: string;
  strategyName?: string;
  logs: string[];
  outputPath?: string;
  error?: string;
  dryRun?: boolean;
  buildReady?: boolean;
  repairIssues?: RepairIssue[];
  repairEvidence?: RepairEvidence[];
  blocker?: RepairIssue;
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

  // 2. Analyze and repair only in a separate per-build workspace.
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
  let inputZipHash: string | null = null;
  if (payload.inputZipPath) {
    try { inputZipHash = await sha256(payload.inputZipPath); }
    catch (error) {
      return { success: false, logs: [`Unable to hash input ZIP: ${error instanceof Error ? error.message : String(error)}`], error: 'Unable to verify input ZIP' };
    }
  }
  let repair;
  try {
    repair = await runAutoRepair(projectPath, filePaths, { dryRun: payload.dryRun, inputZipHash });
  } catch (error) {
    return {
      success: false,
      logs: [`Auto-Repair rejected input: ${error instanceof Error ? error.message : String(error)}`],
      error: 'Unsafe or invalid repair input',
      buildReady: false,
    };
  }
  const analysis = repair.analysis;
  const repairLogs = repair.issues.map((item) => `${item.classification}: ${item.rule} (${item.file}) - ${item.reason}`);
  if (repair.blocker || !repair.buildReady) {
    return {
      success: false,
      logs: [...repairLogs, ...analysis.warnings],
      error: repair.blocker?.reason ?? 'Unable to determine project type after repair analysis',
      buildReady: false,
      dryRun: repair.dryRun,
      repairIssues: repair.issues,
      repairEvidence: repair.evidence,
      blocker: repair.blocker,
    };
  }

  if (payload.dryRun) {
    return {
      success: true,
      projectType: analysis.projectType,
      logs: [...repairLogs, ...analysis.warnings, ...repair.plan.map((item) => `PLAN: ${item.rule} ${item.file}`)],
      dryRun: true,
      buildReady: true,
      repairIssues: repair.issues,
      repairEvidence: [],
    };
  }

  // 3. Strategy Determination
  const strategy = determineBuildStrategy(analysis);

  // 4. Build Worker Execution
  const jobResult = await executeBuildJob(
    repair.projectPath,
    strategy,
    payload.appName,
  );

  return {
    success: jobResult.success,
    projectType: analysis.projectType,
    strategyName: strategy.strategyName,
    logs: [...repairLogs, ...jobResult.logs],
    outputPath: jobResult.outputPath,
    error: jobResult.error,
    buildReady: true,
    repairIssues: repair.issues,
    repairEvidence: repair.evidence,
  };
}

export { handleBuildRequest };
