# Universal Framework-Aware ZIP-to-APK Builder

**Developer-focused build orchestrator for turning supported project ZIPs into Android APKs**

Universal ZIP-to-APK Builder is a framework-aware, developer-focused build orchestrator for turning supported project ZIPs into real Android APKs. GitHub Actions on Ubuntu runners is the canonical build execution path. Phone-side installation and runtime checks remain separate acceptance steps when applicable; local Termux builds are an optional, secondary recovery/development path, not the default build requirement.

## Project boundaries

**For:** Developers building real Android APKs from supported, framework-aware project ZIPs. GitHub Actions on Ubuntu is the canonical build path; artifact checks and device/runtime validation remain necessary when required by the milestone. Termux/local builds are optional and secondary.

**Not:** A no-code consumer app creator, fake APK generator, or magic converter that makes arbitrary ZIPs into working apps; nor a default full Android SDK-on-phone build system. Detecting a framework alone does not establish support.

![Builder](https://img.shields.io/badge/Builder-Framework--Aware-111827)
![Build Path](https://img.shields.io/badge/Canonical-GitHub%20Actions%20on%20Ubuntu-1f6feb)
![Validation](https://img.shields.io/badge/Validation-Evidence--Based-7c3aed)
![Runtime](https://img.shields.io/badge/Runtime-Device%20Proof%20When%20Required-2da44e)

> [!NOTE]
> **Support status is evidence-based.**  
> Roadmap coverage, framework detection, or workflow-file presence do not by themselves mean a framework is supported. Support exists only when the required real fixture, build, artifact validation, and milestone-specific runtime/device evidence are present.

## Official build priority

1. **Primary — GitHub Actions / Ubuntu:** run the applicable workflow against an exact commit, build the APK, validate its structure and provenance, and publish the artifact plus SHA-256 evidence.
2. **Required when the milestone calls for it — Android device:** download the artifact from that exact workflow run, verify its recorded hash/provenance, then install and exercise it on a real device. CI success alone is not device acceptance.
3. **Optional — local Node.js / Termux restore path:** use only for explicitly needed local diagnosis, development, or recovery. Keep a minimal restore plan documented; do not require a large local Android SDK for routine builds.

Each result must be tied to the exact source commit and workflow run. Never use an older APK as evidence for a newer commit, and never describe a framework as supported based on detection or workflow-file presence alone.

> **Important:** Build/CI success is not runtime success. A runtime-sensitive milestone is PASS only after the required install/launch/runtime evidence exists.

## Where to start

For a quick, source-of-truth reading path:

1. **[README.md](README.md)** — understand the project identity, build path, boundaries, and evidence expectations.
2. **[ROADMAP.md](ROADMAP.md)** — review milestone scope and current priorities.
3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — understand the canonical architecture and design boundaries.
4. **[docs/VALIDATION-WORKFLOW.md](docs/VALIDATION-WORKFLOW.md)** — follow the build and acceptance process.
5. **[docs/TEST-MATRIX.md](docs/TEST-MATRIX.md)** — check the required tests and evidence for acceptance.

## Canonical project rules

The canonical development contract is defined by these repository documents:

- **Master roadmap:** `/ROADMAP.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Engineering / agent rules:** `AGENTS.md`
- **Validation workflow:** `docs/VALIDATION-WORKFLOW.md`
- **Test/evidence matrix:** `docs/TEST-MATRIX.md`
- **Build quality/security/evidence standards:** `docs/BUILD-QUALITY-SECURITY-STANDARDS.md`
- **Architectural decisions:** `docs/ADR/`
- **Release / version / checksum / provenance contract:** [docs/RELEASE-AND-PACKAGING-STANDARDS.md](docs/RELEASE-AND-PACKAGING-STANDARDS.md)
- **Change history:** [CHANGELOG.md](CHANGELOG.md)
- **Release validation workflow:** [Release Readiness](.github/workflows/release-readiness.yml)

### Release and package policy

Official releases are tag-based, tested, checksum-verified, and provenance-linked. Release automation creates a **draft** source release; it does not invent or attach an APK. An APK may be advertised as official only after exact-commit identity validation and the required runtime/device acceptance evidence. GitHub Packages publication is deferred until reusable package boundaries and the current security/acceptance gates are stable.

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

### GitHub Actions Build and Acceptance Loop

`Goal Alignment Audit → implement one milestone → focused PR → GitHub Actions on exact commit → inspect logs/artifact/provenance → device acceptance when required → record evidence → PASS/FAIL/BLOCKED`

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
Ubuntu CI-Compatible Environment
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

The primary execution environment is a pinned/reproducible Ubuntu GitHub Actions runner. Adapters must preserve each framework's real native build semantics. A minimal Termux/local restore path may be maintained for exceptional diagnosis or recovery, but is not the default build path.

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

Do not create a competing backend, database, queue, Docker, or hosted architecture and present it as the canonical Builder architecture. GitHub Actions is the primary build executor, not a new product/backend layer.

## Optional local / Termux restore path

Routine APK builds run through GitHub Actions on Ubuntu; a full local Android SDK is not required on the phone. Retain only the minimal Node.js/package-manager tools needed for source inspection or recovery, and install the larger Android toolchain only when a documented local task genuinely requires it. This path is secondary and must not replace the canonical CI artifact/provenance flow.

Typical prerequisites when a local Android build is explicitly required include:

- Android SDK
- Android build-tools
- Java/JDK
- Gradle
- Node.js/package manager
- framework-specific native toolchains where required
- AAPT2 and related Android tools

Tool paths must be detected from the environment rather than hard-coded. Prefer the repository's current setup/diagnostic scripts and avoid keeping large SDK/build caches on the phone when they are not needed.

A typical restored environment may use:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$HOME/android-sdk"
```

Use the repository's current setup/diagnostic scripts rather than assuming a specific SDK installation.

## Development

> [!NOTE]
> Development commands are workspace-oriented. `pnpm run build` validates and builds repository packages, but does not by itself mean that an Android APK has been produced. For exact CI parity, refer to the repository’s current GitHub Actions workflow toolchain settings.

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
- `docs/FRAMEWORK-SOURCE-ZIP-CONTRACT.md` — framework-specific source ZIP inputs, required files, exclusions, generators, and acceptance evidence
- `docs/BUILD-QUALITY-SECURITY-STANDARDS.md` — enforceable ZIP security, build provenance, APK validation levels, diagnostics, and support-status definitions
- `docs/M6-ACCEPTANCE-REPORT.md` — recorded M6 React Native device acceptance
- `docs/REPOSITORY-OVERALL-AUDIT-2026-10-15.md` — current repository, milestone, PR, and priority audit snapshot
- `docs/VALIDATION-WORKFLOW.md` — validation loop
- `docs/APK-IDENTITY-GATE.md` — pre-download APK identity and real-device eligibility gate
- `docs/tested-apk-registry.json` — exact hashes and provenance for previously device-tested APKs
- `docs/ADR/` — architectural decisions

Do not recreate competing roadmap or architecture documents.

## License

Apache License 2.0. See LICENSE.
