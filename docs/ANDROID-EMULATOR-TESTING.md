# Android Emulator Device-Test Strategy

## Purpose

Use an Android Emulator on GitHub Actions Ubuntu runners as a repeatable, automated device-test environment for framework-generated APKs. The emulator is a persistent part of the Builder's CI design; it is not installed on the user's phone and does not replace real-device acceptance.

## Current implementation scope

The first integration is the M6 React Native fixture in `.github/workflows/ubuntu-m6-build-test.yml`.

For each eligible M6 workflow run, CI should:

1. Build the fixture APK from the exact checked-out source/workflow revision.
2. Start an Android 14 (API 34), Google APIs, x86_64 emulator on the Ubuntu runner.
3. Record emulator Android release, API level, ABI, and ADB device details.
4. Confirm the APK package ID is `com.builder.m6reactnative`.
5. Record the APK's SHA-256 and size.
6. Install the APK with ADB and launch its launcher activity.
7. Confirm the app process remains alive, save a screenshot and Logcat, and fail the workflow if installation, launch, or process-stability checks fail.
8. Upload emulator logs and screenshot as `m6-android-emulator-evidence`.
9. Keep APK provenance explicit: `emulator_install_launch: PASS` is separate from `real_device_acceptance: NOT_RUN`.

A passing emulator smoke test is not a claim that every screen or feature works. It also does not establish compatibility with every Android API/ABI.

## Required follow-up phases

Do not label emulator device testing as project-wide until these phases have evidence:

- **Phase 1 — M6 pilot:** install, launch, process stability, APK identity, screenshot, and logs.
- **Phase 2 — Feature interactions:** add deterministic, fixture-specific UI assertions for React Native interactions. Prefer Espresso/UI Automator or app-owned test hooks over hard-coded screen coordinates.
- **Phase 3 — M4/M5:** integrate emulator install/launch and feature assertions into the Vite/Capacitor and Flutter workflows, with their own package IDs and APK paths.
- **Phase 4 — framework adapter:** define a shared test contract so each framework fixture supplies APK path, expected application ID, launch strategy, and feature assertions. Add future frameworks only when their fixture-specific tests exist.
- **Phase 5 — failure-to-fix loop:** retain the failing APK identity, source commit, run ID, screenshot, Logcat, and test report; diagnose the root cause; fix in a focused PR; rebuild and rerun against the new exact commit.

## Evidence and result labels

Record each run with:

- source commit and workflow SHA;
- workflow run ID and attempt;
- fixture/framework;
- Android version/API/ABI and emulator image;
- package ID, APK size, and APK SHA-256;
- install result, launch result, process-stability result, and feature-interaction result as separate fields;
- screenshot, Logcat, emulator boot log, and failure diagnostics.

Use `CI PASS`, `EMULATOR DEVICE PASS`, and `REAL DEVICE PASS` as separate statuses. Missing or skipped checks remain `NOT RUN` or `BLOCKED`; they must not be converted to PASS. Emulator success does not replace physical-device tests for hardware-dependent features such as camera access, sensors, Bluetooth, or device-specific behavior.

## Reliability and safety

- Run on hosted Ubuntu; do not require Android SDK/Emulator installation in Termux.
- Use a fixed Android API/system image for reproducibility and record its identity.
- Validate package ID and checksum before treating a test result as evidence for an APK.
- Upload diagnostic evidence even when emulator tests fail.
- Do not suppress failed assertions or claim feature-interaction coverage from a successful install/launch alone.
- Keep CI-generated artifacts tied to their exact source commit and workflow run; never reuse an older APK as evidence for a newer commit.

## Acceptance for this initial PR

The initial change is a pilot for M6. It is accepted only when the exact-head CI run proves the emulator boots, the expected APK installs and launches, the process remains alive, and evidence artifacts are uploaded. Project-wide framework coverage remains incomplete until the follow-up phases above pass.
