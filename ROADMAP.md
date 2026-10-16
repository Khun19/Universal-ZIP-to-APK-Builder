# Universal ZIP-to-APK Builder — Master Roadmap M1–M12

**Status: APPROVED / SINGLE SOURCE OF TRUTH**

This file is the only roadmap for the project. Milestone numbering is fixed unless an explicit architecture decision is recorded in GitHub.

## Product Goal

Build a dependable Universal ZIP-to-APK Builder with **GitHub Actions on Ubuntu as the primary build executor**:

`ZIP → Security → Analyze → Select Strategy → Prepare Ubuntu Toolchain → Build → Validate APK → Hash/Provenance → Artifact Delivery → Install/Launch when required`

### Approved build-execution priority — 2026-10-16

- **Primary build path:** GitHub Actions Ubuntu runners. Build and test against the exact commit under review, retain workflow logs, validate APK structure, and publish artifact provenance plus SHA-256.
- **Device acceptance:** when required by a milestone, download the APK from the corresponding workflow run and verify its identity/hash before installing and testing it on a real Android device. CI success is not runtime success.
- **Secondary recovery path:** local Node.js/Termux execution is optional for targeted diagnosis, development, or recovery. Keep documented minimal restore instructions, but do not make a large phone-side Android SDK a routine prerequisite.
- **Evidence binding:** CI run, source commit, fixture, APK, checksum, and device result must refer to the same build lineage. An older APK or unrelated fixture cannot prove acceptance of a newer commit.

This changes the execution priority, not milestone numbering, support claims, or runtime acceptance gates.

The Builder must prefer truthful diagnostics over false success. “Universal” means broad, deterministic compatibility through explicit supported strategies—not a promise that every arbitrary project can build.

## Core Development and Validation Rule

One milestone at a time. GitHub Actions is the default build/test environment; local Termux builds are exceptional and must be explicitly justified.

1. Start from the latest validated `main` commit.
2. Inspect the applicable repository instructions and specifications before modifying code.
3. Run the **Goal Alignment & Deviation Audit** against the current product goal, architecture, milestone scope, and acceptance criteria.
4. Implement only the current milestone.
5. Run applicable automated tests and real build tests.
6. Run the Goal Alignment & Deviation Audit again after implementation to detect technically correct but goal-divergent changes, missing requirements, false progress, or scope drift.
7. Push a focused branch/commit to GitHub and open a pull request.
8. Run and inspect the applicable GitHub Actions checks for the exact candidate commit; record the workflow/run IDs and relevant logs.
9. Verify that the artifact came from that exact commit and fixture; record APK path/name, size, package identity where applicable, SHA-256, and provenance.
10. For runtime-sensitive criteria, download that exact artifact and install/test it on a real Android device. Do not substitute a prior run's APK.
11. Use local Termux execution only when the task specifically requires local diagnosis/recovery or the relevant CI path is unavailable; record why it was needed.
12. Record evidence: branch, commit SHA, fixture SHA-256, runner/toolchain, workflow/run ID, result, APK size/SHA-256, device/runtime result, and limitations.
13. **PASS** only when every mandatory criterion passes and the goal-alignment audit is **ALIGNED**.
14. **FAIL** stays on the same milestone and requires a root-cause fix and re-test.
15. **BLOCKED** stays on the same milestone and records the missing environment/device prerequisite.
16. Never convert build success, CI success, source inspection, or technical correctness into a runtime PASS or a goal-alignment PASS.

## Canonical Architecture Order

The product architecture has exactly three canonical layers. Build-execution priority is separate from layer naming: GitHub Actions on Ubuntu is the primary executor, while Termux setup is a secondary local recovery/diagnostic path.

1. **Layer 1 — Android Builder UI**
2. **Layer 2 — Termux Environment Setup**
3. **Layer 3 — GitHub Builder Code**

Layer 3 is built and validated primarily on GitHub Actions Ubuntu runners. Layer 2 remains available for documented local restore/diagnostics, not as the routine build prerequisite.

The three layers are the product architecture. API-server, database, queue, worker, Docker/container, hosted-backend, and Replit-specific infrastructure are **Secondary/Legacy** unless a future ADR explicitly promotes a component.

Inside Layer 3, every supported strategy follows the same build contract:

`Secure Input → Detect → Evidence/Confidence → Strategy → Environment → Build → APK Discovery → APK Validation → Hash → Delivery`

