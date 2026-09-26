import * as fs from 'fs';
import * as path from 'path';
import { validateZipEntry } from './analyzer.ts';
import { DEFAULT_ZIP_SECURITY_LIMITS, type ZipSecurityLimits, validateZipEntries } from './security.ts';

export interface ExtractionResult {
  success: boolean;
  extractedPath?: string;
  filePaths: string[];
  error?: string;
}

export async function processAndExtractFiles(
  inputFiles: { relativePath: string; content: string }[],
  destinationDir: string,
  limits: ZipSecurityLimits = DEFAULT_ZIP_SECURITY_LIMITS,
): Promise<ExtractionResult> {
  const filePaths: string[] = [];

  try {
    const security = validateZipEntries(
      inputFiles.map((file) => ({
        relativePath: file.relativePath,
        uncompressedSize: Buffer.byteLength(file.content, 'utf8'),
      })),
      limits,
    );
    if (!security.safe) {
      return { success: false, filePaths: [], error: `Security violation: ${security.error}` };
    }

    const resolvedDestination = path.resolve(destinationDir);
    if (!fs.existsSync(resolvedDestination)) fs.mkdirSync(resolvedDestination, { recursive: true });
    const canonicalDestination = fs.realpathSync(resolvedDestination);

    for (const file of inputFiles) {
      if (!validateZipEntry(file.relativePath)) {
        return { success: false, filePaths: [], error: `Security violation: Malicious path detected -> ${file.relativePath}` };
      }

      const targetPath = path.resolve(canonicalDestination, file.relativePath);
      if (!targetPath.startsWith(canonicalDestination + path.sep) && targetPath !== canonicalDestination) {
        return { success: false, filePaths: [], error: `Security violation: Malicious path breakout -> ${file.relativePath}` };
      }

      const dirName = path.dirname(targetPath);
      if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
      fs.writeFileSync(targetPath, file.content, 'utf8');
      filePaths.push(file.relativePath);
    }

    return { success: true, extractedPath: canonicalDestination, filePaths };
  } catch (err: any) {
    return { success: false, filePaths: [], error: err.message };
  }
}
