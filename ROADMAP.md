# Universal ZIP-to-APK Builder — M1–M12 Roadmap

This roadmap defines the milestone gates for the Universal ZIP-to-APK Builder.

## Core development rule

**One milestone at a time.**

1. Implement only the current milestone.
2. Commit and push the milestone branch to GitHub.
3. Pull the exact branch/commit in Termux.
4. Run the prescribed validation and real-project test ZIP.
5. Record the exact commit SHA, environment, commands, artifact path, APK size, and SHA-256.
6. **PASS:** only then move to the next milestone.
7. **FAIL/BLOCKED:** stay on the same milestone, fix it, push again, and re-test.
8. Never declare a milestone PASS from source inspection alone when the acceptance criteria require a real build.

## Global PASS/FAIL rules

A milestone is **PASS** only when every mandatory acceptance criterion is satisfied.

A milestone is **FAIL** when a mandatory criterion fails.

A milestone is **BLOCKED** when the test cannot be completed because of an external/environmental prerequisite. A BLOCKED milestone is not a PASS.

Every real APK validation must record:

- Git branch
- Git commit SHA
- Test ZIP filename
- Test ZIP SHA-256
- Project type detected
- Toolchain/version used
- Build command
- Build result
- APK path
- APK byte size
- APK SHA-256
- Install/runtime result when required
- Known limitations

---

# M1 — Detection, Security & Build Foundation

## Goal

Establish a canonical project analyzer, safe ZIP extraction/validation, project-type detection, build strategy selection, and APK artifact validation.

## Mandatory acceptance criteria

- ZIP traversal/path escape is rejected.
- Suspicious/unsafe archive entries are rejected according to the security policy.
- Project extraction uses an isolated workspace.
- Canonical analyzer path is used consistently.
- Native Android projects are detected.
- Flutter projects are detected.
- Capacitor projects are detected.
- React/Vite projects are detected.
- Plain Web projects are detected.
- React Native/Expo projects are identified.
- Other supported framework signatures are classified or reported as unsupported.
- Backend/server-only projects are not incorrectly treated as directly buildable Android apps.
- APK validation checks existence, ZIP/APK structure, Android manifest presence, application ID where applicable, and SHA-256.
- Legacy analyzer adapters do not bypass the canonical analyzer.

## Test ZIPs

- Malicious/traversal ZIP fixtures
- Native Android fixture
- React/Vite fixture
- Plain Web fixture
- Capacitor fixture
- Flutter fixture

## Gate

**PASS:** all security, detection, strategy-selection, and APK-validator tests pass.

**FAIL:** any unsafe archive is accepted, required project type is misclassified, or APK validation is unreliable.

---

# M2 — Modern Static Web → APK

## Goal

Build modern static HTML/CSS/JS applications into installable APKs.

## Mandatory acceptance criteria

- ZIP containing a modern static web application is detected as Web.
- HTML/CSS/JS assets are copied into the generated Android wrapper.
- Offline assets work without requiring a development server.
- index.html launches correctly.
- JavaScript executes correctly.
- Android APK is generated successfully.
- APK passes structural validation.
- APK can be copied to Android Download storage.
- APK installs through the phone UI.
- Installed app launches and displays the expected test screen.

## Required test ZIP

M2-Modern-Static-Web-Test.zip

## Gate

**PASS:** Builder-generated APK installs and launches on the phone.

**FAIL:** build succeeds but APK is invalid, cannot install, or runtime content is broken.

---

# M3 — Flutter → APK

## Goal

Support real Flutter projects through the Builder using a real Flutter toolchain.

## Mandatory acceptance criteria

- Flutter project is detected from pubspec.yaml.
- Flutter build strategy is selected.
- Flutter SDK is available to the build worker.
- Android SDK is available to Flutter.
- Java/Gradle compatibility is valid.
- flutter pub get passes.
- flutter analyze passes for the canonical test fixture.
- flutter build apk --debug passes.
- Builder itself invokes the Flutter strategy rather than merely treating the project as generic Web.
- Generated APK exists and passes APK validation.
- APK can be copied to Download and installed.
- Installed Flutter app launches successfully.