Shared infrastructure must remain separate from strategy-specific behavior. Secondary/Legacy infrastructure must not become an implicit fourth layer or pull development back toward the retired architecture.

## Approved Architecture Decision — Official Framework Flow Adapters

**Approved: 2026-09-23**

Frameworks that have an established official/native Android build flow must be implemented through an **Official Flow Adapter** rather than through a Builder-invented substitute build system.

The target architecture is:

`Official Framework Flow → GitHub Actions Ubuntu Environment → Real Native Build → Validated APK + SHA-256 → Artifact Delivery → Install/Launch → Runtime Validation`

The Builder's responsibility is to:

1. Detect the framework/project type.
2. Select the corresponding Official Flow Adapter.
3. Prepare or validate the Ubuntu runner toolchain and pinned framework dependencies. Preserve a separate documented Termux restore path only for exceptional local execution where required.
4. Invoke the framework's real tooling and preserve its native build semantics.
5. Produce a real Android APK through the framework's actual native build path.
6. Validate the APK structure, package identity, native contents where applicable, and SHA-256.
7. Deliver the artifact to the phone.
8. Require install/launch/runtime evidence for runtime-sensitive PASS criteria.

The Builder must **not**:

- emulate or reimplement a framework build when the official tooling can be used;
- generate a fake or mock APK;
- replace a native framework build with a generic WebView wrapper;
- silently fall back to an unrelated strategy;
- treat source inspection, CI success, or compile-only success as runtime PASS.

The adapter layer is an architecture-level concern spanning the strategy registry and framework milestones (M2 and M3–M10), while the shared Build Engine remains responsible for process execution, workspace isolation, resource/time limits, artifact discovery, and common validation.

Initial priority for official-flow validation is:

- React Native
- Expo
- Flutter
- Capacitor
- Native Android

Additional frameworks may be added only when a deterministic Android build path exists and can be validated with a real fixture and runtime evidence.

This decision does **not** require copying framework source code. It requires reproducing the documented/real build procedure through the Builder on the primary Ubuntu CI runner. Any optional local/Termux adaptation must preserve the same native build semantics and must not become a routine prerequisite.

---

## Historical implementation status snapshot — 2026-10-15

This historical snapshot records evidence at canonical `main` HEAD `12eca7d7c94fb31000a82a5bf8cf07773c05d17c` as observed on 2026-10-15. It is not a statement of current HEAD or current milestone status. Re-check the exact current commit, open PRs, CI artifacts, and device evidence before changing any state; do not use this table as fresh acceptance evidence.

| Milestone | Current status | Evidence-based disposition |
|---|---|---|
| M1 — Foundation/security/integrity | **PARTIAL — NOT PASS** | ZIP path/symlink hardening and general quality-gate work are on main, but archive resource-limit implementation and boundary tests remain in open PRs #54 and #51. PR #54 documents an unresolved hard process-memory bound because AdmZip inflates entries into buffers before actual byte-length checks. |
| M2 — Analyzer/strategy registry | **PARTIAL — NOT GATE-PASS VERIFIED** | Framework detection/build-path integration was merged to main in `12eca7d`; all required analyzer fixtures, ambiguity cases, and deterministic unsupported-project behavior still need a complete gate record. Detector presence alone is not support evidence. |
| M3 — Static Web → APK | **NOT GATE-PASS VERIFIED** | Required fixture build, APK identity/hash, and install/launch evidence tied to a current main-based build are not established by this audit. |
| M4 — React/Vite/PWA → APK | **PARTIAL — NOT GATE-PASS VERIFIED** | The dedicated acceptance workflow is proposed in open PR #57. Both roadmap fixtures and applicable runtime behavior must be evidenced separately. |
| M5 — Flutter → APK | **PARTIAL — NOT GATE-PASS VERIFIED** | The isolated Flutter acceptance workflow is proposed in open PR #58. Keep M4/M5 evidence separate and require the exact artifact/provenance plus phone runtime checks. |
| M6 — React Native → APK | **IMPLEMENTATION INTEGRATED; CANONICAL-MAIN DEVICE GATE BLOCKED** | M2–M6 framework integration is on main, but the latest known AppCompat launch crash/theme-fix history is not closed by a verified install/launch/UI/touch run for an APK built from the exact current main commit. The Community Chat Demo report is fixture-specific and user-reported; its separate PR/fixture evidence must not be substituted for current-main acceptance. |
| M7 — Expo → APK | **NOT STARTED — GATED** | Do not start until the M6 current-main device gate is closed and the React Native compatibility matrix is reviewed. |
| M8 — Capacitor/Ionic/Cordova | **NOT GATE-PASS VERIFIED** | Required per-framework fixtures, native permission/plugin behavior, and runtime evidence remain acceptance work. |
| M9 — Native Kotlin/Java | **NOT GATE-PASS VERIFIED** | Both required native fixtures need real APK and runtime evidence. |
| M10 — Additional frameworks | **NOT STARTED AS ACCEPTED SUPPORT** | Add targets only one at a time with deterministic adapters, real fixtures, and runtime acceptance. |
| M11 — Diagnostics/reliability/production security | **PARTIAL** | Standards and some quality-gate/security work exist; remaining ZIP resource/memory limits, isolation, concurrency, recovery, and regression gates must be proven. |
| M12 — Standalone Android Builder / final E2E | **NOT GATE-PASS VERIFIED** | The user-facing flow must be connected to real build state and pass the mandatory Web, Flutter, and Native E2E fixtures on the required target environment. |

