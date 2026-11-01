import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCandidate } from "../scripts/apk-identity-gate.mjs";

const sha = "a".repeat(64);
const base = {
  candidateSha256: sha,
  provenance: { source_commit: "commit-new", run_id: "123", application_id: "com.example.app", artifact: { sha256: sha } },
  expectedApplicationId: "com.example.app",
  expectedCommit: "commit-new",
  expectedRunId: "123",
  registry: { tested_apks: [] },
  targetBehavior: "Counter increments when tapped",
  behaviorChanged: true
};

test("allows a new APK only with matching provenance and a specific behavior change", () => {
  assert.equal(evaluateCandidate(base).eligible, true);
});

test("rejects an APK whose hash was already device-tested", () => {
  const result = evaluateCandidate({ ...base, registry: { tested_apks: [{ sha256: sha, device_result: "PASS" }] } });
  assert.equal(result.eligible, false);
  assert.ok(result.blockers.includes("ALREADY_DEVICE_TESTED_IDENTICAL_APK"));
});

test("blocks missing provenance", () => {
  const result = evaluateCandidate({ ...base, provenance: null });
  assert.ok(result.blockers.includes("PROVENANCE_MISSING"));
});

test("blocks source commit mismatch", () => {
  const result = evaluateCandidate({ ...base, provenance: { ...base.provenance, source_commit: "old-commit" } });
  assert.ok(result.blockers.includes("SOURCE_COMMIT_MISMATCH"));
});

test("blocks workflow run mismatch", () => {
  const result = evaluateCandidate({ ...base, provenance: { ...base.provenance, run_id: "old-run" } });
  assert.ok(result.blockers.includes("WORKFLOW_RUN_MISMATCH"));
});

test("blocks a different hash when no behavior change is verified", () => {
  const result = evaluateCandidate({ ...base, candidateSha256: "b".repeat(64), behaviorChanged: false });
  assert.ok(result.blockers.includes("NO_VERIFIED_BEHAVIOR_CHANGE"));
});

test("blocks a missing test target", () => {
  const result = evaluateCandidate({ ...base, targetBehavior: " " });
  assert.ok(result.blockers.includes("TARGET_BEHAVIOR_MISSING"));
});

test("blocks an unexpected application ID", () => {
  const result = evaluateCandidate({ ...base, provenance: { ...base.provenance, application_id: "com.unexpected.app" } });
  assert.ok(result.blockers.includes("APPLICATION_ID_MISMATCH"));
});

import { classifyBehaviorDiff } from "../scripts/m6-behavior-diff-gate.mjs";

test("M6 behavior diff: verified no-change result stays ineligible", () => {
  assert.deepEqual(
    classifyBehaviorDiff({ mergeBase: "base-sha", diffExitCode: 0 }),
    { behaviorChanged: false, reason: "NO_M6_BEHAVIOR_DIFF" }
  );
});

test("M6 behavior diff: actual diff is the only eligible change result", () => {
  assert.deepEqual(
    classifyBehaviorDiff({ mergeBase: "base-sha", diffExitCode: 1 }),
    { behaviorChanged: true, reason: "M6_BEHAVIOR_DIFF_VERIFIED" }
  );
});

test("M6 behavior diff: missing merge-base fails closed", () => {
  assert.throws(
    () => classifyBehaviorDiff({ mergeBase: "", diffExitCode: 1 }),
    /M6_DIFF_MERGE_BASE_MISSING/
  );
});

test("M6 behavior diff: git execution errors fail closed", () => {
  for (const diffExitCode of [2, 128, -1]) {
    assert.throws(
      () => classifyBehaviorDiff({ mergeBase: "base-sha", diffExitCode }),
      /M6_DIFF_EXECUTION_FAILED/
    );
  }
});