## Required test ZIP

M3-Flutter-Real-Test.zip

Expected fixture contents include:

- pubspec.yaml
- lib/main.dart
- android/settings.gradle.kts
- android/app/build.gradle.kts
- Android manifest

## Gate

**Direct Flutter build PASS** is necessary but not sufficient.

**M3 PASS:** direct Flutter build + Builder integration build + APK install/runtime all pass.

---

# M4 — React Native → APK

## Goal

Build a real React Native Android project through the Builder.

## Mandatory acceptance criteria

- React Native project is detected.
- Android project is detected/validated.
- Node dependency installation succeeds.
- Metro/bundling requirements are handled for release/debug APK generation.
- Gradle Android build succeeds.
- APK passes validation.
- APK installs and launches.
- Test screen renders correctly.

## Required test ZIP

M4-React-Native-Real-Test.zip

## Gate

**PASS:** real React Native source ZIP produces an installable, runnable APK through the Builder.

---

# M5 — Expo → APK

## Goal

Support Expo projects that can be converted/built for Android.

## Mandatory acceptance criteria

- Expo project is detected from its configuration.
- Builder determines whether the project is locally buildable.
- Required native Android generation/prebuild step is handled when applicable.
- Dependencies resolve.
- Android build succeeds without relying on an unavailable remote-only service.
- APK passes validation.
- APK installs and launches.

## Required test ZIP

M5-Expo-Real-Test.zip

## Gate

**PASS:** a real supported Expo project is transformed into an Android build and produces a runnable APK.

Unsupported Expo configurations must return a clear diagnostic rather than a false PASS.

---

# M6 — Capacitor / Ionic / Cordova Hardening

## Goal

Make hybrid WebView projects reliable, especially permissions, native plugins, and Android configuration.

## Mandatory acceptance criteria

- Capacitor projects are detected.
- Ionic/Cordova projects are detected where supported.
- Existing Android projects are preserved when valid.
- Web assets are synchronized correctly.
- Android permissions are preserved/generated correctly.
- Runtime permissions required by the test app work.
- Native plugin dependencies resolve.
- Gradle build succeeds.
- APK installs and launches.
- At least one permission/plugin smoke test is executed.

## Required test ZIPs

- M6-Capacitor-Permissions-Test.zip
- M6-Ionic-Real-Test.zip
- M6-Cordova-Real-Test.zip

## Gate

**PASS:** build + install + required native permission/plugin runtime behavior all pass.

A build-only result is not sufficient.

---

# M7 — Native Android Kotlin/Java

## Goal

Support ordinary native Android projects, including Kotlin and Java projects.

## Mandatory acceptance criteria

- Existing Gradle Android project is detected.
- Kotlin Android project builds.
- Java Android project builds.
- Existing application ID is preserved unless explicitly configured otherwise.
- Manifest and resources are preserved.
- Dependencies resolve.
- Debug APK builds successfully.
- APK passes validation.
- APK installs and launches.
- Basic UI/runtime smoke test passes.

## Required test ZIPs

- M7-Native-Kotlin-Real-Test.zip
- M7-Native-Java-Real-Test.zip

## Gate

**PASS:** both required native fixtures produce installable/runnable APKs.

---

# M8 — Additional Web/Hybrid Frameworks

## Goal

Expand framework coverage without weakening detection or safety.

## Target frameworks

- Vue
- Svelte
- Angular
- Next.js
- Nuxt
- Ionic
- Other supported Web/hybrid frameworks with a deterministic Android build path

## Mandatory acceptance criteria

- Each supported framework has a documented detector signature.
- Each supported framework has an explicit build strategy.
- Frameworks that require a server/backend are not falsely reported as standalone APK-ready.
- At least one real fixture per newly supported framework builds successfully.
- APK validation succeeds.
- Runtime smoke testing is completed for supported app fixtures.

## Required test ZIPs

