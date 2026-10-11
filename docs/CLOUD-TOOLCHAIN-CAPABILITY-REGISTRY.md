# Cloud Toolchain Capability Registry

- Status: **PROPOSED — repository implementation/acceptance verification required**
- Scope: cloud-side replacement for toolchains that are missing, unsupported, or impractical on the Android phone
- Initial cloud runner: GitHub-hosted `ubuntu-24.04` x64
- Policy: **Local-first only when the exact local path is capability-checked and verified; otherwise route to a supported cloud adapter.**
- This registry is not a claim that every listed framework already builds successfully in this repository.

## 1. Evidence levels

Do not collapse these statuses into one “supported” flag:

| Status | Meaning |
|---|---|
| `CANDIDATE` | The toolchain/build approach is technically plausible; this repository has not yet proved it. |
| `TOOLCHAIN_VERIFIED` | The pinned runner image and required tool versions were recorded by a reproducible CI job. |
| `APK_BUILD_VERIFIED` | A repository fixture built a real APK and APK structural/manifest checks passed. |
| `DEVICE_RUNTIME_VERIFIED` | The resulting APK installed, launched, rendered its expected UI, and passed required interactions on a real device. |
| `BLOCKED` | A required runner, credential, licence, dependency, device, or service is unavailable. |
| `UNSUPPORTED` | No maintained build adapter or acceptable build path currently exists. |

A toolchain existing on a hosted runner is not proof that a framework project builds. A successful build is not proof of device runtime correctness.

## 2. Initial cloud runner and common toolchains

Use a pinned runner label (initially `ubuntu-24.04`) instead of `ubuntu-latest` for reproducible milestone evidence. Record the actual runner image/software manifest from each run.

| Capability | Cloud toolchain / preparation | Initial use | Current registry status |
|---|---|---|---|
| Linux build environment | GitHub-hosted Ubuntu x64 runner | Default Android-compatible cloud job | `CANDIDATE` until recorded by this repo's workflow |
| JDK | Explicitly install/pin a compatible Temurin JDK via `actions/setup-java` | Android Gradle builds; JDK 17 for current M6 fixture unless its wrapper/plugin requirements say otherwise | `CANDIDATE` |
| Android SDK command-line tools | Install with `android-actions/setup-android`; accept required licenses | Android platform/build-tools/platform-tools | `CANDIDATE` |
| Android SDK Platform + Build Tools | Install exact `compileSdk`/platform and build-tools required by the project | Native Android, React Native, Flutter, Capacitor | `CANDIDATE` |
| Android NDK + CMake/Ninja | Install explicit NDK/CMake versions when native modules require them | React Native native dependencies and C/C++ projects | `CANDIDATE` |
| Gradle | Use the project's checked-in Gradle Wrapper; validate wrapper distribution/checksum and plugin compatibility | All Gradle-based Android adapters | `CANDIDATE` |
| Node.js + package manager | Pin Node LTS and pnpm/npm/yarn from project metadata/lockfile | React Native, Expo prebuild, Capacitor/Ionic/Cordova, web projects | `CANDIDATE` |
| Git + archive utilities | Runner tools plus project-pinned dependencies | Fetch source, safely handle archives, capture build evidence | `CANDIDATE` |
| APK validation utilities | Android SDK tools and/or repository validators | ZIP/APK integrity, manifest/package checks, SHA-256 | `CANDIDATE` |

**Implementation rule:** Do not assume the runner's preinstalled Android SDK version matches the project's `compileSdk`, build-tools, NDK, Java, or Gradle requirements. Install or verify exact versions and save the resolved versions in the build evidence.

## 3. Framework adapters

