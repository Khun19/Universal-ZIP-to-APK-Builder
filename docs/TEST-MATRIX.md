# Universal ZIP-to-APK Builder — Test Matrix

This document is the acceptance contract for build compatibility. A test is only PASS when the stated evidence exists; command exit success alone is insufficient for runtime-sensitive tests.

## Status Vocabulary

- **PASS** — verified with evidence
- **FAIL** — reproduced failure
- **BLOCKED** — cannot run because a required environment/device/tool is unavailable
- **NOT RUN** — not executed yet
- **ALIGNED** — Goal Alignment & Deviation Audit found no material goal deviation
- **DEVIATION FOUND** — audit found a goal/architecture/requirement deviation that must be corrected

## Test A — Static Web

| Area | Check | Acceptance |
|---|---|---|
| ZIP | Valid archive | Secure extraction succeeds |
| Security | Archive paths | No workspace escape |
| Analysis | Project detection | Static web detected |
| Strategy | Selection | `web-wrapper` selected |
| Web | Build | Web output produced |
| Android | Wrapper | Valid Android project produced |
| Gradle | Build | APK produced |
| APK | Validation | APK structure valid |
| Artifact | Integrity | SHA-256 available |
| Device | Install | APK installs when device available |
| Device | Launch | App launches |

## Test B — React/Vite PWA

| Area | Check | Acceptance |
|---|---|---|
| Analysis | React/Vite detection | Correct strategy selected |
| Dependencies | Lockfile policy | Existing package manager respected |
| Web | Vite build | Build completes |
| PWA | Plugin/runtime | PWA build completes without unresolved runtime dependencies |
| Workbox | Compatibility | Workbox dependencies resolve deterministically |
| Assets | Output | Built assets are packaged correctly |
| Android | Wrapper | Android wrapper is valid |
| Gradle | Build | APK produced |
| APK | Validation | APK passes validation |
| Device | Install/launch | Works on real Android when available |

## Test C — Camera QR Scanner PWA

| Area | Check | Acceptance |
|---|---|---|
| ZIP | Extraction | Safe extraction succeeds |
| Analysis | PWA detection | Correct strategy selected |
| Web | Build | PWA build completes |
| Workbox | Build | No unresolved Workbox dependency |
| Android | Wrapper | Camera-capable wrapper generated |
| Permission | Camera | Runtime permission can be requested/granted |
| Runtime | Camera | Camera opens on real Android |
| Runtime | QR | QR scanner detects a valid test QR |
| Runtime | Navigation | Back/navigation behaves correctly |
| APK | Validation | APK is valid and installable |

## Goal Alignment & Deviation Audit

This is a development acceptance gate, separate from build/runtime tests.

| Check | Acceptance |
|---|---|
| Target goal | Current target goal is explicitly identified |
| Architecture alignment | Change remains within the canonical three layers |
| Technical correctness | Implementation is technically correct for its intended scope |
| Deviation risk | Technically correct but goal-divergent paths are identified |
| Requirements | Missing requirements/dependencies/constraints are identified |
| False progress | Passing tests do not mask an unmet product goal |
| Scope drift | Unnecessary expansion or legacy-driven work is identified |
| Secondary/Legacy boundary | Legacy/API/DB/queue/worker/Docker/Replit components are not treated as canonical product layers |
| Correction | Required corrective action is recorded before progression |

**Audit status:** `ALIGNED` / `DEVIATION FOUND` / `BLOCKED`.

`DEVIATION FOUND` or `BLOCKED` prevents milestone progression until resolved and re-audited.

## Core Unit/Integration Coverage

### Security

- [ ] Absolute ZIP path rejected
- [ ] `../` traversal rejected
- [ ] Windows drive path rejected
- [ ] NUL/unsafe filename rejected
- [ ] Symlink escape prevented
- [ ] Excessive file count rejected
- [ ] Excessive uncompressed size rejected
- [ ] Abnormal compression ratio handled
- [ ] Extracted paths remain inside workspace

### Analyzer

- [ ] Native Android detected
- [ ] Capacitor detected
- [ ] React/Vite detected
- [ ] Plain web detected
- [ ] Unsupported/unknown project blocked safely
- [ ] Detection does not rely on a single filename when multiple indicators are available

### Build Engine

- [ ] Correct strategy selected
- [ ] Missing tool diagnosed
- [ ] Dependency-install failure captured
- [ ] Web-build failure captured
- [ ] Gradle failure captured
- [ ] Timeout handled
- [ ] Exit code retained
- [ ] Build workspace isolated

### APK

- [ ] APK located deterministically
- [ ] Missing APK reported as failure
- [ ] APK validation rejects invalid artifact
- [ ] SHA-256 is deterministic
- [ ] Artifact metadata is complete

### API/UI

- [ ] Build can be created
- [ ] Build state reflects actual backend state
- [ ] Logs can be retrieved
- [ ] Analysis can be retrieved
- [ ] Artifact metadata can be retrieved
- [ ] Download path is correct
- [ ] Failed/blocked builds show useful diagnostics

## Environment Matrix

Where practical, validate across:

| Environment | Purpose |
|---|---|
| Local development | Fast engineering feedback |
| Termux | Phone/local Android build workflow |
| Docker Android builder | Reproducibility/isolation |
| GitHub Actions | CI verification |
| Real Android device | Runtime truth |

## Regression Policy

When fixing a failure:

1. Reproduce the failure.
2. Add or update a regression case.
3. Apply the smallest safe fix.
4. Run the affected test.
5. Run previously passing related tests.
6. Run the broader suite when practical.
7. Run real-device verification when the change affects Android runtime behavior.