### Immediate execution order

1. **P0 — M6 exact-main device gate:** verify current main SHA; build a fresh APK from that exact source; record APK SHA-256; install; launch; confirm no AppCompat/ReactHost crash; inspect UI rendering; exercise a meaningful touch interaction; save logs/screenshots and results. If any gate fails, fix M6 only and repeat.
2. **P1 — M1 archive safety:** review PRs #54 and #51 together for overlap and dependencies; resolve the AdmZip memory-bound limitation or explicitly keep the security gate blocked; run adversarial limit-boundary tests on the exact candidate commit.
3. **P1 — M2/M3/M4/M5 evidence reconciliation:** use focused main-based acceptance PRs/workflows; verify each required fixture, APK provenance/hash, and device gate independently. Do not treat the newest CI run as evidence for a different SHA.
4. **P2 — repository CI/provenance:** review PR #56 and #55 against current main and existing workflows; merge only after exact-head checks and artifact provenance review.
5. **P3 — UI/productization:** connect the Android Builder UI to real pipeline state, hide developer logs by default, expose actionable failure reasons, and ensure demo/mock states cannot masquerade as real builds.
6. **Hold M7–M12 expansion** until the earlier required gates and compatibility decisions are recorded.

This status table is a snapshot, not a second roadmap. `ROADMAP.md` remains the only milestone scope source of truth; this table must be updated when new evidence changes a state.

---

# M1 — Foundation, Security & Artifact Integrity

## Goal

Establish the trusted base on which every later strategy depends.

## Scope

- Safe ZIP validation and extraction
- Path traversal/absolute-path protection
- Unsafe filename and symlink handling
- Workspace isolation
- File-count/uncompressed-size/compression-ratio controls
- Safe process/argument handling
- Environment detection
- Deterministic APK discovery
- APK structure/manifest/application-ID validation where applicable
- SHA-256 artifact hashing
- PASS/FAIL/BLOCKED/NOT RUN evidence model

## Gate

All mandatory security, extraction, environment, and APK-integrity tests pass.

---

# M2 — Universal Analyzer & Strategy Registry

## Goal

Make project detection and strategy selection deterministic before expanding build coverage.

## Scope

Detect using multiple evidence signals, not a single filename:

- Native Android / Gradle
- Flutter
- React Native
- Expo
- React/Vite
- Plain Web
- PWA
- Capacitor
- Ionic/Cordova
- Vue/Svelte/Angular
- Next/Nuxt
- Godot/Unity Android-buildable projects
- Unsupported/server-only projects

Add:

- structured detection evidence
- confidence/ambiguity handling
- nested project-root detection
- explicit strategy registry
- deterministic unsupported-project diagnostics
- no unrelated silent fallback

Official Flow Adapter selection belongs to this strategy registry.

## Gate

Required analyzer fixtures classify correctly and strategy selection is deterministic.

---

# M3 — Static Web → APK

## Goal

Prove the simplest complete ZIP → APK → phone workflow.

## Scope

- Plain HTML/CSS/JS
- Modern static web assets
- Offline packaging
- Android WebView wrapper
- Gradle build
- APK validation
- Download/copy
- Phone install
- Launch and expected screen smoke test

