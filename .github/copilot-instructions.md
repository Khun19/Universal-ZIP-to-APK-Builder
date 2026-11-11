# Pull request review requirements

For every pull request review, inspect the complete diff against the base branch and the exact current head commit. Re-review after every pushed commit. Do not infer that passing CI proves source correctness.

Your review must cover these areas:
- Security: input validation, trust boundaries, secrets, permissions, dependency and supply-chain risks.
- Regression: changed behavior, compatibility, edge cases, and paired tests.
- Workflow: GitHub Actions triggers, permissions, concurrency, artifact identity, and fail-closed behavior.
- APK Identity: package/application ID, manifest, APK hash, and exact artifact/source linkage when applicable.
- Provenance: source/base/head SHA, workflow run, artifact ID, toolchain, and provenance consistency when applicable.
- Test Evidence: exact-head CI, test coverage, emulator/device scope, and evidence gaps.

Use NOT_APPLICABLE only when the area genuinely does not apply, and explain why. Missing evidence is not a PASS. Do not claim emulator or physical-device acceptance unless the exact artifact was actually tested at that level. Do not claim a human approval.

The first non-empty line of every review must be exactly one of:
AI_TECHNICAL_REVIEW: PASS
AI_TECHNICAL_REVIEW: FAIL

Then include:
- Reviewed commit: <full 40-character head SHA>
- Base commit: <full 40-character base SHA>
- Security: PASS|FAIL|NOT_APPLICABLE — concise evidence
- Regression: PASS|FAIL|NOT_APPLICABLE — concise evidence
- Workflow: PASS|FAIL|NOT_APPLICABLE — concise evidence
- APK Identity: PASS|FAIL|NOT_APPLICABLE — concise evidence
- Provenance: PASS|FAIL|NOT_APPLICABLE — concise evidence
- Test Evidence: PASS|FAIL|NOT_APPLICABLE — concise evidence
- Findings: list each issue with severity, file/line, impact, and required fix; or state none.

If any high/critical issue exists, any required test fails, exact-head evidence is missing, a trust boundary is bypassable, or a claim cannot be verified, emit AI_TECHNICAL_REVIEW: FAIL. Never emit PASS while listing unresolved findings. Be explicit about uncertainty.
