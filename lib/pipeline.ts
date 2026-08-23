import * as path from 'path';
import * as fs from 'fs';
import { processAndExtractFiles } from './extractor.ts';
import { handleBuildRequest, BuildResponse } from './server.ts';

export interface PipelineInput {
  buildId: string;
  files: { relativePath: string; content: string }[];
}

export async function runBuildPipeline(input: PipelineInput): Promise<BuildResponse> {
  const workspaceDir = path.resolve(`./.workspace/${input.buildId}`);

  try {
    // 1. Extract uploaded project files securely into workspace
    const extractResult = await processAndExtractFiles(input.files, workspaceDir);
    if (!extractResult.success) {
      return {
        success: false,
        logs: [`Extraction failed: ${extractResult.error}`],
        error: extractResult.error
      };
    }

    // 2. Process analysis, strategy selection, and worker build
    const response = await handleBuildRequest({
      projectPath: workspaceDir,
      filePaths: extractResult.filePaths
    });

    return response;
  } catch (err: any) {
    return {
      success: false,
      logs: [`Pipeline fatal error: ${err.message}`],
      error: err.message
    };
  }
}
