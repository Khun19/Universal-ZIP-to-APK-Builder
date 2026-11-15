# Single-Maintainer Governance and Independent Evidence Gate

**Status:** Proposed implementation; becomes active only after this workflow is merged to `main`.

## Purpose

The repository has one active Maintainer (`@Khun19`) and no independent human code owner. Governance must therefore distinguish machine-verifiable evidence from human review and from the Maintainer's merge decision. The absence of a second human reviewer must not be disguised as an approval.

## Decision roles

| Record | Meaning | What it does not mean |
|---|---|---|
| Author technical review | Author's own exact-head audit and findings | Independent approval |
| Independent Evidence Gate | Trusted workflow verifies exact-head checks and repository security-alert state | Human code review or product/device acceptance |
| Copilot Code Review | Separate automated review control enforced by the repository Ruleset | Human Maintainer approval |
| Founder/Maintainer Decision | Explicit owner decision tied to exact PR head and base SHA | A GitHub `APPROVED` review |

## Gate behavior

The workflow publishes the exact required check context **`AI Technical Review Gate`** on the PR head SHA. It uses GitHub API metadata only. It does not checkout, install, execute, source, or import files from the candidate PR.

It verifies:

- PR is open, targets `main`, and the event SHA still equals the current PR head SHA.
- Required CodeQL checks and language analyses completed successfully on that exact SHA.
- M5 and M6 build checks completed successfully on that exact SHA.
- Builder Quality Gates and M4 checks are required when their configured path filters apply.
- Android Emulator Device Test is required when its configured path filters apply. M6 classifier, fixture, or exact-acceptance workflow changes additionally require the `M6 Exact APK Emulator Acceptance` result for the exact artifact built from the PR head.
- The repository has zero open code-scanning alerts. If the alerts API cannot be read, the gate fails closed.
- Check runs must come from the exact Ruleset integration IDs: CodeQL from `github-advanced-security` app ID `57789`; the other required jobs from `github-actions` app ID `15368`. Candidate PRs cannot satisfy a check by creating a same-named check from an unrelated app.
- Any change under `.github/workflows/`, `.github/actions/`, or either CODEOWNERS file requires a repository-owner comment containing `Trust Configuration Audit: PASS`, the exact `Head SHA`, and exact `Base SHA`. This makes changes to trusted CI and ownership definitions an explicit Founder audit rather than silently trusting candidate PR code.
- Missing, pending, failed, skipped-when-applicable, stale, producer-mismatched, or SHA-mismatched evidence is a failure. A path-filtered workflow may be marked `NOT_APPLICABLE` only when the PR does not touch its declared trigger paths.

The workflow re-evaluates after PR updates, review submissions, and completion of relevant CI workflows. A later exact-head evaluation can supersede an earlier pending/failure result.

## Evidence tiers

Use these values in tested-APK records:

- `INDEPENDENTLY_VERIFIED`: device-side identity and acceptance evidence independently captured and cross-checked.
- `USER_CONFIRMED`: user reports the physical-device result; device-side identity or evidence capture is not independently available.
- `NOT_RUN`: the test was not performed.
- `UNVERIFIED`: evidence is incomplete, conflicting, or cannot be reconciled.

A `device_result: PASS` record with `evidence_tier: USER_CONFIRMED` remains user-confirmed. It must never be represented as independently verified. Build PASS, emulator PASS, APK identity PASS, provenance PASS, and physical-device acceptance are separate gates.

## Founder/Maintainer decision record

Before merge, the Maintainer records a PR conversation comment tied to the exact head and base SHA:

```text
## Founder Decision
Decision: APPROVE_MERGE | HOLD | REJECT
PR: #<number>
Head SHA: <40-character SHA>
Base SHA: <40-character SHA>
Independent Evidence Gate: PASS
Copilot Code Review: ENFORCED_BY_RULESET / NOT_AVAILABLE
Accepted residual risks: <none or explicit list>
Evidence references: <run IDs, artifact IDs, hashes, reports>
```

No automatic merge is permitted. The Founder Decision is not submitted as a GitHub approval and does not impersonate a second reviewer.

## Bootstrap rule

The workflow cannot govern its own first deployment because GitHub loads the `pull_request_target` workflow from the base/default branch. The first deployment therefore needs a separately documented one-time Maintainer bootstrap decision after exact-head CI, security review, and evidence audit. Use Admin bypass only if the Ruleset prevents that first deployment; never bypass open High/Critical findings or failed exact-head checks. Once deployed, subsequent PRs must pass the exact-head gate.

## Current rollout sequence

1. P0 governance audit and this workflow design.
2. PR #121: close AST binding/shadowing and fake-reader bypasses.
3. PR #109: preserve the M6 physical-device record as `USER_CONFIRMED`.
4. Deploy this trusted gate.
5. Revalidate PR #121 and PR #109 under the gate.
6. PR #120: rebase/revalidate against the trusted classifier and updated registry. Its `device_test_eligible` result must derive from trusted source evidence; no manual promotion.
