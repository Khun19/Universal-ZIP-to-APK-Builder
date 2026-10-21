# Android Emulator Requirements and Installation Plan

Status: implementation contract for the draft Android Emulator CI workflow. This document is not evidence that a device boot or APK test has passed.

## Goal

Use a reproducible Android Virtual Device (AVD) on GitHub Actions Ubuntu to test APKs produced by the real Universal ZIP-to-APK Builder CLI. The test must establish that the exact candidate APK can be installed, launched, and exercised, and must retain diagnostic evidence. Creating an AVD or compiling an APK alone is not runtime acceptance.

## Host and toolchain requirements

| Area | Requirement | Validation evidence |
|---|---|---|
| Runner | Ubuntu 24.04 GitHub-hosted runner | Runner image and OS details in job log |
| Java | JDK 17 for the current React Native fixture | `java -version` |
| Node.js | Pinned Node 22.13.0 for the current Builder/RN fixture | `node --version` |
| pnpm | Pinned pnpm 11.23.0 and frozen lockfile | `pnpm --version`, dependency install result |
| Android SDK CLI | Android command-line tools revision 22.0 (build 15859902) | `sdkmanager --version`, installed package list |
| Platform tools | `platform-tools` including `adb` | `adb version` |
| Platform/build tools | Android API 35 and Build Tools 35.0.0 for this fixture | `sdkmanager --list_installed` |
| Emulator | Android Emulator package and `google_apis;x86_64` API 35 system image | `emulator -version`, system-image package list |
| Runtime libraries | Ubuntu shared libraries required by the emulator, including `libpulse0`; verify with `ldd` | Saved `ldd` output with no `not found` entries |
| Virtualization | KVM acceleration when available; explicit software fallback otherwise | `emulator -accel-check` output and recorded mode |
| AVD tools | `avdmanager`, `adb`, `aapt`, `zip`, `unzip`, Python 3 | Tool version/command checks |

Use SDK packages and toolchain versions deliberately. Do not depend on whatever Android SDK happens to be preinstalled on the runner. Android command-line tools must be new enough to parse the selected system-image package metadata correctly.

## Installation order

1. Check out the exact pull-request head commit with checkout credentials disabled.
2. Install/select Java and Node, then set up the pinned pnpm version.
3. Set up Android SDK command-line tools and accept the SDK licenses through the supported setup action.
4. Install the emulator's required Linux runtime libraries before invoking the emulator or SDK package manager. Capture `ldd` output and fail early if a required shared library is missing.
5. Install the pinned Android platform, build tools, platform tools, emulator, and API 35 x86_64 Google APIs system image using `sdkmanager`.
6. Add SDK executable directories to the current step's PATH and GitHub Actions PATH. Verify the emulator executable exists and runs.
7. Check host virtualization. Use hardware acceleration only when `emulator -accel-check` succeeds. Otherwise use the documented software-emulation fallback and report the slower mode; do not report acceleration as available just because the emulator executable exists.
8. Install Builder dependencies with the frozen lockfile. Generate/package the known fixture ZIP and build it using the actual Builder CLI, not a separate sample-app build that bypasses Builder.
9. Validate APK structure and identity before starting the AVD.
10. Create a clean AVD, start it headlessly, wait for `sys.boot_completed=1` with a bounded timeout, and save boot diagnostics.
11. Install the exact APK whose SHA-256 was recorded. Launch the package and run the fixture-specific UI assertions.
12. Capture screenshots, UI hierarchy, install/launch output, logcat, emulator console, test result, package ID, source commit, workflow run, and APK SHA-256. Upload diagnostics even on failure.
13. Report each stage separately. If a stage is skipped, blocked, or fails, do not mark the emulator test PASS.

## APK runtime acceptance contract

The following checks are required for a fixture to receive emulator runtime PASS:

- **Identity:** APK exists, is non-empty, passes ZIP integrity validation, contains an Android manifest, and has the expected fixture package ID. Record SHA-256, byte size, source commit and workflow run.
- **Install:** `adb install -r` succeeds for that exact APK; retain the complete command output.
- **Launch:** the package's launchable activity starts; verify the app process and foreground UI rather than trusting the install exit code alone.
- **Startup stability:** inspect logcat for app-specific fatal exceptions, fatal native signals, and process death during the test window.
- **Rendered UI:** save a screenshot and UI hierarchy; assert expected screen text or accessible UI nodes where possible.
- **Interactions:** execute deterministic fixture-specific actions and assert resulting UI state. The current React Native Community Chat fixture targets communities screen, opening a community chat, sending a local test message, and opening the profile screen.
- **Offline/self-contained behavior:** for the current React Native fixture, verify the JS bundle is embedded in the APK so the app does not depend on Metro running on the CI host.
- **Evidence:** write a machine-readable report with PASS/FAIL per assertion and upload the evidence directory using an always-run artifact step.

