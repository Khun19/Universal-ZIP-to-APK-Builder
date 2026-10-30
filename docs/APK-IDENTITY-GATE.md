# APK Identity and Real-Device Eligibility Gate

**Status:** Implemented in this branch; CI verification is required before merge.  
**Scope:** All M1–M12 APK delivery and real-device acceptance decisions. The M6 workflow is the first automated integration point.

## Mandatory pre-download decision

Before sharing an APK for a physical-device test, establish all of the following:

1. Exact GitHub Actions workflow run ID and conclusion.
2. Exact source commit SHA associated with that run.
3. APK file extracted from that run's artifact (never substitute the artifact ZIP's digest).
4. SHA-256 and byte size calculated from the actual APK bytes.
5. Provenance JSON values match the actual APK, expected commit and expected run ID.
6. Package/application ID and artifact provenance identify the intended fixture.
7. Comparison against every applicable entry in `docs/tested-apk-registry.json`.
8. A specific, testable app-code or behavior change and a corresponding device-test target.

If any identity/provenance value is missing or inconsistent, block the download/test instruction and state the missing evidence. A different hash is not evidence of a useful behavior change.

## Decision rules

- **Same SHA-256 as a previously device-tested APK:** do not ask the user to reinstall or retest it as a new candidate.
- **Different SHA-256, no verified app-code/behavior change:** do not request device retesting; explain that the difference alone is insufficient.
- **Specific verified behavior change and valid provenance:** the candidate may be offered for the exact target behavior only after the source diff and run artifact are inspected.
- **CI/build PASS:** does not imply install, launch, runtime, or feature PASS.
- **`real_device_acceptance: NOT_RUN`:** means NOT RUN. Never rewrite it as PASS based on artifact creation or CI.
- **Device PASS/FAIL:** record only against the exact APK SHA-256, source commit and workflow run ID that were actually tested. Never carry results forward to a new APK.

## Repository implementation

- `scripts/apk-identity-gate.mjs` verifies APK SHA-256 and size against provenance, checks source commit/run mapping, and reports whether the exact hash already appears in the device-tested registry.
- `tests/apk-identity-gate.test.ts` tests candidate eligibility, including same-hash rejection, missing provenance, commit/run mismatch, missing test target and changed-hash-without-behavior-change.
- `docs/tested-apk-registry.json` is the evidence index for previously device-tested APKs. Add records only when device evidence exists; preserve the exact hash/commit/run mapping.
- `.github/workflows/ubuntu-m6-build-test.yml` runs the policy tests and validates the built APK against its generated provenance before artifact upload.

The automated artifact validator is an identity/provenance check, not an automatic determination that application behavior changed. Human review of the exact source diff remains mandatory for real-device eligibility.

## Required commands

For GitHub Actions, set `SOURCE_COMMIT` to the PR head SHA for `pull_request` events and to `github.sha` for push/manual runs. Record `github.sha` separately as `workflow_sha` because on a PR event it identifies the synthetic merge checkout, not the source branch head. Example workflow environment:

```yaml
env:
  SOURCE_COMMIT: ${{ github.event.pull_request.head.sha || github.sha }}
  WORKFLOW_SHA: ${{ github.sha }}
```

The M6 workflow runs the validator after generating the APK and provenance:

```sh
node scripts/apk-identity-gate.mjs \
  --apk .workspace/m6-react-native-direct-integration/android/app/build/outputs/apk/debug/app-debug.apk \
  --provenance .workspace/m6-react-native-direct-integration/android/app/build/outputs/apk/debug/provenance.json \
  --expected-commit "$SOURCE_COMMIT" \
  --expected-run-id "$GITHUB_RUN_ID" \
  --registry docs/tested-apk-registry.json \
  --output apk-identity-gate-report.json
```

The generated report must be inspected before any real-device download instruction. A known hash is reported as already device-tested and not eligible as a new candidate; it is not treated as a new feature test.

## Acceptance checklist

- [ ] CI passes identity-gate tests.
- [ ] CI validator confirms actual APK SHA-256 and size match provenance.
- [ ] CI fails on missing/mismatched provenance, source commit or run ID.
- [ ] Report flags a SHA-256 already in the device-tested registry.
- [ ] Source diff establishes a concrete testable behavior change before a device link is shared.
- [ ] Device record references exact APK SHA-256 + source commit + workflow run ID.
- [ ] M6/Expo progression remains blocked until the relevant acceptance gates are met.
