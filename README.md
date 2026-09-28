# Universal ZIP-to-APK Builder

**Phone-first Android Builder: ZIP → Analyze → Real Build → APK → Install/Runtime**

Universal ZIP-to-APK Builder is a developer-focused build orchestrator for turning structured project ZIPs into real Android APKs. The project prioritizes truthful build evidence, deterministic strategy selection, and local phone/Termux execution.

> **Important:** Build/CI success is not runtime success. A runtime-sensitive milestone is PASS only after the required install/launch/runtime evidence exists.

## Canonical project rules

The canonical development contract is defined by these repository documents:

- **Master roadmap:** `/ROADMAP.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Engineering / agent rules:** `AGENTS.md`
- **Validation workflow:** `docs/VALIDATION-WORKFLOW.md`
- **Test/evidence matrix:** `docs/TEST-MATRIX.md`
- **Architectural decisions:** `docs/ADR/`

### Goal Alignment & Deviation Audit

Before and after every milestone or major implementation, the development agent must verify that the work still serves the project's target goal.

The audit asks:

1. Is the implementation correct technically?
2. Is it still aligned with the target goal and current architecture?
3. Can a technically correct change create goal deviation?
4. What requirements, dependencies, constraints, or acceptance criteria are missing?
5. Is there false progress, scope drift, or a legacy architecture pulling the implementation off course?
6. What must be corrected before the milestone can proceed?

This is a **development/governance gate**, not a replacement for build or runtime validation.

### GitHub-Gated Milestone Development & Termux Validation Loop

`Goal Alignment Audit → implement one milestone → GitHub → pull exact commit in Termux → build/test → record evidence → PASS/FAIL/BLOCKED`

Do not advance a failed, blocked, or goal-misaligned milestone.

## Core pipeline

```text
ZIP
 ↓
Security Validation
 ↓
Project Detection
 ↓
Evidence / Confidence
 ↓
Strategy / Official Flow Adapter
 ↓
Phone-Compatible Environment
 ↓
Real Build
 ↓
APK Discovery
 ↓
APK Validation
 ↓
SHA-256
 ↓
Delivery
 ↓
Install / Launch / Runtime Validation
```

## Official Flow Adapter principle

When a framework has an established official/native Android build flow, Builder uses an **Official Flow Adapter** rather than inventing a substitute compiler or wrapper.

```text
Official Framework Flow
        ↓
Phone/Termux-Compatible Environment
        ↓
Real Native Build
        ↓
Real APK
        ↓
Install / Launch
        ↓
Runtime Validation
```

Initial priority:

1. React Native
2. Expo
3. Flutter
4. Capacitor
5. Native Android

The Builder may adapt the execution environment for Android phone/ARM64/Termux constraints, but it must preserve the framework's real native build semantics.

The Builder must not:

- create fake or mock APKs;
- use compile-only evidence as runtime PASS;
- silently replace a native framework with a generic WebView wrapper;
- silently fall back to an unrelated strategy;
- claim support from detector code alone.

## Current strategy direction

The roadmap covers:

- Plain HTML/CSS/JS
- React/Vite/PWA
- Flutter
- React Native
- Expo
- Capacitor/Ionic/Cordova
- Native Android Kotlin/Java
- Additional frameworks and Android-buildable project types

**Roadmap targets are not automatically supported/PASS.** Each framework needs a real fixture, deterministic strategy, real APK, and the runtime evidence required by its milestone.

## Canonical repository architecture

The project has exactly **three canonical development layers**:

```text
Layer 1 — Android Builder UI
Layer 2 — Termux Environment Setup
Layer 3 — GitHub Builder Code
```

### Layer 1 — Android Builder UI

The phone-first user interface and presentation layer.

Primary source/prototype location:

`artifacts/zip-to-apk-builder/`

UI state must come from real Builder state. Demo/mock data must never be presented as build evidence.

### Layer 2 — Termux Environment Setup

The phone-local environment and setup/diagnostic tooling required to execute the Builder on Android/Termux.

This layer is responsible for preparing and detecting the local toolchain; it is not a second Builder implementation.

### Layer 3 — GitHub Builder Code

The canonical Builder implementation and its shared development/test code:

- `lib/` — analyzer, security, build engine, strategy/adapter logic, shared types/utilities, and other canonical Builder code
- `tests/` — unit, integration, fixture, security, compatibility, and acceptance tests
- `scripts/` — repository-supported setup and diagnostic tooling
- `docs/` — architecture, roadmap, validation, test matrix, and ADRs

### Explicit architecture boundary

The following are **not canonical architecture layers**:

- `artifacts/api-server/`
- `lib/db/`
- `lib/build-queue/`
- `worker/`
- `docker/` or other container-specific builder infrastructure
- legacy/replit-specific files or infrastructure

If such files remain in the repository for compatibility, history, CI, or cleanup purposes, they are **Secondary/Legacy**, not part of the three-layer product architecture. New development must not treat them as required product layers unless an explicit ADR changes the architecture.

Do not create a competing backend, database, queue, Docker, or hosted architecture and present it as the phone-first Builder architecture.

## Phone / Termux

The primary development target is a local Android phone environment such as Termux.

Typical prerequisites include:

- Android SDK
- Android build-tools
- Java/JDK
- Gradle
- Node.js/package manager
- framework-specific native toolchains where required
- AAPT2 and related Android tools

Tool paths must be detected from the environment rather than hard-coded.

A typical environment may use:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$HOME/android-sdk"
```

Use the repository's current setup/diagnostic scripts rather than assuming a specific SDK installation.

## Development

Install dependencies:

```bash
pnpm install
```

Typecheck:

```bash
pnpm run typecheck
```

Build:

```bash
pnpm run build
```

Tests:

```bash
pnpm test
```

Inspect available scripts:

```bash
node -e "console.log(require('./package.json').scripts)"
```

## Security

ZIP files are untrusted input.

The security layer is expected to address:

- absolute paths;
- `../` traversal;
- Windows drive paths;
- unsafe/NUL filenames;
- symlink escapes;
- excessive file count;
- excessive uncompressed size;
- abnormal compression ratios;
- workspace containment;
- safe command/argument handling.

Do not execute user-controlled filenames as shell syntax.

## APK evidence

A build is not complete merely because a command exits successfully.

Required evidence depends on the milestone and includes:

- branch;
- commit SHA;
- fixture filename/SHA-256;
- detected type;
- toolchain versions;
- build command/result;
- APK path and byte size;
- APK SHA-256;
- install result;
- runtime result;
- device information when applicable;
- failure logs and limitations.

## Status semantics

| Status | Meaning |
|---|---|
| **PASS** | All mandatory evidence exists and passes |
| **FAIL** | A mandatory criterion failed |
| **BLOCKED** | Required external environment/device/tool is unavailable |
| **NOT RUN** | Verification has not been executed |

**BLOCKED is never PASS.**

## Documentation policy

Keep one source of truth per concern:

- `ROADMAP.md` — milestones
- `docs/ARCHITECTURE.md` — architecture
- `docs/TEST-MATRIX.md` — tests/evidence
- `docs/VALIDATION-WORKFLOW.md` — validation loop
- `docs/ADR/` — architectural decisions

Do not recreate competing roadmap or architecture documents.

## License

MIT. See `LICENSE`.