| Project type | Cloud build path | Required components / constraints | Initial decision |
|---|---|---|---|
| Native Android (Kotlin/Java) | Official Gradle Wrapper build | Compatible JDK, Android SDK platform/build-tools, Gradle/plugin versions; NDK if needed | Candidate adapter |
| React Native CLI | Official Android Gradle build | Node + lockfile package manager, JDK, SDK, Gradle; Hermes/codegen/native dependencies as declared by project | Candidate adapter; current M6 acceptance gates remain authoritative |
| Expo | Determine managed/prebuild/native requirements first; either local CI prebuild + Android Gradle build or an explicitly configured EAS Build integration | Expo SDK compatibility, Node/package lock, Android toolchain or EAS account/project credentials; secrets must not enter ZIP, logs, or APK | Candidate; do not claim support until a fixture passes |
| Flutter | Pinned Flutter SDK + official Flutter Android build | Compatible JDK, Android SDK, Gradle wrapper, Flutter/Dart version and plugins | Candidate adapter |
| Capacitor / Ionic / Cordova | Install JS dependencies, run the framework's native sync/prepare step, then build generated Android project with Gradle | Node/package manager, framework CLI/plugins, JDK, Android SDK and Gradle | Candidate adapter |
| React/Vite/PWA/static web | Build web assets, then use an explicit supported Android wrapper (normally Capacitor or an existing native shell) | Node/package manager plus Android wrapper toolchain | Web build alone is **not** an APK build |
| C/C++ Android project | Project's official Gradle/CMake/NDK build | Pinned NDK, CMake/Ninja, SDK, JDK and native dependencies | Candidate adapter |
| Godot | Godot headless/export CLI plus matching Android export templates and Android toolchain | Engine version and export templates must match; signing/export settings required | Future candidate; no support claim yet |
| Unity | Unity Editor with Android Build Support modules and an explicitly supported licensing method | Large runner/storage requirements, matching editor version, Android modules and license/credentials | Future candidate; verify licensing and runner feasibility before implementation |
| Unreal Engine | Dedicated compatible engine installation/build image and Android toolchain | Very large dependencies, version-specific SDK/NDK/JDK requirements and potentially custom runner | Not in initial hosted-runner scope; `UNSUPPORTED` until a maintained adapter exists |
| Unknown / unsupported framework | No automatic generic substitution | Must not silently convert native projects into a WebView wrapper or fake APK | `UNSUPPORTED` or `BLOCKED` with reason |

## 4. Routing contract

For each incoming ZIP:

1. Run ZIP security checks and safe extraction.
2. Detect framework and project root using evidence (manifest files, lockfiles, Gradle files, framework config); retain ambiguity and confidence.
3. Derive required toolchains and versions from project configuration.
4. Check local capability against a verified local capability record. A missing Android SDK/JDK/NDK or unsupported host/architecture makes that local strategy ineligible; it does not by itself mean the project is unsupported.
5. Select cloud only if a compatible, maintained cloud adapter exists and required runner/service credentials are available.
6. If neither path is eligible, stop with `BLOCKED` or `UNSUPPORTED`; do not guess or silently change build semantics.
7. Run the framework's real build flow in an isolated, resource-limited runner. Treat project scripts and ZIP contents as untrusted code.
8. Discover and validate the actual APK; capture its byte size and SHA-256.
9. Return logs, toolchain manifest, selected adapter, source revision/input digest, APK validation result, and any limitations.
10. Keep install/launch/UI/interaction evidence as a separate real-device acceptance stage.

## 5. Security and operational requirements

- Never expose cloud credentials, signing secrets, or service tokens to project scripts or include them in ZIPs, logs, artifacts, or APKs.
- Do not run untrusted ZIP build scripts on a privileged/self-hosted runner.
- Prefer ephemeral GitHub-hosted runners, least-privilege workflow permissions, pinned Actions revisions, timeouts, disk/CPU/memory limits, and artifact retention limits.
- Treat uploaded ZIPs as sensitive user data: document retention, access, deletion, and whether external build services receive the source.
- Signing policy must be explicit. Debug APKs and release-signed APKs are different outputs; never claim a release signature when only a debug build was produced.
- Cloud availability, quota, network access, licences, and third-party service outages can block a build. Cloud is a replacement environment, not a guarantee that every project is buildable.

## 6. Required repository evidence before promotion

A candidate becomes `TOOLCHAIN_VERIFIED` only after CI logs the runner image, OS/architecture, Java, Android SDK/platform/build-tools, NDK/CMake (when used), Node/package manager, framework/engine version, Gradle wrapper version, and relevant plugin versions.

A framework becomes `APK_BUILD_VERIFIED` only after a versioned fixture and deterministic adapter produce a real APK, validate its structure/manifest/package identity, and record SHA-256.

A framework becomes `DEVICE_RUNTIME_VERIFIED` only after the required real-device install, launch, UI rendering, and interaction tests pass. Keep each framework's status separate; success for one fixture does not establish universal compatibility.

## 7. Official references

- GitHub-hosted runner images and included-software inventory: https://github.com/actions/runner-images
- GitHub-hosted runner specifications: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- Gradle on GitHub Actions and wrapper guidance: https://docs.gradle.org/current/userguide/github-actions.html
- Android SDK setup action: https://github.com/android-actions/setup-android
- Java setup action: https://github.com/actions/setup-java
- Flutter Android deployment/build documentation: https://docs.flutter.dev/deployment/android
- Expo EAS Build documentation: https://docs.expo.dev/build/introduction/
- Capacitor Android documentation: https://capacitorjs.com/docs/android
- React Native environment setup: https://reactnative.dev/docs/set-up-your-environment

These links describe upstream tools/build approaches; they are not repository acceptance evidence.
