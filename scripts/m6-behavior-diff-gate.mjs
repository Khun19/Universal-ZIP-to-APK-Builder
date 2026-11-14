/**
 * Fail-closed classification for M6 behavior changes against the latest
 * physical-device-tested registry baseline. Both the app fixture and its
 * regression test must prove the supported reset-counter behavior.
 */
const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function selectLatestM6Baseline(registry) {
  if (!registry || !Array.isArray(registry.tested_apks)) throw new Error("M6_REGISTRY_INVALID");
  const candidates = registry.tested_apks
    .filter((record) => record &&
      record.application_id === "com.builder.m6reactnative" &&
      record.device_result === "PASS" &&
      SHA256.test(record.sha256 || "") &&
      SHA40.test(record.source_commit || "") &&
      typeof record.device_tested_at === "string" &&
      !Number.isNaN(Date.parse(record.device_tested_at)))
    .sort((a, b) => Date.parse(b.device_tested_at) - Date.parse(a.device_tested_at));
  if (candidates.length === 0) throw new Error("M6_REGISTRY_BASELINE_MISSING");
  return candidates[0];
}

function addedDiffLines(diff) {
  return diff
    .split(/\r?\n/)
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");
}

export function classifyBehaviorDiff({
  mergeBase, baselineCommit, appDiffExitCode, testDiffExitCode,
  appDiff = "", testDiff = ""
}) {
  if (typeof mergeBase !== "string" || !SHA40.test(mergeBase)) {
    throw new Error("M6_DIFF_MERGE_BASE_MISSING");
  }
  if (typeof baselineCommit !== "string" || !SHA40.test(baselineCommit) || mergeBase !== baselineCommit) {
    throw new Error("M6_BASELINE_NOT_ANCESTOR");
  }
  for (const exitCode of [appDiffExitCode, testDiffExitCode]) {
    if (exitCode !== 0 && exitCode !== 1) throw new Error("M6_DIFF_EXECUTION_FAILED");
  }

  const pairedDiff = appDiffExitCode === 1 && testDiffExitCode === 1;
  // Match complete added source/test lines. Substrings inside comments, strings,
  // deleted lines, and unchanged diff context are not accepted as evidence.
  const appAdditions = addedDiffLines(appDiff);
  const testAdditions = addedDiffLines(testDiff);
  const resetAppEvidence =
    /^\s*accessibilityLabel="Reset tap count"\s*$/m.test(appAdditions) &&
    /^\s*onPress=\{\(\) => setCount\(0\)\}\s*$/m.test(appAdditions) &&
    /^\s*<Text style=\{styles\.buttonText\}>Reset counter<\/Text>\s*$/m.test(appAdditions);
  const resetTestEvidence =
    /^\s*assert\.match\(appSource, \/accessibilityLabel="Reset tap count"\/\);\s*$/m.test(testAdditions) &&
    /^\s*assert\.match\(appSource, \/onPress=.*setCount.*0.*\/\);\s*$/m.test(testAdditions) &&
    /^\s*assert\.match\(appSource, \/Reset counter\/\);\s*$/m.test(testAdditions);
  const behaviorChanged = pairedDiff && resetAppEvidence && resetTestEvidence;
  return {
    behaviorChanged,
    targetBehavior: behaviorChanged ? "Reset tap count to zero using the Reset counter button" : null,
    reason: behaviorChanged
      ? "M6_RESET_BEHAVIOR_AND_REGRESSION_TEST_VERIFIED_FROM_REGISTRY_BASELINE"
      : "M6_PAIRED_BEHAVIOR_DIFF_AND_SUPPORTED_TARGET_REQUIRED"
  };
}
