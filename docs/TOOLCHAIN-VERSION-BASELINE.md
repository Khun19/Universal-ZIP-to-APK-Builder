# Android Build Toolchain Version Baseline and Upgrade Gates

**Baseline date:** 2026-10-21  
**Repository:** `Khun19/Universal-ZIP-to-APK-Builder`  
**Baseline source commit:** `231660b04fd8160b622e645bbe2dad487b5ecbc9`  
**Purpose:** Record verified toolchain facts, gaps, and controlled upgrade requirements. This document does not declare new framework support or authorize broad version upgrades.

## Verified repository baseline

| Area | Verified value | Evidence / limitation | Decision |
|---|---|---|---|
| Canonical build executor | GitHub Actions on `ubuntu-24.04` | M6 workflow | Keep as default; local Termux remains recovery-only |
| GitHub Actions JavaScript runtime | Node 24-compatible action releases | M4/M5/M6 workflows use `actions/checkout@v7`, `actions/setup-node@v7`, `actions/setup-java@v6`, `android-actions/setup-android@v4`, `pnpm/action-setup@v6`, and `actions/upload-artifact@v7` | Keep actions on supported Node 24 releases; do not confuse action runtime with the app build's pinned Node 22.13.0 |
| M6 Java | Temurin JDK 17, major version pinned; patch resolved by runner | `.github/workflows/ubuntu-m6-build-test.yml` uses `actions/setup-java@v6`, `java-version: 17` | Keep Java 17 for current M6 baseline; record actual `java -version` |
| M6 Node.js | `22.13.0` | Explicit `actions/setup-node@v7` input; this pins the application build runtime to Node 22 independently of the action's Node 24 runtime | Keep pinned for reproducibility; update only with regression evidence |
| M6 pnpm | `11.23.0` | Explicit `pnpm/action-setup@v6`, Node 24-compatible action runtime | Keep pinned until a separate dependency/tooling review |
| M6 Android platform | `platforms;android-34` | Explicit `sdkmanager` package list | Do not replace API 34 baseline; add a separate API-level compatibility lane if needed |
| M6 Android Build Tools | `34.0.0` | Explicit `sdkmanager` package list and PATH | Do not upgrade without framework/build evidence |
| M6 NDK | `25.2.9519653` and `26.1.10909125` | Both explicitly installed and verified by workflow | Preserve both until fixture evidence identifies which versions are required |
| M6 CMake | `3.22.1` | Explicitly installed and checked | Preserve baseline |
| React Native fixture | `0.76.9` | `tests/fixtures/react-native-project/package.json` | Keep as regression baseline |
| React version in M6 fixture | `18.3.1` | Same fixture package manifest | Treat as part of the pinned fixture, not an independent floating dependency |
| Android Gradle Plugin in M6 fixture | `8.7.3` | `tests/fixtures/react-native-project/android/build.gradle` | Keep for current fixture until a separate candidate fixture proves compatibility |
| Gradle Wrapper committed in M6 fixture | Not present in tracked fixture tree at baseline | Recursive Git tree contains no `gradle-wrapper.properties` under the fixture | **Resolved Gradle version is unknown from tracked fixture alone.** Capture generated workspace wrapper details during CI before deciding on an upgrade |
| Flutter fixture SDK | Workflow pins Flutter `3.47.4` on stable channel | `.github/workflows/m5-flutter-build-test.yml` | Record actual resolved version; test upgrades independently |
| Flutter Android platform | API 34 / Build Tools 34.0.0 | M5 workflow | Preserve baseline; test new API levels in a separate lane |
| Capacitor | Adapter/build path exists; this baseline review did not verify a pinned, reproducible Capacitor fixture/toolchain | Requires targeted fixture/path review | Do not claim compatibility or upgrade status without evidence |
| Expo | Not part of the M6 acceptance baseline | No Expo SDK pinned by the inspected M6 fixture | Ecosystem watch only; this document does not authorize an Expo roadmap change |
| Termux | Not part of canonical CI build | Roadmap says local Termux is optional recovery/development | No routine local Android SDK installation or upgrade required |

## Version-upgrade decisions

### P0 — Capture exact resolved Gradle version and security status

1. Find the wrapper generated for the M6 build workspace after the integration test runs.
2. Record `distributionUrl`, the output of `./gradlew --version` when the wrapper exists, and the Android Gradle Plugin version from the generated project.
3. If a wrapper is absent, record that explicitly and identify the actual Gradle invocation/source before choosing a version.
4. Compare the resolved version with the official Gradle security advisories and the matching AGP compatibility requirements.
5. Do not force Gradle 9.x onto the RN 0.76.9 / AGP 8.7.3 baseline without a passing, exact-commit integration build.

### P1 — Keep the proven M6 baseline and add candidate lanes

- Preserve RN 0.76.9 + AGP 8.7.3 as the current regression fixture.
- Any newer React Native candidate must have its own pinned fixture, lockfile, toolchain declaration, CI build, APK validation, and (where required) exact-artifact device acceptance.
- Do not infer that a new RN release requires an immediate project-wide migration solely because it is the ecosystem latest.
- Test newer Android API levels in a separate workflow/fixture before changing the baseline API level.

### P2 — Patch-level runtime and runner updates

- Record actual Java, Node, pnpm, Flutter, SDK package and runner versions in CI artifacts/logs.
- Prefer supported security patch updates that preserve the required major/minor compatibility.
- GitHub Actions no longer supports Node 20 as of 2026-09-23. This branch migrates M4/M5/M6 workflow actions to Node 24-compatible releases while retaining the application's pinned Node 22.13.0 build runtime. Verify exact-head CI after action upgrades; do not combine unrelated framework upgrades with this maintenance.

### P3 — Flutter, Capacitor, Expo, and Termux

- Flutter: keep the currently pinned M5 fixture and use a separate candidate workflow for SDK changes.
- Capacitor: first establish a tracked fixture and exact toolchain evidence; until then mark compatibility as unverified rather than supported.
- Expo: monitor official release notes as ecosystem news only. Do not add Expo to the project roadmap based on this watch alone.
- Termux: retain minimal recovery instructions; do not restore a large local Android SDK as part of routine builds.

## Acceptance gates for every upgrade PR

- [ ] Exact base and candidate commit SHAs are recorded.
- [ ] Official release notes / compatibility matrix / security advisory is linked.
- [ ] The old accepted fixture remains unchanged or passes its regression test.
- [ ] The candidate framework and its lockfile/toolchain are pinned.
- [ ] CI reports the actual resolved tool versions, not only requested major versions.
- [ ] The build uses the exact candidate commit and generates a real APK.
- [ ] APK path, size, package identity, SHA-256, and provenance are validated.
- [ ] Device install/launch/UI acceptance is recorded when required; CI success is not substituted for device acceptance.
- [ ] Risks, rollback path, and any unsupported combinations are documented.
- [ ] No roadmap or support claim changes without evidence and explicit review.

## Official reference links

- [Gradle releases](https://gradle.org/releases/)
- [Gradle compatibility matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Android Gradle Plugin release notes](https://developer.android.com/build/releases/gradle-plugin)
- [Android Studio / SDK release notes](https://developer.android.com/studio/releases)
- [React Native releases](https://reactnative.dev/blog)
- [Flutter release notes](https://docs.flutter.dev/release/release-notes)
- [Capacitor documentation](https://capacitorjs.com/docs)
- [Expo SDK documentation](https://docs.expo.dev/versions/latest/)

## Status

This is a version baseline and gated-upgrade plan. It is not proof that newer framework versions are supported, that a security vulnerability is present in the current resolved build, or that an upgrade has passed CI/device acceptance.
