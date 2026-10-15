# M6 React Native Android Acceptance Report

**Status: PASS — exact-main acceptance for the tracked React Native fixture only**  
**Recorded:** 2026-10-15  
**Scope:** The tracked React Native Android fixture built through the Universal ZIP-to-APK Builder. This result is not a claim that every React Native project is compatible.

## Canonical source and CI evidence

- Canonical source ref: `refs/heads/main`
- Exact source commit: `52e550907cb8da345c4d19b74611d7b9945479ef` (PR #61 merge commit)
- GitHub Actions: [Ubuntu M6 Build Test — run 38656253893](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38656253893)
- CI job: `m6-build-test` — completed successfully
- Artifact: `m6-build-apk`, artifact ID `11937356306`
- Artifact ZIP digest: `sha256:78792c97497958c4f89e08994614587ce8afe83ad0bc78b84c0b67d5f8ec87c8` (this identifies the uploaded ZIP, not the APK)
- APK path: `.workspace/m6-react-native-direct-integration/android/app/build/outputs/apk/debug/app-debug.apk`
- APK size: `109260611` bytes
- APK SHA-256: `05c864b61fec5ce89077323ae52627d87db9fc1972f12e87b507f2c1357f8688`
- APK package ID: `com.builder.m6reactnative`

CI completed the React Native integration build, APK structural checks, manifest/package checks, embedded JS bundle and native runtime checks, checksum generation, and provenance upload.

## G1–G13 acceptance checklist

| Gate | Criterion | Result | Evidence |
|---|---|---|---|
| G1 | Project/framework detection | PASS | Exact-main React Native pipeline test/build |
| G2 | Official React Native Android project path | PASS | Tracked Android fixture used by CI |
| G3 | Dependency installation/resolution | PASS | Frozen pnpm install and staged dependency preparation passed |
| G4 | JDK 17 toolchain | PASS | CI JDK 17 setup completed |
| G5 | Gradle/native build toolchain | PASS | Native build completed and produced APK |
| G6 | Metro / JavaScript bundle | PASS | APK structural test found `assets/index.android.bundle` |
| G7 | Native compilation | PASS | APK build completed successfully |
| G8 | APK structure, manifest, package identity, runtime payload | PASS | ZIP integrity, manifest, package ID, JS bundle, Hermes and React Native native libraries checked |
| G9 | APK installation on phone | PASS — user-confirmed | User confirmed this exact-main APK installed and worked |
| G10 | App launch | PASS — user-confirmed | User confirmed the app opened and worked |
| G11 | React Native initialization | PASS — user-confirmed | App reached the React Native UI |
| G12 | UI rendering | PASS — user-confirmed | User confirmed the UI was visible |
| G13 | Core interaction (Taps Counter) | PASS — user-confirmed | User confirmed the interaction worked |

The separate manual device record is [Issue #62](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/62).

## Evidence boundaries

- G1–G8 are supported by the exact-commit CI build and test/artifact outputs.
- G9–G13 are user-reported physical-device observations. No screenshot, logcat capture, or machine-generated device report is attached.
- The workflow provenance field `real_device_acceptance: NOT_RUN` remains correct: CI did not control the user's phone. The device result is recorded separately in Issue #62.
- This acceptance is tied to the exact commit and APK above. It does not imply universal React Native compatibility or acceptance of other project ZIPs.

## Remaining work before M7

1. Continue with [Issue #41 — Build and validate isolated React Native demo ZIP](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/41) as a separate realistic fixture.
2. Compare existing unmerged Community Chat work (PRs #43 and #44) before implementing, because their branches target historical/non-main bases. Do not merge those branches wholesale or duplicate their work.
3. Expand the React Native compatibility matrix with distinct reproducible fixtures: minimal bare RN; multi-screen/navigation; local assets/fonts; persistent local storage; native module requiring Android configuration; and a different supported RN/package-manager combination.
4. For each fixture, record source/ZIP identity, toolchain, build result, APK checksum, install/launch, visible UI and meaningful interaction. Explicitly record unsupported cases.
5. Keep Expo and other new frameworks out of the current pipeline. M7 requires a separate compatibility-matrix review and goal-alignment decision; this single-fixture PASS alone does not authorize it.
