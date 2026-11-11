import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beginDirectoryReplacement, withProjectLock } from "../artifacts/api-server/src/utils/project-analysis-workspace.ts";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "project-analysis-workspace-"));
  const source = path.join(root, "source");
  const staging = path.join(root, "staging");
  await mkdir(source);
  await mkdir(staging);
  await writeFile(path.join(source, "value.txt"), "old");
  await writeFile(path.join(staging, "value.txt"), "new");
  return { root, source, staging };
}

test("directory replacement commits the new source and removes the backup", async () => {
  const f = await fixture();
  try {
    const replacement = await beginDirectoryReplacement(f.staging, f.source);
    assert.equal(await readFile(path.join(f.source, "value.txt"), "utf8"), "new");
    await replacement.commit();
    assert.deepEqual(await readdir(f.root), ["source"]);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("directory replacement rollback restores the previous source", async () => {
  const f = await fixture();
  try {
    const replacement = await beginDirectoryReplacement(f.staging, f.source);
    await replacement.rollback();
    assert.equal(await readFile(path.join(f.source, "value.txt"), "utf8"), "old");
    assert.deepEqual(await readdir(f.root), ["source"]);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("failed staging rename restores the previous source", async () => {
  const f = await fixture();
  try {
    await rm(f.staging, { recursive: true, force: true });
    await assert.rejects(beginDirectoryReplacement(f.staging, f.source));
    assert.equal(await readFile(path.join(f.source, "value.txt"), "utf8"), "old");
    assert.deepEqual(await readdir(f.root), ["source"]);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("analysis operations for one project are serialized", async () => {
  const events: string[] = [];
  let releaseFirst!: () => void;
  let markStarted!: () => void;
  const holdFirst = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const firstStarted = new Promise<void>((resolve) => { markStarted = resolve; });
  const first = withProjectLock("same-project", async () => {
    events.push("first:start");
    markStarted();
    await holdFirst;
    events.push("first:end");
  });
  await firstStarted;
  const second = withProjectLock("same-project", async () => {
    events.push("second:start");
  });
  await Promise.resolve();
  assert.deepEqual(events, ["first:start"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["first:start", "first:end", "second:start"]);
});
