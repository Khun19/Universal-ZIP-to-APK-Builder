const SHA40 = /^[0-9a-f]{40}$/;

/**
 * Select the registry revision from trusted GitHub event metadata.
 * PRs trust the exact base SHA; main push/dispatch trusts the candidate's
 * first parent; non-main refs trust the fetched main head.
 */
export function resolveTrustedRegistryRevision({
  eventName,
  ref,
  prBaseSha = "",
  sourceParent = "",
  mainSha = ""
}) {
  if (eventName === "pull_request") {
    if (!SHA40.test(prBaseSha)) throw new Error("M6_TRUSTED_PR_BASE_SHA_INVALID");
    return prBaseSha;
  }

  if ((eventName === "push" || eventName === "workflow_dispatch") && ref === "refs/heads/main") {
    if (!SHA40.test(sourceParent)) throw new Error("M6_TRUSTED_MAIN_PARENT_MISSING");
    return sourceParent;
  }

  if (eventName === "push" || eventName === "workflow_dispatch") {
    if (!SHA40.test(mainSha)) throw new Error("M6_TRUSTED_MAIN_HEAD_MISSING");
    return mainSha;
  }

  throw new Error("M6_TRUSTED_EVENT_UNSUPPORTED");
}
