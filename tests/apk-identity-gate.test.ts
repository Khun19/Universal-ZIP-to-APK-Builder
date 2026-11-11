import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCandidate } from "../scripts/apk-identity-gate.mjs";
import { classifyBehaviorDiff, selectLatestM6Baseline } from "../scripts/m6-behavior-diff-gate.mjs";
import { resolveTrustedRegistryRevision } from "../scripts/m6-trusted-registry-revision.mjs";

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

test("candidate registry edits cannot suppress a duplicate recorded in the trusted registry snapshot", () => {
  const candidateRegistry = { tested_apks: [] };
  const trustedRegistrySnapshot = { tested_apks: [{ sha256: sha, device_result: "PASS" }] };
  assert.equal(evaluateCandidate({ ...base, registry: candidateRegistry }).eligible, true);
  const trustedResult = evaluateCandidate({ ...base, registry: trustedRegistrySnapshot });
  assert.equal(trustedResult.eligible, false);
  assert.ok(trustedResult.blockers.includes("ALREADY_DEVICE_TESTED_IDENTICAL_APK"));
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

const baselineSha = "c".repeat(40);
const resetAppDiff = `diff --git a/App.js b/App.js
--- a/App.js
+++ b/App.js
@@ -1,2 +1,5 @@
+accessibilityLabel="Reset tap count"
+onPress={() => setCount(0)}
+Reset counter`;
const resetTestDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,5 @@
+accessibilityLabel="Reset tap count"
+assert.match(appSource, /setCount\\(0\\)/)
+Reset counter`;

test("M6 registry baseline: selects the latest valid physical-device-tested M6 APK", () => {
  const older = { application_id: "com.builder.m6reactnative", device_result: "PASS", sha256: "a".repeat(64), source_commit: "1".repeat(40), device_tested_at: "2026-10-15" };
  const latest = { ...older, sha256: "b".repeat(64), source_commit: baselineSha, device_tested_at: "2026-10-16" };
  assert.equal(selectLatestM6Baseline({ tested_apks: [older, latest] }).source_commit, baselineSha);
});

test("M6 registry baseline: missing or invalid baseline fails closed", () => {
  assert.throws(() => selectLatestM6Baseline({ tested_apks: [] }), /M6_REGISTRY_BASELINE_MISSING/);
  assert.throws(() => selectLatestM6Baseline(null), /M6_REGISTRY_INVALID/);
});

test("M6 baseline gate: paired added app and test changes with reset behavior are eligible", () => {
  const result = classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1, appDiff: resetAppDiff, testDiff: resetTestDiff });
  assert.equal(result.behaviorChanged, true);
  assert.equal(result.targetBehavior, "Reset tap count to zero using the Reset counter button");
});

test("M6 baseline gate: deleted behavior evidence cannot qualify", () => {
  const deletedAppDiff = `diff --git a/App.js b/App.js
--- a/App.js
+++ b/App.js
@@ -1,5 +1,2 @@
-accessibilityLabel="Reset tap count"
-onPress={() => setCount(0)}
-Reset counter`;
  const deletedTestDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,2 @@
-accessibilityLabel="Reset tap count"
-assert.match(appSource, /setCount\\(0\\)/)
-Reset counter`;
  const result = classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1, appDiff: deletedAppDiff, testDiff: deletedTestDiff });
  assert.equal(result.behaviorChanged, false);
  assert.equal(result.targetBehavior, null);
});

