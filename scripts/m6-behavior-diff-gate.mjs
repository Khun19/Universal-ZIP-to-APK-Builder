/**
 * Fail-closed classification for the M6 behavior-diff check.
 * git diff --quiet returns 0 for no changes and 1 for changes; every other
 * exit code is an execution error, not evidence of a behavior change.
 * Both the app fixture and its regression test must change.
 */
export function classifyBehaviorDiff({ mergeBase, appDiffExitCode, testDiffExitCode }) {
  if (typeof mergeBase !== "string" || !mergeBase.trim()) {
    throw new Error("M6_DIFF_MERGE_BASE_MISSING");
  }
  for (const exitCode of [appDiffExitCode, testDiffExitCode]) {
    if (exitCode !== 0 && exitCode !== 1) {
      throw new Error("M6_DIFF_EXECUTION_FAILED");
    }
  }
  const behaviorChanged = appDiffExitCode === 1 && testDiffExitCode === 1;
  return {
    behaviorChanged,
    reason: behaviorChanged ? "M6_APP_AND_REGRESSION_TEST_DIFF_VERIFIED" : "M6_APP_AND_REGRESSION_TEST_DIFF_REQUIRED"
  };
}
