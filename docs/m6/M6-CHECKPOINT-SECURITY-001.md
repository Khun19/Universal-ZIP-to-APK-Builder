# M6 Security Checkpoint 001

## Step
STEP 1 — Canonical baseline audit / security hardening

## Gate
Security prerequisite for G1–G13

## Status
FIX IMPLEMENTED — VERIFICATION PENDING

## Confirmed root cause
The original Flutter scaffold path constructed a shell command containing `scaffoldPath` and passed it to `child_process.exec()`. This was a real shell-injection risk.

## Fix
- Flutter commands now execute through `execFile()` with discrete arguments.
- Ubuntu PRoot execution passes project path and Flutter executable as positional arguments to a fixed wrapper script.
- Flutter SDK validation no longer interpolates `FLUTTER_PROOT_DISTRO` or `FLUTTER_PROOT_PATH` into a shell command.
- APK ZIP inspection no longer interpolates the APK path into an `unzip` shell command.
- Added `tests/worker-command-security.test.ts`.
- Corrected the RN integration test's stale dependency assertions to match the canonical 0.76.9 fixture.
- Added `.github/workflows/m6-validation.yml` for typecheck + test verification.

## Evidence
Canonical RN fixture currently declares:
- React Native 0.76.9
- Hermes enabled
- New Architecture enabled
- arm64-v8a
- OpenSourceMergedSoMapping
- DefaultNewArchitectureEntryPoint
- React Native Gradle plugin 0.76.9
- Metro config 0.76.9
- No Expo dependency in the RN fixture

## Tests
Repository test execution is not available through the GitHub connector in this session.

CI workflow was added at:
`.github/workflows/m6-validation.yml`

First workflow run for commit `bd34c2c993eac0452040d76d0c40ea2fe315b2a3` was not yet visible when this checkpoint was written.

## Build
Not executed in this connector session.

## APK
Not generated in this connector session.

## Device
G9–G13 remain unverified and require the real Android/Termux environment.

## Commit
Security/fix commits are already pushed to `feat/m6-react-native-canonical`.

## Next action
Run the new CI validation. If CI passes, continue G1–G8 verification. If CI fails, remain on the failing root cause and fix it before advancing.

## Limitations
No claim of PASS is made for the security fix, G1–G8, or G9–G13 until execution evidence exists.