- M8-Vue-Real-Test.zip
- M8-Svelte-Real-Test.zip
- M8-Angular-Real-Test.zip
- M8-Next-Nuxt-Real-Test.zip

## Gate

**PASS:** every framework marked supported has a passing real-project build test.

---

# M9 — Game / Exported Project Support

## Goal

Handle game-engine projects only where the supplied ZIP contains a valid Android-buildable export/project.

## Target frameworks

- Godot
- Unity Android exports/projects
- Other supported game-engine Android exports

## Mandatory acceptance criteria

- Engine/project type is detected.
- Unsupported source-only game projects are clearly rejected or marked unsupported.
- Valid Android exports build successfully.
- Required Android SDK/NDK dependencies are detected.
- APK passes validation.
- Install/runtime smoke test passes for supported fixtures.

## Required test ZIPs

- M9-Godot-Android-Test.zip
- M9-Unity-Android-Test.zip

## Gate

**PASS:** supported exported projects build and run; unsupported projects receive deterministic diagnostics.

---

# M10 — Universal Detection, Fallback & Diagnostics

## Goal

Make the Builder predictable when projects are ambiguous, incomplete, nested, or unsupported.

## Mandatory acceptance criteria

- Multi-project ZIPs are handled deterministically.
- Nested project roots are detected.
- Conflicting framework signatures are reported.
- Unsupported projects receive actionable diagnostics.
- Missing dependency/toolchain errors identify the missing component.
- Build logs identify the selected strategy.
- Build IDs/workspaces do not collide.
- A failed strategy does not silently fall back to an unrelated strategy.
- Artifact paths are deterministic.
- Final response reports PASS/FAIL/BLOCKED accurately.

## Required test ZIPs

- M10-Multi-Project-Test.zip
- M10-Nested-Project-Test.zip
- M10-Unsupported-Project-Test.zip
- M10-Conflicting-Signatures-Test.zip

## Gate

**PASS:** all ambiguity/error fixtures produce deterministic, actionable results and no false-success APKs.

---

# M11 — Production Security, Isolation & Reliability

## Goal

Harden the Builder for hostile or unreliable input and long-running real builds.

## Mandatory acceptance criteria

- ZIP extraction is isolated.
- Path traversal is blocked.
- Symlink/path tricks are handled safely.
- Build workspace isolation is enforced.
- Sensitive files/secrets are not copied into artifacts unintentionally.
- Build timeouts are enforced.
- Child processes are cleaned up after failures.
- Disk/resource limits are enforced or clearly monitored.
- APK SHA-256 is recorded.
- Build failures are reproducible from the same input and environment.
- No successful build is reported when artifact validation fails.

## Required test ZIPs

- M11-ZIP-Traversal-Test.zip
- M11-Symlink-Test.zip
- M11-Secrets-Test.zip
- M11-Large-Archive-Test.zip
- M11-Build-Failure-Recovery-Test.zip

## Gate

**PASS:** all security/reliability tests pass and failure recovery leaves the worker in a usable state.

---

# M12 — Standalone Android Builder Product

## Goal

Turn the validated build engine into a beginner-friendly standalone Android Builder app.

## Target workflow

**Pick ZIP → Analyze → Show detected project type → Build → Progress → APK ready → Install/Share**

## Mandatory acceptance criteria

### UX

- Mobile-first UI.
- Simple ZIP picker.
- Clear project detection result.
- Clear Build button.
- Visible build progress.
- Success/failure state is understandable to beginners.
- APK output can be opened/shared/copied to Download.
- Developer logs are hidden by default.
- Developer Mode can expose detailed logs.
- No unnecessary backend/admin/tooling UI is exposed to normal users.

### Builder integration

- All M1–M11 supported strategies remain available through the product.
- Flutter is integrated.
- React Native/Expo support is integrated where M4/M5 passed.
- Native Android support is integrated.
- Web/hybrid support is integrated.
- Security validation runs before build.

### Reliability

- Repeated builds use isolated workspaces.
- Failed builds do not corrupt subsequent builds.
- APK artifact validation runs before success is shown.
- App reports exact failure reasons when possible.