## Required Fixture

`M3-Modern-Static-Web-Test.zip`

## Gate

Builder-generated APK installs and launches successfully.

---

# M4 — React / Vite / PWA → APK

## Goal

Extend the Web strategy to modern frontend applications and PWA behavior.

## Scope

- React
- Vite
- package-manager/lockfile handling
- output-directory detection
- base-path/assets
- PWA manifest
- service worker
- Workbox compatibility
- offline runtime
- camera/QR PWA compatibility where applicable

## Required Fixtures

- `M4-React-Vite-Real-Test.zip`
- `M4-Camera-QR-PWA-Test.zip`

## Gate

Required fixtures build, install, and pass their applicable runtime smoke tests.

---

# M5 — Flutter → APK

## Goal

Build a real Flutter project through the Builder using the real Flutter toolchain.

## Scope

- `pubspec.yaml` detection
- Flutter SDK/environment validation
- `flutter pub get`
- `flutter analyze`
- `flutter build apk --debug`
- Builder Flutter strategy
- Android SDK/Java/Gradle compatibility
- APK validation
- phone install/launch

## Required Fixture

`M5-Flutter-Real-Test.zip`

## Gate

Direct Flutter build + Builder integration build + install/runtime all pass.

---

# M6 — React Native → APK

## Goal

Build a real official React Native Android project through the Builder's native Android path.

## Scope

- Real RN project detection
- Real Android project validation
- Node dependency installation
- Metro/bundling
- Gradle Android build
- JSI/native libraries
- Hermes/JSC configuration consistency
- APK validation
- phone install/launch
- runtime smoke test

The M6 implementation must use the Official Flow Adapter principle above and must not replace the real RN native build path with a mock, generic WebView, or compile-only substitute.

## Required Fixture

`M6-React-Native-Real-Test.zip`

## Gate

A real RN source ZIP produces an installable, runnable APK through the Builder.

A compile-only result is not sufficient.

---

# M7 — Expo → APK

## Goal

Support real locally buildable Expo projects without pretending remote-only workflows are local builds.

## Scope

- Expo configuration detection
- managed/prebuild/native-build capability classification
- dependency resolution
- native Android generation/prebuild when required
- local Android build
- APK validation
- phone install/launch
- deterministic diagnostics for unsupported remote-only configurations

The M7 implementation must use the Official Flow Adapter principle above, including the real Expo native/prebuild flow where applicable.

## Required Fixture

`M7-Expo-Real-Test.zip`

## Gate

A supported real Expo project produces a runnable APK through the Builder.

---

# M8 — Capacitor / Ionic / Cordova → APK

## Goal

Make hybrid WebView projects reliable when Android configuration, permissions, and native plugins are involved.

## Scope

- Capacitor detection and sync
- Ionic detection
- Cordova detection
- existing Android project preservation
- web asset synchronization
- manifest/permission handling
- runtime permission testing
- native plugin dependency resolution
- Gradle build
- install/launch/runtime smoke tests

## Required Fixtures

- `M8-Capacitor-Permissions-Test.zip`
- `M8-Ionic-Real-Test.zip`
- `M8-Cordova-Real-Test.zip`

## Gate

Build + install + required permission/plugin runtime behavior all pass.

---

# M9 — Native Android Kotlin / Java → APK

## Goal

Support ordinary existing Android projects without replacing their native structure.

## Scope

- Existing Gradle Android project detection
- Kotlin Android projects
- Java Android projects
- application-ID preservation unless explicitly configured
- manifest/resources preservation
- dependency resolution
- debug APK
- APK validation
- phone install/launch
- basic UI/runtime smoke test

## Required Fixtures

- `M9-Native-Kotlin-Real-Test.zip`
- `M9-Native-Java-Real-Test.zip`

## Gate

Both required native fixtures produce installable/runnable APKs.

---

# M10 — Additional Frameworks & Special Project Types

## Goal

Expand compatibility only where a deterministic Android build path exists.

## Web/Hybrid Targets

- Vue
- Svelte
- Angular
- Next.js
- Nuxt
- additional package managers
- additional PWA variants

## Special Targets

- Godot Android-buildable projects
- Unity Android exports/projects
- other explicitly supported game-engine Android exports

## Rules

