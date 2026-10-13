# Framework Source ZIP Contract

**Status:** Normative input contract for framework-specific source ZIP fixtures  
**Applies to:** Project generation, ZIP packaging, project detection, build-strategy selection, and compatibility testing  
**Governance:** This document defines fixture input requirements; it does not change M1–M12 milestone scope. `ROADMAP.md` remains the sole roadmap.

## 1. Core rule

A source ZIP is a reproducible project source package, not an APK and not a prebuilt build workspace. Each fixture must be generated from a declared template or an explicitly versioned project source, packaged with a deterministic allowlist/exclusion policy, then validated before the Builder receives it.

For every fixture, record:

- fixture ID and framework/strategy;
- generator/template name and exact version or source commit;
- generation command and environment/toolchain versions;
- project package/application ID and declared entry point;
- included required files and excluded generated/cache files;
- ZIP filename, byte size, SHA-256, and archive-integrity result;
- expected detector result and expected build strategy;
- expected APK/runtime checks and known limitations.

Do not mark a fixture supported just because a ZIP can be created or detected. Do not silently generate missing source files during detection. Any framework-specific scaffold generation must be an explicit, versioned preparation step and its output must be included in the evidence.

## 2. Common ZIP packaging requirements

1. ZIP paths are relative to one project root; avoid an extra wrapper directory unless the fixture explicitly tests wrapper-directory detection.
2. Include source, manifests/configuration, lockfiles when available, required local assets, and required native project files for the selected build strategy.
3. Exclude dependency caches and transient outputs: `node_modules/`, `.gradle/`, `build/`, `.dart_tool/`, `.expo/`, `.git/`, OS metadata, secrets, signing keys, local SDK paths, and machine-specific absolute paths.
4. Do not exclude files required for an offline/native build. In particular, for bare React Native, include the Android Gradle project and Gradle wrapper files.
5. Never include credentials, API tokens, private signing material, personal data, or developer-local environment files. Use a safe `.env.example` only where applicable.
6. Verify archive integrity, path safety, expected required files, and absence of forbidden secret/cache patterns before build.
7. Keep generation reproducible: pin framework/CLI/template versions and dependencies; commit lockfiles; do not use an unpinned `latest` template in a release fixture.
8. A missing required file is a fixture failure or a deterministic unsupported result—not a reason to fabricate a successful build.

## 3. Framework-specific source ZIP contracts

### RN-1 — Minimal bare React Native

**Target:** Existing M6 baseline, then first compatibility fixture.

