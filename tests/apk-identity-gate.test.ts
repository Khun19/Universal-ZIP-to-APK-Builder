import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCandidate } from "../scripts/apk-identity-gate.mjs";

const sha = "a".repeat(64);
const base = {
  candidateSha256: sha,
  provenance: { source_commit: "commit-new", run_id: "123", artifact: { sha256: sha } },
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
