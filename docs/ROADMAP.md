# Universal ZIP-to-APK Builder — Roadmap

## Product Goal

Provide a dependable path from a supported application ZIP to a real, installable, validated Android APK, with clear diagnostics and a foundation that can grow to broader project compatibility.

## Operating Model

`ChatGPT = plan/review/debug`  
`Termux = execute/build/test`  
`GitHub = source of truth/history/CI`

## Validated Build Families

These are the current canonical build families and their status:

1. Plain Web / HTML-CSS-JS — validated
2. React / Vite — validated
3. Capacitor — build path validated
4. Native Android — validated
5. Flutter — M5 validated; real Flutter → APK and real-phone runtime validation passed
6. React Native / Expo — M6 in progress

The family list is intentionally separate from framework names. Multiple
frameworks should reuse a canonical build family whenever their output and
tooling permit it.

## Milestones

### M0 — Foundation and Engineering Control
- [x] Repository structure and core build layers established
- [x] Security, analyzer, build-engine, queue, API, frontend, and worker layers documented in README
- [x] `AGENTS.md` adopted as project-wide agent contract
- [x] Architecture and decision records kept current
- [x] Test matrix maintained as an acceptance contract
- [x] CI and local/Termux workflow consistently documented

M0 evidence:
- `AGENTS.md` defines the source-of-truth, engineering, Git, CI/device, security, Termux, documentation, and definition-of-done contracts.
- `docs/ARCHITECTURE.md` defines the current lifecycle and architectural boundaries.
- `docs/ADR/0001-engineering-control-and-validation.md` records the accepted validation and milestone-gating decision.
- `docs/TEST-MATRIX.md` is the acceptance contract and explicitly separates PASS/FAIL/BLOCKED/NOT RUN evidence.
- `docs/VALIDATION-WORKFLOW.md` defines the GitHub → CI → Termux → real-device validation loop and documents current CI limitations.

### M1 — Core ZIP → APK Pipeline
- [x] Secure ZIP extraction foundation
- [x] Project analysis foundation
- [x] Strategy selection foundation
- [x] Build execution foundation
- [x] APK discovery/validation foundation
- [x] Artifact hashing foundation
- [ ] Unified failure diagnostics across all phases
- [ ] Strong isolation and resource limits for every build

Acceptance: a supported input can move through every required phase with truthful state and useful failure output.

### M2 — Static Web → APK
- [x] Stable static HTML/CSS/JS fixture
- [x] Wrapper generation verified
- [x] Deterministic web output discovery
- [ ] Debug APK generated
- [ ] APK installed on Android
- [ ] Launch/navigation verified
- [x] Regression test automated

### M3 — React/Vite → APK
- [x] React/Vite strategy foundation
- [ ] Multiple package-manager fixtures where practical
- [ ] Output directory detection hardened
- [ ] Asset/base-path compatibility verified
- [ ] Real-device installation and launch verified
- [ ] Regression coverage expanded

### M4 — PWA → APK
- [x] PWA/Workbox compatibility work exists in project history
- [x] `workbox-window` handling remains deterministic
- [x] Service-worker build verified
- [x] Manifest handling verified
- [ ] Offline/runtime behavior tested where applicable
- [x] PWA regression fixture kept permanently

### M5 — Flutter Direct Build → APK
- [x] Flutter projects detected from `pubspec.yaml` and `lib/main.dart`
- [x] Dedicated Flutter build strategy selected
- [x] Native Flutter and Ubuntu PRoot Flutter executor selection supported
- [x] `flutter pub get` and `flutter build apk --debug` executed directly
- [x] Real Flutter APK discovered and validated
- [x] Tracked Flutter regression fixture and integration test retained
- [ ] APK installation and runtime behavior verified on a real Android device

### M6 — React Native / Expo Direct Build → APK
- [x] React Native projects detected from package metadata and Android structure
- [x] Expo projects detected from dependency/configuration markers
- [x] Dedicated React Native / Expo strategy selected
- [x] Dependency installation uses the project package manager
- [x] Local Expo prebuild supported when Android is missing
- [x] Real Android Gradle APK build and validation verified
- [x] Tracked React Native fixture and integration test retained
- [ ] Real-device installation and runtime behavior verified

### M7 — Web-family Expansion
Planned targets: Next.js, Nuxt, Angular, Vue, and Svelte.

- [ ] Detect supported web-family projects reliably
- [ ] Reuse Web Build → Web Wrapper → APK where production output is packageable as web content
- [ ] Add framework fixtures and acceptance coverage
- [ ] Create a separate APK engine only where framework tooling genuinely requires it

### M8 — Hybrid Android Expansion
Planned targets: Ionic and Cordova.

- [ ] Detect Ionic and Cordova projects
- [ ] Reuse or generate the native Android project where appropriate
- [ ] Reuse the existing Android/Gradle build infrastructure
- [ ] Add hybrid-framework fixtures and acceptance coverage

### M9 — Godot Android Export
Planned target: Godot Android export.

- [ ] Define a dedicated Godot adapter/export strategy
- [ ] Validate a real Godot Android export
- [ ] Add artifact and runtime acceptance coverage

### M10 — Unity Android Export
Planned target: Unity Android export.

- [ ] Define a dedicated Unity adapter/export strategy
- [ ] Validate a real Unity Android export
- [ ] Add artifact and runtime acceptance coverage

### Later Dedicated Milestone — APK Identity Layer
Planned, explicitly outside M6.

The Identity Layer will provide one user-facing configuration surface for:

- App Name
- App Icon
- Package ID / Application ID
- Theme / Accent Color
- Light / Dark mode
- Splash Screen
- Adaptive Icon

Identity must be applied framework-specifically while presenting one consistent
Builder UI. It is a separate layer and must not be mixed into M6.

## Architecture Principle

Prefer:

`Framework Detector → Canonical Build Family → Existing Build Strategy → APK Validator`

over creating a completely separate APK pipeline for every framework. Use
adapters only where framework-specific tooling is genuinely required.

The future identity flow is:

`ZIP → Analyze → App Identity → Framework Strategy → Build → APK Validation → APK`

## Future Candidate Capabilities

Candidate extensions, implemented only when acceptance tests justify them:

- More package managers
- Additional PWA variants
- Custom app name/package ID/icon
- Splash screens
- File upload/download bridges
- Deep links
- Camera/microphone/geolocation/notifications
- Offline-first behavior
- Release APK/AAB
- Signing configuration
- Build caching
- Containerized/remote workers

## Priority Rules

1. Reliability of ZIP → APK is higher priority than cosmetic UX.
2. A real failure is higher priority than speculative features.
3. Fix root causes rather than adding repeated special cases.
4. Preserve passing tests while expanding compatibility.
5. Design extension points early, but implement future features only when their acceptance criteria are defined.

## Milestone Gate

A milestone is not considered complete because code exists. It requires its applicable acceptance tests to pass, with real-device verification for runtime-sensitive Android features.

## Current Working Focus

Use the repository's current test status and GitHub Actions results to choose the next concrete task. Do not assume an old milestone is complete without current evidence.
