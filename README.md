# Universal ZIP-to-APK Builder

**Phone-first Android Builder: ZIP → Analyze → Real Build → APK → Install/Runtime**

Universal ZIP-to-APK Builder is a developer-focused build orchestrator for turning structured project ZIPs into real Android APKs. The project prioritizes truthful build evidence, deterministic strategy selection, and local phone/Termux execution.

> **Important:** Build/CI success is not runtime success. A runtime-sensitive milestone is PASS only after the required install/launch/runtime evidence exists.

## Canonical project rules

- **Master roadmap:** `/ROADMAP.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Test/evidence matrix:** `docs/TEST-MATRIX.md`
- **Validation workflow:** `docs/VALIDATION-WORKFLOW.md`
- **Engineering rules:** `AGENTS.md`

The project uses the **GitHub-Gated Milestone Development & Termux Validation Loop**:

`Implement one milestone → GitHub → pull exact commit in Termux → build/test → record evidence → PASS/FAIL/BLOCKED`

Do not advance a failed or blocked milestone.

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

## Repository layout

```text
.
├── lib/
│   ├── analyzer/          # project detection and evidence
│   ├── build-engine/      # shared build execution/orchestration
│   ├── security/          # ZIP and APK security/integrity
│   ├── build-queue/       # optional job/queue infrastructure
│   ├── api-spec/          # API contract
│   ├── api-zod/           # generated validation
│   ├── api-client-react/  # generated client/hooks
│   ├── db/                # persistence layer
│   └── shared/            # shared types/utilities
├── artifacts/
│   ├── api-server/        # API application
│   └── zip-to-apk-builder/# React/Vite UI
├── tests/                 # tests and real compatibility fixtures
├── scripts/               # setup/diagnostic tooling
├── worker/                # secondary worker infrastructure
├── docker/                # reproducible secondary build environment
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TEST-MATRIX.md
│   ├── VALIDATION-WORKFLOW.md
│   └── ADR/
└── ROADMAP.md             # single milestone source of truth
```

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