**Required inputs:**
- `package.json` with exact `react`, `react-native`, and scripts;
- lockfile for the chosen package manager (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`);
- app entry (`index.js` or `index.ts`) registering the app with `AppRegistry.registerComponent`;
- root component (`App.js`, `App.tsx`, or explicitly configured equivalent);
- `app.json` or equivalent app registration metadata;
- complete `android/` project including `gradlew`, Gradle wrapper JAR/properties, settings/build files, app Gradle file, manifest, and required native source/resources;
- any Babel/Metro configuration required by the pinned RN version.

**Exclude:** `node_modules/`, Gradle caches, generated `android/**/build/`, Metro caches, and local SDK paths.

**Validation:** detector says bare React Native; expected Android strategy is selected; JS bundle is embedded in APK; APK archive/manifest and bundle pass; then install, launch, render, and counter/button interaction pass on device.

### RN-2 — React Native navigation / multiple screens

**Required inputs:** RN-1 files plus navigation package dependencies and lockfile; navigation entry/routes/screens; required linking/navigation configuration; and all referenced local icons/assets.

**Packaging rule:** Do not omit navigation packages from the manifest/lockfile or source screens. Native setup required by the pinned navigation libraries must be present in `android/` or performed by a named, reproducible preparation step.

**Validation:** build APK; install/launch; navigate forward and back between at least two screens; verify selected screen content and state; exercise Android back behavior if supported by the chosen navigation setup.

### RN-3 — Local images, assets, and fonts

**Required inputs:** RN-1 files plus actual image/font files, source references, and required asset declarations/configuration. Preserve case-sensitive relative paths.

**Packaging rule:** Include original assets referenced by source and any native resource/font files required by the chosen integration. Exclude only generated asset intermediates/caches.

**Validation:** assert every referenced test asset exists in the ZIP; verify expected assets are present in the APK/bundle or native resources as appropriate; on device confirm image and font render correctly rather than relying on archive presence alone.

### RN-4 — Persistent local storage

**Required inputs:** RN-1 files plus storage package dependency, pinned lockfile, application code that writes/reads a known test value, and any required Android configuration.

**Packaging rule:** Include the real storage integration and its platform setup; do not replace persistence with in-memory state or a mock.

**Validation:** write a unique test value, close/force-stop the app, relaunch, and verify the value persists. Also test clearing/reset behavior if the fixture implements it. Record the storage library/version.

### RN-5 — Native module / Android configuration

**Required inputs:** RN-1 files plus a deliberately selected native module, exact dependency and lockfile, required Android Gradle/manifest/resource configuration, and any module source that is part of the project.

**Packaging rule:** The fixture must exercise a real native integration. Declare whether the module is autolinked or needs manual setup. Never include secrets or local machine-specific SDK paths.

**Validation:** check native dependency/configuration is detected, Android build succeeds, APK installs and launches, and an interaction invokes the native capability and returns a verifiable result. Record module version and any unsupported configuration.

### RN-6 — React Native and package-manager compatibility

RN-6 is a matrix of separate fixtures, not one ZIP with ambiguous versions. Each matrix row must pin:
- exact React Native and React versions;
- exact CLI/template version;
- package manager and version;
- lockfile type and hash;
- Node.js, JDK, Android Gradle Plugin, Gradle, and Android SDK versions;
- architecture/Hermes settings where applicable.

Begin with a version combination already known to build, then change one compatibility dimension per fixture. Do not change React Native version and package manager simultaneously if the goal is to identify the cause of a failure.

**Validation:** repeat detection, build, APK validation, install, launch, and an app-specific interaction for each supported matrix row. Record unsupported combinations with exact diagnostics; do not extrapolate support across untested versions.

### Native Android — Kotlin / Java

**Required inputs:** Gradle wrapper files, settings and root/app build scripts, Android manifest, source tree (`src/main/java/` or `src/main/kotlin/`), resources, and required Gradle properties/version catalog. Include wrapper scripts and wrapper JAR/properties.

**Exclude:** `.gradle/`, module `build/`, local.properties with local SDK paths, keystores, and generated outputs.

**Validation:** detector identifies native Android and language/build variant; assemble APK; inspect manifest/ABI as applicable; install, launch, and test a declared native UI interaction.

### Plain web — static HTML/CSS/JavaScript

**Required inputs:** `index.html` (or an explicitly configured entry file), referenced CSS/JS, images/fonts, and all local files needed at runtime. Include a minimal manifest/config only if the selected web-to-Android strategy requires it.

**Exclude:** dependency caches, unrelated source archives, server secrets, and local build outputs.

**Validation:** detector distinguishes static web from a framework build; all local references resolve; selected Android wrapper strategy is explicit; APK renders the page offline if offline operation is claimed, and representative links/forms/buttons work.

### React / Vite web

**Required inputs:** `package.json`, pinned lockfile, `index.html`, source entry (typically `src/main.*`), application source, Vite config if present, and referenced public/source assets.

**Exclude:** `node_modules/`, `dist/` unless a separate prebuilt-static fixture explicitly tests that path, Vite caches, and local environment secrets.

**Validation:** detector identifies the source framework; run the pinned production build; verify output directory and asset paths; package the built web output through the declared Android strategy; install/launch and test app navigation/interactions. A successful Vite web build alone is not an APK pass.

### Capacitor

**Required inputs:** web source and package manifest/lockfile; Capacitor core and Android platform dependencies; `capacitor.config.*`; and the `android/` native project if the chosen Builder strategy expects an existing platform project. If Android platform files are generated during preparation, record the exact Capacitor CLI/platform versions and reproducible generation command.

**Exclude:** `node_modules/`, generated web output when reproducibly rebuilt from included source, caches, local SDK paths, and secrets.

**Validation:** declare whether input is source-first or includes generated Android platform files; sync/copy web assets; build native Android project; inspect embedded assets; install/launch and test a web-to-native interaction. Never treat a browser-only preview as Capacitor APK validation.

### Flutter

**Required inputs:** `pubspec.yaml`, pinned `pubspec.lock`, `lib/main.dart`, referenced assets/fonts and their declarations, and complete `android/` platform project with Gradle wrapper/configuration. Include other source/configuration required by the selected Flutter channel/version.

**Exclude:** `.dart_tool/`, `build/`, Gradle caches, local SDK paths, secrets, and generated ephemeral plugin intermediates where they can be reproduced safely.

**Validation:** pin Flutter/Dart versions; run dependency resolution under the declared policy; build APK; inspect APK; install/launch; test a UI interaction and any declared asset/storage behavior.

### Expo — future M7 only, not enabled by this contract

Expo source ZIPs must not enter the current supported build pipeline merely because a detector recognizes `app.json` or an Expo dependency. A future M7-specific contract must distinguish managed/prebuild-capable projects from remote-only/EAS-dependent workflows, pin Expo SDK/CLI and package-manager versions, define native generation policy, and require real APK plus device validation. Until that separate decision and acceptance criteria are approved, Expo is **not in scope for RN-1–RN-6**.

### Game engines and other frameworks — future, explicit strategies only

Godot, Unity, and other frameworks require separate contracts that specify an Android-exportable source/project format, pinned engine/export-template version, required export templates/toolchains, Android project/output expectations, and device acceptance tests. Do not classify arbitrary game source as buildable if the required Android export is missing. These frameworks are not added to the current pipeline by this document.

## 4. Fixture acceptance record template

For each fixture, add one record to the compatibility test matrix with these fields:

| Field | Required value |
|---|---|
| Fixture ID | Stable ID such as `RN-1-minimal-rn0769` |
| Framework/strategy | Exact detected type and selected build strategy |
| Generator/source | Template, version, command, source commit |
| ZIP evidence | Filename, byte size, SHA-256, archive-integrity result |
| Source validation | Required files present; excluded-file/secret scan |
| Toolchain | Node, package manager, framework, JDK, Gradle/AGP, SDK versions as applicable |
| Build evidence | CI run URL, commit SHA, command, exit status, logs |
| APK evidence | Artifact URL, size, SHA-256, manifest/package, embedded bundle/assets |
| Device evidence | Device/Android version; install, launch, render, interaction; screenshots/logs if available |
| Result | PASS / FAIL / BLOCKED / NOT RUN |
| Limitations | Exact known unsupported features/versions |

A fixture is PASS only when all of its required build and runtime checks pass. CI-only success is not a device PASS. User-reported device results must be labeled as such unless logs/screenshots or automated device-test evidence are attached.

## 5. Change-control boundary

This contract defines the shape of source ZIP fixtures and evidence. It does not claim the Builder already supports every listed framework. Implementation and support status must be established separately by tests and recorded results. Do not add Expo or any other new framework to the production pipeline without an explicit scope decision and passing acceptance evidence.
