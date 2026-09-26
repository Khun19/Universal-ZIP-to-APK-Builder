# Universal ZIP-to-APK Builder — 3-Layer Architecture

## 1. Canonical product path

`Android Builder App UI (Layer 1) → Termux Environment/Bridge (Layer 2) → Builder Core (Layer 3)`

### Layer 1 — Android Builder App

Native Android UI for ZIP selection, security/analysis results, build control, real logs, APK metadata, and install/share actions.

### Layer 2 — Termux Environment

Phone-local execution environment. It owns Java/JDK, Node/pnpm, Gradle, Android SDK/build-tools, AAPT2, zipalign, apksigner, and framework-specific toolchains.

Environment setup and diagnostics live under `scripts/`. Tool paths are detected at runtime; binaries are not committed to GitHub.

### Layer 3 — GitHub Builder Core

Reusable build logic for ZIP security/extraction, project detection, strategy selection, Official Flow Adapters, build execution, APK discovery/validation, SHA-256, diagnostics, and tests.

## 2. Official Flow Adapter

A detected native framework must use its real/native build semantics:

`Official Framework Flow → Termux-compatible environment → Real native build → Real APK → Runtime validation`

A native framework must not silently fall back to a generic WebView/Capacitor wrapper.

## 3. Repository boundaries

- `app/` — Layer 1 native Android Builder UI target.
- `bridge/` — Layer 1 ↔ Layer 2 local contract.
- `lib/` — Layer 3 Builder Core.
- `scripts/` — Layer 2 Termux setup/doctor tooling.
- `artifacts/zip-to-apk-builder/` — existing UI prototype being migrated toward Layer 1.
- `artifacts/mockup-sandbox/` — UI/design sandbox.
- `tests/` — security, analysis, strategy, build, fixture, and acceptance tests.
- `docs/` — architecture and validation contracts.
- `ROADMAP.md` — single milestone source of truth.

## 4. LEGACY / SECONDARY

The old server/container architecture is no longer part of the main product build path:

- Docker Android builder / Docker Compose — retired.
- PostgreSQL/Drizzle persistence — retired.
- Redis/BullMQ queue — retired.
- server-side API worker — retired.
- Replit deployment/workspace configuration — retired.
- server-only environment variables — retired.

Git history remains the historical record. These components must not become prerequisites for phone-first validation.

## 5. Build truth

A process exit code alone is never build evidence. The Core must locate a real APK, validate its structure, record SHA-256, and report evidence. Runtime-sensitive milestones additionally require real device install/launch/runtime evidence.

## 6. Security boundary

ZIP input is untrusted. Each build uses an isolated workspace. Reject traversal/absolute paths, unsafe symlinks, archive abuse, workspace escape, and unsafe command construction. User-controlled paths must never become shell syntax.

## 7. Environment boundary

Do not hard-code SDK, Java, Gradle, Node, NDK, or AAPT2 paths. Layer 2 discovers them. When required by the Android Gradle Plugin, the local AAPT2 executable may be supplied through `android.aapt2FromMavenOverride`.

## 8. Validation workflow

`Implement one milestone → push GitHub → pull exact commit in Termux → test/build → install/runtime-test when required → record evidence → PASS or remain on the same milestone`

CI/source inspection is never a substitute for required real-device evidence.