- Each supported framework has detector evidence.
- Each supported framework has an explicit strategy.
- Backend/server-only projects are not falsely treated as standalone APKs.
- Source-only game projects without an Android-buildable export are rejected or marked unsupported.
- Every newly supported target gets a real fixture and runtime acceptance test.

## Gate

Every framework/project type marked supported has a passing real-project test.

---


# M11 — Universal Diagnostics, Reliability & Production Security

## Goal

Harden the complete system after strategy coverage is established.

## Scope

### Diagnostics

- nested/multi-project ZIPs
- conflicting framework signatures
- missing dependencies/toolchains
- actionable phase-specific errors
- explicit selected strategy
- deterministic artifact paths
- accurate final status
- no silent unrelated fallback

### Security / Isolation

- ZIP traversal and symlink attacks
- command/shell argument safety
- build workspace isolation
- concurrent-build isolation
- secret leakage prevention
- timeouts
- child-process cleanup
- disk/file/resource limits

### Reliability / CI

- reproducible build environments
- CI regression coverage
- artifact integrity checks
- failure recovery
- cleanup policy
- CI vs Termux vs real-device evidence kept separate

## Gate

Security, reliability, diagnostics, concurrency, and recovery tests pass without false-success artifacts.

---

# M12 — Standalone Android Builder Product & Final E2E

## Goal

Turn the validated build engine into the beginner-friendly standalone Android Builder.

## User Flow

**Pick ZIP → Analyze → Show Project Type → Build → Real Build Phase → APK Ready → Install / Share**

## UX

- mobile-first UI
- simple ZIP picker
- clear detection result
- clear Build action
- real phase-based progress
- understandable success/failure
- APK open/share/copy to Download
- developer logs hidden by default
- Developer Mode for detailed logs
- no unnecessary backend/admin/tooling UI for normal users

## Builder Integration

- all passed M1–M11 strategies remain available
- Web
- React/Vite/PWA
- Flutter
- React Native
- Expo
- Capacitor/Ionic/Cordova
- Native Android
- additional supported frameworks

## Reliability

- isolated workspace per build
- repeated builds do not corrupt each other
- APK validation before SUCCESS
- exact failure reason where possible
- artifact SHA-256 recorded

## Final E2E Fixtures

- `M12-Web-E2E-Test.zip`
- `M12-Flutter-E2E-Test.zip`
- `M12-Native-E2E-Test.zip`

## Gate

**M12 PASS:** the standalone Builder completes ZIP → Analyze → Build → APK → Install/Launch for all mandatory end-to-end fixtures.

---

# Milestone Status Policy

| State | Meaning |
|---|---|
| PASS | All mandatory evidence exists and acceptance criteria pass |
| FAIL | A mandatory criterion failed and must be fixed before advancing |
| BLOCKED | Required external environment/device/tool is unavailable |
| NOT RUN | Verification has not been executed |

**BLOCKED is never PASS.**

## Required Evidence Record

For every milestone's important real test record:

- branch
- commit SHA
- test ZIP filename
- test ZIP SHA-256
- detected project type
- toolchain/version
- build command
- build result
- APK path
- APK byte size
- APK SHA-256
- install result
- runtime result
- device/emulator information when applicable
- failure logs when failed
- known limitations

## Definition of Done

The project is complete only when:

1. M1–M12 each has a recorded PASS.
2. Every mandatory real fixture has a SHA-256 record.
3. Every required APK has an artifact SHA-256.
4. Every runtime-required milestone has real-device evidence.
5. No mandatory blocker is hidden behind PASS.
6. GitHub contains the implementation/evidence history.
7. The standalone Builder completes the documented end-to-end workflow.
8. Unsupported/incompatible projects receive deterministic diagnostics instead of false success.

## Roadmap Governance

- `/ROADMAP.md` is the **only roadmap**.
- `docs/ROADMAP.md` must not be recreated as a second roadmap.
- Changes to milestone numbering or milestone scope require an explicit GitHub architectural decision.
- Supporting documents may define tests, architecture, or validation procedures, but they must not redefine milestone numbering.
- `docs/FRAMEWORK-SOURCE-ZIP-CONTRACT.md` defines the required source ZIP structure and validation evidence for each framework; it does not itself declare framework support or authorize adding frameworks to the pipeline.
- React Native compatibility fixtures RN-1 through RN-6 must be validated one at a time, with CI/APK evidence and real-device checks before M7 planning. Expo remains out of scope until a separate M7 decision.