Never mark a regression PASS from an unexecuted test.

## Evidence Record

For each important real test, record at least:

- Test ID
- Date
- Commit SHA
- Input fixture
- Environment
- Command(s)
- Result
- APK name/size when applicable
- SHA-256 when applicable
- Device/emulator information when applicable
- Failure logs when failed

## Current Acceptance Rule

The project should not claim universal compatibility merely because Tests A, B, and C pass. Those tests establish an expanding compatibility baseline. New project types require their own fixture and acceptance criteria before being represented as supported.

## Additional Build Quality and Security Gates

The normative requirements and detailed security cases are defined in [Build Quality, Security, and Evidence Standards](BUILD-QUALITY-SECURITY-STANDARDS.md). Apply these gates to relevant fixtures and implementation changes; this section does not imply that all checks are already implemented.

| Area | Required check | Acceptance evidence |
|---|---|---|
| ZIP intake | Reject traversal, absolute paths, unsafe symlinks, duplicate/case-colliding paths, malformed archives | Automated adversarial fixture results |
| Resource limits | Enforce compressed/uncompressed size, entry count, per-entry size, depth, and expansion ratio during extraction | Boundary and over-limit tests |
| Cleanup | Cancellation/failure stops child processes and removes or invalidates partial outputs | Integration test and workspace inspection |
| Secrets | Detect likely secrets and redact secret values from diagnostics | Safe test fixture and log assertions |
| Detection | Multiple signals, conflict handling, no silent strategy fallback | Positive, negative, and ambiguous fixtures |
| Provenance | Source/ZIP/lockfile hashes, generator revision, toolchain versions, command, CI run | Complete fixture evidence record |
| APK validation | Separate artifact, structure, install, runtime, and feature results | Per-level test evidence |
| Identity/security | Package ID, SDK metadata, signing type, relevant permissions | APK inspection report |
| Diagnostics | Stable error category, failed phase, exit code/log excerpt where available | Failure fixture and redaction test |
| Device acceptance | Device/API/ABI and evidence source recorded; CI and device results separated | Device log/screenshot or clearly labeled user report |

## Support Status Is Not a Single Boolean

Use the following independent labels in reports:
- `DOCUMENTED`: specification exists.
- `IMPLEMENTED`: code path exists, not necessarily validated.
- `AUTOMATED-TESTED`: named tests passed at a named revision.
- `CI-VERIFIED`: required CI checks passed for a named fixture/revision.
- `DEVICE-VERIFIED`: required device/runtime checks passed and the evidence source is recorded.
- `BLOCKED`, `NOT RUN`, and `FAIL`: preserve their distinct meanings.

Do not convert skipped tests to PASS. A fixture can only receive its final PASS when all mandatory levels in its fixture contract have evidence. CI success is not device verification, and one passing fixture is not universal framework support.


## Android Emulator Automated Runtime Gate

The workflow `.github/workflows/android-emulator-device-test.yml` currently exercises the Community Chat React Native fixture through the actual Builder CLI on GitHub Actions Ubuntu and Android Emulator API 35 (Google APIs, x86_64). It is the first implementation of the shared emulator-testing foundation, not proof that every framework adapter has already been integrated.

Required evidence for this fixture:
- [ ] APK structure and embedded React Native bundle are valid.
- [ ] APK package ID, size, SHA-256, source commit and run ID are recorded.
- [ ] Emulator boots and reports its Android API level and ABI.
- [ ] APK installs successfully through `adb install`.
- [ ] Launcher activity starts and Communities UI renders.
- [ ] Community chat opens and expected starter message is visible.
- [ ] A local message can be entered and appears in the chat.
- [ ] Profile screen opens and expected profile text renders.
- [ ] Screenshot, UI hierarchy XML, emulator log, install output and logcat are uploaded even on failure where available.

The helper `scripts/android-emulator-ui-test.py` uses UIAutomator hierarchy text/content descriptions and calculated element bounds rather than fixed tap coordinates. Missing elements fail the test. Emulator API 35 x86_64 is a CI runtime target and does not replace physical-device acceptance.

**Prior PR-head verification:** [Run #40418259332](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/40418259332) completed successfully for PR head `716747497232e0c5e7df2f3f7f2e04790fa187b2` against base `262388886ad152c43ff5b490ea3c596fb430404c`. The retained artifact's provenance records build commit `c3237a0b843ad1e7ab786ad42f11ca367675d262` (the synthetic merge of that base and head), so it verifies that merge tree rather than a build checked out directly at the PR head. The follow-up exact-head checkout, fixture lockfile, package assertion, SDK revision enforcement, and bounded install changes remain pending a new run.

**Current status:** `IMPLEMENTED — FOLLOW-UP EXACT-HEAD CI VERIFICATION PENDING`. Integration into M4, M5, and other framework-specific build workflows remains a separate follow-up; do not claim all-framework emulator coverage until each fixture has an explicit test contract and exact-head evidence.

## Android Emulator Runtime Acceptance

The installation prerequisites, host-library checks, acceleration fallback, AVD boot protocol, APK identity gates, framework adapters, failure evidence, and PASS/FAIL definitions are specified in [Android Emulator Requirements and Installation Plan](ANDROID-EMULATOR-REQUIREMENTS.md). Apply this contract to the emulator CI workflow. The current automated fixture covers React Native Community Chat only; other frameworks remain uncovered until their own runtime fixtures and assertions pass.
