# Universal ZIP-to-APK Builder — Test Matrix

This document is the acceptance contract for build compatibility. A test is only PASS when the stated evidence exists; command exit success alone is insufficient for runtime-sensitive tests.

## Status Vocabulary

- **PASS** — verified with evidence
- **FAIL** — reproduced failure
- **BLOCKED** — cannot run because a required environment/device/tool is unavailable
- **NOT RUN** — not executed yet

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
| PWA | Plugin/runtime | Tracked Vite PWA fixture builds with a manifest, service worker, registration script, icon, and bundled JavaScript asset |
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
