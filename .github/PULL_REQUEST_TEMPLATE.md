## Summary
<!-- What does this change? -->

## Why this change
<!-- What problem or requirement does it address? -->

## Scope / files affected
<!-- List the intended files and confirm unrelated changes are excluded. -->

## Validation performed
Mark each relevant check accurately. Explain skipped or blocked checks.

- [ ] `pnpm run typecheck` — PASS / FAIL / BLOCKED / NOT RUN
- [ ] `pnpm run build` — PASS / FAIL / BLOCKED / NOT RUN
- [ ] `pnpm test` — PASS / FAIL / BLOCKED / NOT RUN
- [ ] Other relevant checks: <!-- result and evidence -->

Skipped or blocked checks and reasons:
<!-- -->

## Evidence
<!-- Add relevant logs, screenshots, CI run links, test results, artifact details, SHA-256 checksums, and exact commit linkage where applicable. Distinguish verified results from assumptions. -->

## APK / device claim discipline
- [ ] I have not treated a local/workspace build alone as proof that an Android APK was produced.
- [ ] For any APK claim, I provide CI and artifact evidence tied to the exact commit under review, including validation/provenance details where applicable.
- [ ] I distinguish CI build/test success from real-device installation, launch, and interaction acceptance. Device results are reported separately when required.
- [ ] If not applicable, I explain why.

## Release / package impact
- [ ] No public release or package metadata changes.
- [ ] If release-related, changelog, version/tag alignment, checksums, provenance, and limitations are covered.
- [ ] If package-related, public API, package contents, license, exports, Node.js support, and dry-run evidence are covered.
- [ ] No APK is described as official unless its exact-source hash and required runtime/device evidence are attached.

## Gate status
- [ ] No known unresolved P0/P1 security blocker is bypassed by this PR.
- [ ] CI/review evidence refers to the latest exact PR head.
- [ ] Out-of-scope follow-up work is linked and this PR does not silently advance a blocked milestone.

## Security reminder
Do not post suspected vulnerabilities in public issues or this PR discussion. Follow the private reporting guidance in [`SECURITY.md`](../SECURITY.md).
