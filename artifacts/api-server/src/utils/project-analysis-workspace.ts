import { randomUUID } from "node:crypto";
import { rename, rm } from "node:fs/promises";

const projectLocks = new Map<string, Promise<void>>();

export async function withProjectLock<T>(projectId: string, operation: () => Promise<T>): Promise<T> {
  const previous = projectLocks.get(projectId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  projectLocks.set(projectId, queued);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (projectLocks.get(projectId) === queued) projectLocks.delete(projectId);
  }
}

interface DirectoryReplacement {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export async function beginDirectoryReplacement(
  staging: string,
  destination: string,
): Promise<DirectoryReplacement> {
  const backup = `${destination}.backup-${randomUUID()}`;
  let hadPrevious = false;
  try {
    await rename(destination, backup);
    hadPrevious = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    await rename(staging, destination);
  } catch (error) {
    if (hadPrevious) await rename(backup, destination);
    throw error;
  }

  let settled = false;
  return {
    async commit() {
      if (settled) return;
      if (hadPrevious) await rm(backup, { recursive: true, force: true }).catch(() => undefined);
      settled = true;
    },
    async rollback() {
      if (settled) return;
      await rm(destination, { recursive: true, force: true });
      if (hadPrevious) await rename(backup, destination);
      settled = true;
    },
  };
}
