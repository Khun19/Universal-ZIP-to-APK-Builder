import * as fs from 'fs';
import * as path from 'path';
import { validateZipEntry } from './analyzer.ts';

export interface ExtractionResult {
  success: boolean;
  extractedPath?: string;
  filePaths: string[];
  error?: string;
}

/**
 * Safely extracts files with strict path traversal and symlink-aware security checks.
 */
export async function processAndExtractFiles(
  inputFiles: { relativePath: string; content: string }[],
  destinationDir: string
): Promise<ExtractionResult> {
  const filePaths: string[] = [];

  try {
    const resolvedDestination = path.resolve(destinationDir);
    if (!fs.existsSync(resolvedDestination)) {
      fs.mkdirSync(resolvedDestination, { recursive: true });
    }

    // Resolve real path to handle system symlinks (such as Termux /tmp)
    const canonicalDestination = fs.realpathSync(resolvedDestination);

    for (const file of inputFiles) {
      // 1. Basic security validation
      if (!validateZipEntry(file.relativePath)) {
        return {
          success: false,
          filePaths: [],
          error: `Security violation: Malicious path detected -> ${file.relativePath}`
        };
      }

      // 2. Strict resolved path breakout check
      const targetPath = path.resolve(canonicalDestination, file.relativePath);
      if (!targetPath.startsWith(canonicalDestination + path.sep) && targetPath !== canonicalDestination) {
        return {
          success: false,
          filePaths: [],
          error: `Security violation: Malicious path breakout -> ${file.relativePath}`
        };
      }

      const dirName = path.dirname(targetPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      fs.writeFileSync(targetPath, file.content, 'utf8');
      filePaths.push(file.relativePath);
    }

    return {
      success: true,
      extractedPath: canonicalDestination,
      filePaths
    };
  } catch (err: any) {
    return {
      success: false,
      filePaths: [],
      error: err.message
    };
  }
}
