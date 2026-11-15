const SHA40 = /^[0-9a-f]{40}$/;
const ZERO_SHA = "0".repeat(40);

/**
 * Select the registry revision from trusted GitHub event metadata.
 * PRs trust the exact base SHA; main pushes trust github.event.before;
 * manual dispatch on main trusts the exact dispatched main source SHA.
 */
export function resolveTrustedRegistryRevision({
  eventName,
  ref,
  prBaseSha = "",
  pushBeforeSha = "",
  sourceSha = "",
  mainSha = ""
}) {
  if (eventName === "pull_request") {
    if (!SHA40.test(prBaseSha) || prBaseSha === ZERO_SHA) {
      throw new Error("M6_TRUSTED_PR_BASE_SHA_INVALID");
    }
    return prBaseSha;
  }

  if (eventName === "push" && ref === "refs/heads/main") {
    if (!SHA40.test(pushBeforeSha) || pushBeforeSha === ZERO_SHA) {
      throw new Error("M6_TRUSTED_MAIN_BEFORE_INVALID");
    }
    return pushBeforeSha;
  }

  if (eventName === "workflow_dispatch" && ref === "refs/heads/main") {
    if (!SHA40.test(sourceSha) || sourceSha === ZERO_SHA) {
      throw new Error("M6_TRUSTED_DISPATCH_SOURCE_INVALID");
    }
    return sourceSha;
  }

  if ((eventName === "push" || eventName === "workflow_dispatch") && ref !== "refs/heads/main") {
    if (!SHA40.test(mainSha) || mainSha === ZERO_SHA) {
      throw new Error("M6_TRUSTED_MAIN_HEAD_MISSING");
    }
    return mainSha;
  }

  throw new Error("M6_TRUSTED_EVENT_UNSUPPORTED");
}