### Release validation

- Release/debug product APK builds.
- Product APK installs on the target Android device.
- ZIP selection works.
- At least one Web build works end-to-end.
- At least one Flutter build works end-to-end.
- At least one Native Android build works end-to-end.
- Build result can be installed/launched from the phone.

## Required end-to-end fixtures

- M12-Web-E2E-Test.zip
- M12-Flutter-E2E-Test.zip
- M12-Native-E2E-Test.zip

## Gate

**M12 PASS:** the standalone Builder app completes the full ZIP → Analyze → Build → APK → Install/Launch workflow for all mandatory end-to-end fixtures.

---

# GitHub Milestone Workflow

For every milestone:

## 1. Start from the current validated commit

Record:

    git status
    git branch --show-current
    git rev-parse HEAD

Do not begin the next milestone from an unverified working tree.

## 2. Create milestone branch

Recommended naming:

    feat/m<N>-<short-name>

Example:

    feat/m3-flutter-real-build

## 3. Implement only the milestone

Do not mix unrelated refactors or future milestone features into the branch.

## 4. Run local checks

At minimum, run the repository's applicable:

- dependency checks
- typecheck
- unit tests
- analyzer/static checks
- milestone-specific tests
- real build test

## 5. Commit

Commit message format:

    feat(m<N>): <milestone description>

## 6. Push GitHub

Push the milestone branch.

Record:

- branch
- commit SHA
- remote
- push result

## 7. Termux validation

Pull the exact pushed commit.

Run the milestone validation using the specified real test ZIP.

Record:

    git rev-parse HEAD

and compare it with the pushed SHA.

## 8. Artifact validation

For every APK:

- verify file exists
- verify APK structure
- verify manifest
- verify application ID where applicable
- record byte size
- calculate SHA-256
- copy to Android Download when phone validation is required
- install through the phone UI
- launch and smoke-test the app

## 9. Decision gate

### PASS

Only when every mandatory acceptance criterion passes.

Then:

- record milestone report
- tag if desired
- merge according to repository policy
- begin the next milestone

### FAIL

Do not advance.

- capture exact error
- identify root cause
- fix the same milestone
- push a new commit
- repeat validation

### BLOCKED

Do not call it PASS.

- record the missing external/environment prerequisite
- preserve the exact failing state
- resume the same milestone when the blocker is resolved

---

# Milestone Status Table

| Milestone | Area | Required gate |
|---|---|---|
| M1 | Detection + Security Foundation | Analyzer/security/APK tests PASS |
| M2 | Static Web → APK | Build + install + runtime PASS |
| M3 | Flutter → APK | Direct + Builder + install/runtime PASS |
| M4 | React Native | Real build + install/runtime PASS |
| M5 | Expo | Real supported build + install/runtime PASS |
| M6 | Capacitor/Ionic/Cordova | Build + native permission/plugin runtime PASS |
| M7 | Kotlin/Java Native Android | Both real fixtures PASS |
| M8 | Additional Web/Hybrid | Every marked-supported framework has real PASS |
| M9 | Godot/Unity exports | Supported exports build + runtime PASS |
| M10 | Universal fallback/diagnostics | Ambiguous/unsupported fixtures deterministic |
| M11 | Security + Reliability | Adversarial + recovery tests PASS |
| M12 | Standalone Builder App | Full ZIP → APK → Install/Launch E2E PASS |

---

# Definition of Done

The project is considered **M1–M12 complete** only when:

1. Every milestone has a recorded PASS.
2. Every mandatory real test ZIP has a recorded SHA-256.
3. Every mandatory APK build has an artifact SHA-256.
4. Every required phone runtime test passes.
5. No milestone is marked PASS while a mandatory blocker remains.
6. GitHub contains the implementation history and milestone commits.
7. The standalone Builder can perform the documented end-to-end workflow.

**Important:** M12 completion does not mean every software project on the internet is guaranteed to build. Unsupported/incompatible projects must receive deterministic diagnostics rather than false success.
