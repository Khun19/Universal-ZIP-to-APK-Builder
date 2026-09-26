import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

export interface IsolatedWorkspace {
  buildId: string;
  root: string;
  source: string;
}

export function createIsolatedWorkspace(sourcePath: string, baseDir = path.join(os.homedir(), ".builder", "workspaces")): IsolatedWorkspace {
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    throw new Error(`Build source directory does not exist: ${sourcePath}`);
  }

  const buildId = `build-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const root = path.join(baseDir, buildId);
  const source = path.join(root, "source");

  fs.mkdirSync(source, { recursive: true });
  fs.cpSync(sourcePath, source, { recursive: true, force: false });

  return { buildId, root, source };
}

export function cleanupIsolatedWorkspace(workspace: IsolatedWorkspace): void {
  fs.rmSync(workspace.root, { recursive: true, force: true });
}