A command returning exit code 0 is necessary but may not be sufficient for runtime PASS. A missing screenshot, absent UI assertion, wrong package ID, mismatched APK hash, or skipped interaction keeps the test incomplete.

## Framework coverage strategy

The current workflow is an initial proof for the React Native Community Chat fixture only. Do not imply that all generated APK frameworks are covered by this workflow.

Add a framework adapter and a dedicated known-good fixture for each framework before claiming coverage:

| Framework/project type | Runtime checks to add |
|---|---|
| Native Android | Launch activity, main screen, navigation, permissions relevant to fixture |
| Capacitor / plain HTML | WebView opens, local assets load offline, navigation and back behavior |
| React/Vite PWA | Web bundle loads, key routes and controls work, offline behavior only when explicitly supported |
| React Native | Embedded JS bundle, JS initialization, screen rendering, representative interactions |
| Flutter | Flutter engine startup, first frame, route/control interaction |
| Camera/QR fixture | Permission prompt/grant, camera behavior where emulator camera input supports it, scan of deterministic test data; otherwise mark that subtest BLOCKED and require physical-device acceptance |
| Other/new framework | Unsupported until a fixture, adapter, and acceptance assertions exist |

A generic smoke test may run for all APKs, but framework-specific PASS requires the matching assertions. Google APIs images and Google Play images are not interchangeable; choose the image according to the test's actual dependency needs.

## Reliability, timeout, and failure handling

- Use a fresh AVD with wiped data to avoid stale state and cross-test contamination.
- Put a bounded timeout on boot, install, launch, and each UI action. Preserve logs when a timeout occurs.
- Keep the Android API level, ABI, system-image channel, SDK tools, Java, Node, package manager, and fixture versions visible in provenance.
- Separate infrastructure failure (missing libraries, SDK download, no KVM, AVD boot) from APK build failure and app runtime failure.
- On failure, upload emulator console, acceleration check, `adb devices -l`, boot properties, install output, screenshot/UI hierarchy if available, logcat, Builder CLI log, APK identity/checksum if produced, and a structured failure summary.
- Fix the earliest failing layer first; do not diagnose UI behavior when the AVD never booted.
- Re-run the relevant workflow against the new exact head commit after a fix. Evidence from a previous commit is not evidence for the new commit.
- Do not merge the draft PR or claim acceptance while required checks fail or are unrun.

## Security and artifact integrity

- Test only the APK created from the candidate source commit and controlled fixture.
- Never use an APK from an older workflow run to satisfy a newer commit's acceptance.
- Keep source ZIPs and test data synthetic; do not put credentials or personal data in fixtures or logs.
- Do not disable Android security protections or grant broad permissions merely to force a test to pass.
- Treat screenshots and logcat as potentially sensitive build artifacts; limit retention and do not include secrets.
- The provenance record must state source commit, workflow run/attempt, package ID, APK path, byte size, SHA-256, Android API/image/ABI, runtime result, and test scope.
- Emulator PASS is separate from physical-device acceptance. It does not establish compatibility with every real device or ABI.

## Status definitions

- **PASS:** APK identity verified, AVD booted, install/launch/UI assertions passed, and required evidence was uploaded.
- **FAIL:** a required executed assertion failed.
- **BLOCKED:** a prerequisite environment capability or required external device/input was unavailable.
- **NOT RUN:** the check was skipped or has not been executed.
- **PARTIAL:** only explicitly listed assertions passed; never aggregate partial evidence into PASS.

## Official references

- Android SDK command-line tools and emulator package: https://developer.android.com/tools
- Emulator command-line startup, acceleration, and GPU options: https://developer.android.com/studio/run/emulator-commandline
- Android SDK setup action, package installation, and command-line tools versioning: https://github.com/android-actions/setup-android
- Android Emulator runner and Linux/KVM considerations: https://github.com/ReactiveCircus/android-emulator-runner
