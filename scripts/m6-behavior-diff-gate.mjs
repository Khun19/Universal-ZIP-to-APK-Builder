/**
 * Fail-closed classification for the M6 behavior-diff check.
 * git diff --quiet returns 0 for no changes and 1 for changes; every other
 * exit code is an execution error, not evidence of a behavior change.
 */
export function classifyBehaviorDiff({ mergeBase, diffExitCode }) {
  if (typeof mergeBase !== "string" || !mergeBase.trim()) {
    throw new Error("M6_DIFF_MERGE_BASE_MISSING");
  }
  if (diffExitCode === 0) {
    return { behaviorChanged: false, reason: "NO_M6_BEHAVIOR_DIFF" };
  }
  if (diffExitCode === 1) {
    return { behaviorChanged: true, reason: "M6_BEHAVIOR_DIFF_VERIFIED" };
  }
  throw new Error("M6_DIFF_EXECUTION_FAILED");
}
