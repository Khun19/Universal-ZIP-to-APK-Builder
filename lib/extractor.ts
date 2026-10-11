import * as fs from 'fs';
import * as path from 'path';
import { validateZipEntry } from './analyzer.ts';

export interface ExtractionResult {
  success: boolean;
  extractedPath?: string;
  filePaths: string[];
  error?: string;
}

function isWithinDirectory(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative));
}

/**
 * Creates parent directories one component at a time. Symlinks are rejected
 * rather than followed, even when they currently resolve back inside the root.
 */
function ensureSafeDirectory(root: string, relativeDirectory: string): string {
  let current = root;
  const segments = relativeDirectory.split(path.sep).filter(Boolean);

  for (const segment of segments) {
    const next = path.join(current, segment);
    try {
      const stat = fs.lstatSync(next);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(`Security violation: unsafe directory component -> ${next}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      fs.mkdirSync(next, { mode: 0o700 });
    }

    const canonical = fs.realpathSync(next);
    if (!isWithinDirectory(root, canonical)) {
      throw new Error(`Security violation: directory escaped extraction root -> ${next}`);
    }
    current = canonical;
  }

  return current;
}

/**
 * Safely writes extracted entries inside a canonical workspace. Archive entry
 * names are validated cross-platform and existing symlink components are never
 * followed, preventing a pre-existing symlink from redirecting writes outside
 * the destination.
 */
export async function processAndExtractFiles(
  inputFiles: { relativePath: string; content: string }[],
  destinationDir: string
): Promise<ExtractionResult> {
  const filePaths: string[] = [];

  try {
    const resolvedDestination = path.resolve(destinationDir);
    if (!fs.existsSync(resolvedDestination)) {
      fs.mkdirSync(resolvedDestination, { recursive: true, mode: 0o700 });
    }

    const canonicalDestination = fs.realpathSync(resolvedDestination);

    for (const file of inputFiles) {
      if (!validateZipEntry(file.relativePath)) {
        return {
          success: false,
          filePaths: [],
          error: `Security violation: malicious path detected -> ${String(file.relativePath)}`,
        };
      }

      const normalizedPath = file.relativePath.replace(/\\/g, '/');
      const targetPath = path.resolve(canonicalDestination, ...normalizedPath.split('/'));
      if (
        targetPath === canonicalDestination ||
        !isWithinDirectory(canonicalDestination, targetPath)
      ) {
        return {
          success: false,
          filePaths: [],
          error: `Security violation: path escaped extraction root -> ${file.relativePath}`,
        };
      }

      const relativeTarget = path.relative(canonicalDestination, targetPath);
      const parentRelative = path.dirname(relativeTarget);
      const safeParent = ensureSafeDirectory(
        canonicalDestination,
        parentRelative === '.' ? '' : parentRelative,
      );
      const safeTarget = path.join(safeParent, path.basename(targetPath));

      try {
        const existing = fs.lstatSync(safeTarget);
        if (existing.isSymbolicLink() || !existing.isFile()) {
          return {
            success: false,
            filePaths: [],
            error: `Security violation: target is not a regular file -> ${file.relativePath}`,
          };
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      const flags =
        fs.constants.O_WRONLY |
        fs.constants.O_CREAT |
        fs.constants.O_TRUNC |
        (fs.constants.O_NOFOLLOW ?? 0);
      const descriptor = fs.openSync(safeTarget, flags, 0o600);
      try {
        fs.writeFileSync(descriptor, file.content, { encoding: 'utf8' });
      } finally {
        fs.closeSync(descriptor);
      }

      filePaths.push(normalizedPath);
    }

    return {
      success: true,
      extractedPath: canonicalDestination,
      filePaths,
    };
  } catch (error) {
    return {
      success: false,
      filePaths: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
