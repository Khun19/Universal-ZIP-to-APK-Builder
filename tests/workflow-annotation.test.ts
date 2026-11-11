import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const reporter = path.resolve(".github/actions/workflow-annotation/report.sh");

async function runReporter(status: string) {
  const directory = await mkdtemp(path.join(tmpdir(), "workflow-annotation-"));
  const summary = path.join(directory, "summary.md");
  await writeFile(summary, "");
  try {
    const result = spawnSync("bash", [reporter], {
      encoding: "utf8",
      env: {
        ...process.env,
        JOB_STATUS: status,
        GITHUB_STEP_SUMMARY: summary,
        WORKFLOW_NAME: "Test Workflow",
        EVIDENCE_SCOPE: "unit test",
        RUN_ID: "12345",
        RUN_ATTEMPT: "2",
        COMMIT_SHA: "a".repeat(40),
        EVENT_NAME: "pull_request",
        SERVER_URL: "https://github.com",
        REPOSITORY: "owner/repo"
      }
    });
    return { result, summary: await readFile(summary, "utf8") };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("workflow annotation reports success as notice/PASS", async () => {
  const { result, summary } = await runReporter("success");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::notice title=Workflow job passed::/);
  assert.match(summary, /Result: \*\*PASS\*\*/);
});

test("workflow annotation reports failure as error/FAIL without masking the failed job", async () => {
  const { result, summary } = await runReporter("failure");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::error title=Workflow job failed::/);
  assert.match(summary, /Result: \*\*FAIL\*\*/);
});

test("workflow annotation reports cancellation as warning/CANCELLED", async () => {
  const { result, summary } = await runReporter("cancelled");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::warning title=Workflow job cancelled::/);
  assert.match(summary, /Result: \*\*CANCELLED\*\*/);
});

test("unknown workflow status remains warning/NOT_VERIFIED", async () => {
  const { result, summary } = await runReporter("skipped");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::warning title=Workflow job incomplete::/);
  assert.match(summary, /Result: \*\*NOT_VERIFIED\*\*/);
});

test("annotation command data escapes percent signs and newlines", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "workflow-annotation-"));
  const summary = path.join(directory, "summary.md");
  await writeFile(summary, "");
  try {
    const result = spawnSync("bash", [reporter], {
      encoding: "utf8",
      env: {
        ...process.env,
        JOB_STATUS: "success",
        GITHUB_STEP_SUMMARY: summary,
        WORKFLOW_NAME: "Workflow%\n::error::",
        EVIDENCE_SCOPE: "scope",
        RUN_ID: "12345",
        RUN_ATTEMPT: "1",
        COMMIT_SHA: "b".repeat(40),
        EVENT_NAME: "workflow_dispatch",
        SERVER_URL: "https://github.com",
        REPOSITORY: "owner/repo"
      }
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Workflow%25%0A::error::/);
    assert.equal(result.stdout.split(/\r?\n/).filter((line) => line.startsWith("::error")).length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
