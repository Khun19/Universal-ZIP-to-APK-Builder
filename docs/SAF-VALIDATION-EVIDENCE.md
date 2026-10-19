# PR #82 SAF WebView Validation Evidence

## Exact source under validation

- PR: #82 — `fix(security): harden SAF WebView against third-party content`
- Exact source commit: `37b64e9f217daf78cfcb476dc1c0224ee8095937`
- Validation workflow: `.github/workflows/saf-webview-exact-head-validation.yml`
- Generator harness: `scripts/saf-generated-project-validation.ts`

The workflow explicitly checks out the PR #82 source commit and dynamically imports that commit's actual `lib/template.ts`. The validation harness is checked out separately. The generated APK provenance identifies both commits and the workflow run ID.

## What this validation proves

- The actual template function generates the Android wrapper from a deterministic minimal HTML fixture.
- Generated manifest and Java source contain the expected launcher, bridge, CSP/navigation restrictions, WebView settings, and SAF operations.
- The generated Android project compiles with JDK 17, Gradle 8.9, Android SDK 34, and produces a non-empty debug APK.
- APK SHA-256, byte size, exact source commit, validation commit, workflow run ID, fixture identity, and build result are recorded in an artifact provenance JSON and checksum sidecar.

## Explicit limitations

This workflow does **not** claim runtime security acceptance. Source checks do not prove that an untrusted iframe cannot invoke `AndroidDirectoryBridge`, nor do they prove real WebView handling of external navigation or POST/form requests.

The repository currently has no confirmed SAF-specific Android instrumentation test harness. Therefore these remain **NOT RUN** in the generated APK provenance and are still merge-blocking:
- untrusted iframe/bridge isolation in a real Android WebView;
- external navigation and POST/form behavior at runtime;
- SAF directory selection and list/read/create/write/remove regression on Android;
- physical-device install/launch and functional/security acceptance.

Do not treat PR #79's old-source build or unrelated M4/M5/M6 artifacts as PR #82 evidence. Do not merge PR #82 based on this compile workflow alone. Record device results against the exact APK SHA-256 from this workflow artifact before reconsidering the gate.


## Revalidation ledger — 2026-10-19

### Run 39075880745 — FAIL before generation/compile
- Exact PR #82 source SHA configured by the workflow: `37b64e9f217daf78cfcb476dc1c0224ee8095937`.
- Failed step: **Install Android SDK components**.
- Observed log: `yes: standard output: Broken pipe`; the step used `yes | sdkmanager ...` while the shell had `set -euo pipefail`.
- Consequence: the command's upstream `yes` process exited non-zero and pipefail made the step fail. Project generation, generated-source checks, Gradle compilation, APK creation, and provenance steps were skipped.
- Interpretation: this is a workflow/setup failure, not evidence that PR #82's generated source or Android compilation passes or fails.
- Correction present in the current validation-branch workflow: call `sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"` directly, without piping `yes`. The Android setup action is configured to accept SDK licenses.
- Next gate: trigger a fresh run from the corrected validation branch and inspect its exact commit/run. Only if generation and compilation complete should the APK hash/provenance be reviewed.
- Runtime security, SAF runtime behavior, and physical-device acceptance remain **NOT RUN / BLOCKING** until independently evidenced.

### Run 39281921683 — compile PASS, UI fixture limitation found
- Validation branch commit used by the successful run: `0d4cf2553ffde9c3e794e614a33f6c93199c067b`.
- Exact PR #82 source: `37b64e9f217daf78cfcb476dc1c0224ee8095937`.
- SDK setup, generated-source validation, Gradle compilation, APK archive check, provenance generation, and artifact upload all **PASS**.
- APK package ID: `com.builder.safvalidation`.
- APK SHA-256: `016e09627bdaf80e1150f675797d84ab6c62df6088b7ba136b42714c6c3d0485`.
- Artifact: [`pr82-saf-webview-generated-apk`](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/39281921683/artifacts/12202240499). The GitHub artifact ZIP digest is `e7ac07ee16c1c04e3a714ad8f4a21f98bb4c2621cf54e84242beee74fef17905`; this is **not** the APK SHA-256.
- Critical interpretation: the APK was generated from a deliberately minimal HTML fixture whose body was literally just `SAF validation fixture`. Therefore the white screen with one black text line is explained by the test fixture, not proof that the production SAF UI is correct or broken. This artifact was never a production SAF app acceptance build.
- Follow-up correction: validation branch commit `328c2e72d2f2e28d88b401eb2a64ccb0df94a635` replaces the one-line placeholder with a visible SAF test page for directory selection, listing, create, write, and remove operations. A new workflow run must verify this updated fixture before any device test.
- Runtime bridge isolation, external navigation/form behavior, actual SAF operations on device, and physical-device acceptance remain **NOT RUN / BLOCKING**. Do not merge PR #82 based on compile PASS alone.
