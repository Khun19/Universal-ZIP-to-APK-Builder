# Universal ZIP-to-APK Builder — Roadmap

## Product Goal

Provide a dependable path from a supported application ZIP to a real, installable, validated Android APK, with clear diagnostics and a foundation that can grow to broader project compatibility.

## Operating Model

`ChatGPT = plan/review/debug`  
`Termux = execute/build/test`  
`GitHub = source of truth/history/CI`

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
- [ ] `workbox-window` handling remains deterministic
- [ ] Service-worker build verified
- [ ] Manifest handling verified
- [ ] Offline/runtime behavior tested where applicable
- [ ] PWA regression fixture kept permanently

### M5 — Camera / QR PWA → APK
- [x] Camera/QR test work exists in project history
- [ ] APK installation verified
- [ ] Runtime camera permission verified
- [ ] Camera access verified on a real Android device
- [ ] QR scanning behavior verified
- [ ] Back/navigation behavior verified
- [ ] Regression test retained

### M6 — Multiple Build Strategies
- [x] Native Gradle strategy foundation
- [x] Capacitor strategy foundation
- [x] Web-wrapper strategy foundation
- [ ] Strategy interface/contract hardened
- [ ] Detection confidence and unsupported-project behavior improved
- [ ] Strategy-specific fixtures and acceptance tests expanded

### M7 — Production Security and Isolation
- [x] Unsafe archive-path checks exist
- [ ] Build workspace isolation verified under concurrent jobs
- [ ] Resource/time/file limits enforced consistently
- [ ] Shell argument handling audited
- [ ] Symlink behavior audited
- [ ] Security regression suite established

### M8 — Reliable CI + Real Device Validation
- [ ] CI covers typecheck/build/tests
- [ ] Build failures expose useful logs
- [ ] Android build environment is reproducible
- [ ] Artifact integrity checks run in CI where practical
- [ ] Real-device validation procedure documented
- [ ] CI and device results are clearly distinguished

### M9 — Production Artifact Pipeline
- [ ] Build job lifecycle is reliable
- [ ] Artifact metadata is complete
- [ ] SHA-256 is consistently exposed
- [ ] Failed/blocked jobs are diagnosable
- [ ] Cleanup policy is reliable
- [ ] Concurrent builds are safe
- [ ] Release/debug artifact policy documented

### M10 — Broader Universal Compatibility
Candidate extensions, implemented only when acceptance tests justify them:

- Additional web frameworks
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