test("M6 baseline gate: context-only reset evidence cannot qualify", () => {
  const contextAppDiff = `diff --git a/App.js b/App.js
--- a/App.js
+++ b/App.js
@@ -1,5 +1,6 @@
 accessibilityLabel="Reset tap count"
 onPress={() => setCount(0)}
 Reset counter
+unrelated app addition`;
  const contextTestDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,6 @@
 accessibilityLabel="Reset tap count"
 assert.match(appSource, /setCount\\(0\\)/)
 Reset counter
+unrelated test addition`;
  const result = classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1, appDiff: contextAppDiff, testDiff: contextTestDiff });
  assert.equal(result.behaviorChanged, false);
});

test("M6 baseline gate: unchanged and one-sided diffs remain ineligible", () => {
  for (const [appDiffExitCode, testDiffExitCode] of [[0,0],[1,0],[0,1]]) {
    assert.equal(classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode, testDiffExitCode, appDiff: resetAppDiff, testDiff: resetTestDiff }).behaviorChanged, false);
  }
});

test("M6 baseline gate: unrelated paired changes do not invent a behavior target", () => {
  const result = classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1, appDiff: "+unrelated app edit", testDiff: "+unrelated test edit" });
  assert.equal(result.behaviorChanged, false);
  assert.equal(result.targetBehavior, null);
});

test("M6 baseline gate: missing merge-base and non-ancestor baseline fail closed", () => {
  assert.throws(() => classifyBehaviorDiff({ mergeBase: "", baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1 }), /M6_DIFF_MERGE_BASE_MISSING/);
  assert.throws(() => classifyBehaviorDiff({ mergeBase: "d".repeat(40), baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 1 }), /M6_BASELINE_NOT_ANCESTOR/);
});

test("M6 baseline gate: git execution errors fail closed", () => {
  assert.throws(() => classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 128, testDiffExitCode: 1 }), /M6_DIFF_EXECUTION_FAILED/);
  assert.throws(() => classifyBehaviorDiff({ mergeBase: baselineSha, baselineCommit: baselineSha, appDiffExitCode: 1, testDiffExitCode: 2 }), /M6_DIFF_EXECUTION_FAILED/);
});


const prBaseSha = "1".repeat(40);
const mainParentSha = "2".repeat(40);
const mainHeadSha = "3".repeat(40);

test("trusted registry revision: pull_request uses the exact PR base SHA", () => {
  assert.equal(resolveTrustedRegistryRevision({
    eventName: "pull_request",
    ref: "refs/pull/116/merge",
    prBaseSha,
    sourceParent: mainParentSha,
    mainSha: mainHeadSha
  }), prBaseSha);
});

test("trusted registry revision: push to main uses the candidate first parent", () => {
  assert.equal(resolveTrustedRegistryRevision({
    eventName: "push",
    ref: "refs/heads/main",
    sourceParent: mainParentSha,
    mainSha: mainHeadSha
  }), mainParentSha);
});

test("trusted registry revision: workflow_dispatch on main uses the candidate first parent", () => {
  assert.equal(resolveTrustedRegistryRevision({
    eventName: "workflow_dispatch",
    ref: "refs/heads/main",
    sourceParent: mainParentSha,
    mainSha: mainHeadSha
  }), mainParentSha);
});

test("trusted registry revision: non-main dispatch uses fetched main head", () => {
  assert.equal(resolveTrustedRegistryRevision({
    eventName: "workflow_dispatch",
    ref: "refs/heads/feature",
    mainSha: mainHeadSha
  }), mainHeadSha);
});

test("trusted registry revision: invalid trusted refs and unsupported events fail closed", () => {
  assert.throws(() => resolveTrustedRegistryRevision({
    eventName: "pull_request",
    ref: "refs/pull/116/merge",
    prBaseSha: "invalid"
  }), /M6_TRUSTED_PR_BASE_SHA_INVALID/);
  assert.throws(() => resolveTrustedRegistryRevision({
    eventName: "push",
    ref: "refs/heads/main",
    sourceParent: ""
  }), /M6_TRUSTED_MAIN_PARENT_MISSING/);
  assert.throws(() => resolveTrustedRegistryRevision({
    eventName: "workflow_dispatch",
    ref: "refs/heads/feature",
    mainSha: ""
  }), /M6_TRUSTED_MAIN_HEAD_MISSING/);
  assert.throws(() => resolveTrustedRegistryRevision({
    eventName: "schedule",
    ref: "refs/heads/main"
  }), /M6_TRUSTED_EVENT_UNSUPPORTED/);
});
