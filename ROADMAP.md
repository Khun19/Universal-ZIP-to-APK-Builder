# Universal ZIP-to-APK Builder — Master Roadmap M1–M12

**Status: APPROVED / SINGLE SOURCE OF TRUTH**

This file is the only roadmap for the project. Milestone numbering is fixed unless an explicit architecture decision is recorded in GitHub.

## Product Goal

Build a dependable, phone-first Universal ZIP-to-APK Builder:

`ZIP → Security → Analyze → Select Strategy → Prepare Environment → Build → Validate APK → Hash → Deliver → Install/Launch when required`

The Builder must prefer truthful diagnostics over false success. “Universal” means broad, deterministic compatibility through explicit supported strategies—not a promise that every arbitrary project can build.

## Core Development and Validation Rule

One milestone at a time.

1. Start from the latest validated `main` commit.
2. Implement only the current milestone.
3. Run applicable automated tests and real build tests.
4. Push a focused branch/commit to GitHub.
5. Pull the exact commit in Termux.
6. Run the prescribed fixture(s).
7. For runtime-sensitive criteria, install and test on a real Android device.
8. Record evidence: branch, commit SHA, fixture SHA-256, environment, commands, result, APK path/size/SHA-256, runtime result, and limitations.
9. **PASS** only when every mandatory criterion passes.
10. **FAIL** stays on the same milestone and requires a root-cause fix and re-test.
11. **BLOCKED** stays on the same milestone and records the missing environment/device prerequisite.
12. Never convert build success, CI success, or source inspection into a runtime PASS.

## Architecture Order

Every supported strategy follows the same contract:

`Secure Input → Detect → Evidence/Confidence → Strategy → Environment → Build → APK Discovery → APK Validation → Hash → Delivery`

Shared infrastructure must remain separate from strategy-specific behavior.

## Approved Architecture Decision — Official Framework Flow Adapters

**Approved: 2026-09-23**

Frameworks that have an established official/native Android build flow must be implemented through an **Official Flow Adapter** rather than through a Builder-invented substitute build system.

The target architecture is:

`Official Framework Flow → Phone-Compatible Execution Environment → Real Native Build → Real APK → Install/Launch → Runtime Validation`

The Builder's responsibility is to:

1. Detect the framework/project type.
2. Select the corresponding Official Flow Adapter.
3. Prepare or validate a phone-compatible local environment (including Termux/ARM64 constraints where applicable).
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

This decision does **not** require copying framework source code. It requires reproducing the documented/real build procedure through the Builder while adapting only the execution environment needed for phone/Termux operation.

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
