# Universal ZIP-to-APK Builder — Architecture

## 1. Purpose

The architecture separates untrusted input handling, project analysis, build-strategy selection, build execution, Android packaging, artifact validation, API/UI, and worker infrastructure.

The central principle is:

`Analyze → Select Strategy → Execute → Validate → Deliver`

A new supported project type should be addable without rewriting the entire builder.

## 2. High-Level System

```text
                    ZIP INPUT
                        |
                        v
                +----------------+
                | ZIP Security   |
                | validate/extract|
                +-------+--------+
                        |
                        v
                +----------------+
                | Project        |
                | Analyzer       |
                +-------+--------+
                        |
                        v
                +----------------+
                | Strategy       |
                | Selection      |
                +---+--------+---+
                    |        |
          +---------+        +----------+
          v                              v
  +---------------+              +---------------+
  | Web Wrapper   |              | Native Gradle |
  +-------+-------+              +-------+-------+
          |                              |
          +-------------+----------------+
                        v
                +----------------+
                | Build Executor |
                +-------+--------+
                        |
                        v
                    Gradle/APK
                        |
                        v
                +----------------+
                | APK Discovery  |
                | + Validation   |
                +-------+--------+
                        |
                        v
                +----------------+
                | Hash / Artifact|
                +-------+--------+
                        |
                        v
                    DELIVERY
```

## 3. Repository Layers

The repository currently separates major responsibilities across `lib/`, `artifacts/`, `worker/`, `docker/`, `scripts/`, and `tests/`.

### `lib/shared`
Shared types and utilities.

### `lib/security`
ZIP validation, safe extraction, hashing, and APK validation. This layer must treat ZIP content as untrusted.

### `lib/analyzer`
Project-type detection and project analysis. It should produce structured evidence rather than relying on a single guessed framework.

### `lib/build-engine`
Strategy selection and process/build execution. Keep strategy-specific behavior isolated.

### `lib/build-queue`
Queue/job infrastructure. Jobs must have isolated workspaces and explicit lifecycle state.

### `lib/api-spec`, `lib/api-zod`, `lib/api-client-react`
API contracts, validation schemas, and generated client/hooks.

### `lib/db`
Persistence/repository layer.

### `artifacts/api-server`
Application API connecting the UI to project/build state.

### `artifacts/zip-to-apk-builder`
React/Vite dashboard for uploads, analysis, build state, logs, artifacts, and downloads.

### `worker`
Background/containerized build infrastructure.

### `docker/android-builder`
Reproducible Android build environment.

### `tests`
Fixtures and regression/acceptance coverage.

## 4. Build Strategies

### Native Gradle

For an input that is already an Android/Gradle project:

`ZIP → Extract → Analyze → Prepare Environment → Gradle → Locate APK → Validate → Hash`

### Capacitor

For projects containing Capacitor configuration:

`ZIP → Extract → Analyze → Web Build → Capacitor Sync → Gradle → Validate → Hash`

### Web Wrapper

For supported web applications:

`ZIP → Extract → Analyze → Web Build → Android Wrapper → Gradle → Validate → Hash`

Future strategies should follow the same contract and must not introduce global assumptions into unrelated strategies.

## 5. Build State Model

Use real phase state instead of fabricated percentage progress.

Typical states:

`QUEUED`
`EXTRACTING`
`ANALYZING`
`PREPARING_ENV`
`WEB_BUILD`
`CAPACITOR_SYNC`
`GRADLE_BUILD`
`LOCATING_APK`
`VALIDATING_APK`
`HASHING`
`SUCCESS`
`FAILED`
`BLOCKED`

A UI state should be derived from backend truth.

## 6. Build Job Isolation

Every build job should have:

- unique job ID
- isolated workspace
- controlled input/output directories
- bounded resources
- captured stdout/stderr
- exit code
- timeout policy
- cleanup policy

One build must never be able to modify another build's workspace.

## 7. Environment Abstraction

Do not hard-code the Android SDK, Java, Node, package-manager, or build-tools location.

Environment detection should report the availability and versions of required tools.

The same build logic should be usable in:

- Termux/local Android development
- Docker Android builder
- GitHub Actions/CI

Environment-specific configuration belongs at the environment boundary.

## 8. Package Manager Detection

When a project contains lockfiles, prefer the corresponding package manager and avoid creating unnecessary additional lockfiles.

Potential indicators include:

- `pnpm-lock.yaml`
- `package-lock.json`
- `yarn.lock`

The detector should make the decision explicit and log it.

## 9. PWA Architecture Considerations

PWA support is a compatibility layer, not a reason to weaken the general build system.

Handle:

- `vite-plugin-pwa`
- `workbox-window`
- Workbox runtime/build dependencies
- manifest files
- service workers
- generated asset paths
- architecture-specific native tooling issues

Compatibility fixes should be deterministic, documented, and regression-tested.

## 10. Android Wrapper Responsibilities

The Android wrapper should own Android-specific concerns such as:

- manifest
- application ID
- app name
- permissions
- WebView configuration
- local web assets
- navigation behavior
- required bridges
- Gradle configuration

The web application itself should remain as unmodified as practical.

## 11. Security Boundary

The first trust boundary is ZIP ingestion.

Required protections include:

- absolute-path rejection
- traversal rejection
- Windows drive-path rejection
- unsafe NUL/path handling
- symlink escape protection
- file-count limits
- uncompressed-size limits
- compression-ratio controls
- safe workspace resolution
- shell argument safety

Do not execute user-controlled filenames as shell syntax.

## 12. Artifact Boundary

An APK is not considered a successful artifact until the required validation stage passes.

Artifact metadata should include, where available:

- build ID
- filename
- size
- path/download reference
- SHA-256
- validation status

Do not expose an invalid or missing APK as SUCCESS.

## 13. API Boundary

The API should expose project/build lifecycle without leaking implementation details unnecessarily.

Important operations include the repository's currently documented build/health/environment/analysis/log/artifact flows. The exact endpoint set must be taken from the current API contract rather than assumed from documentation.

API contracts belong under `lib/api-spec/` and related generated validation/client packages.

## 14. Frontend Boundary

The frontend should display:

- upload state
- analysis result
- actual build phase
- logs
- failure reason
- artifact metadata
- download state

Do not fabricate progress percentages when the backend does not provide real percentage progress.

## 15. Extension Model

Future compatibility should be implemented through explicit extension points where practical:

```text
Project Analyzer
      |
      v
Strategy Registry
      |
      +--> native-gradle
      +--> capacitor
      +--> web-wrapper
      +--> future strategy...
```

A strategy should declare what it supports and expose a predictable build contract.

## 16. Observability

Each phase should make it possible to answer:

- What was attempted?
- Which command ran?
- In which workspace?
- What environment was detected?
- What exit code occurred?
- What stderr/stdout matters?
- Which phase failed?
- Was the result validated?

Logs must not contain secrets.

## 17. Testing Architecture

Tests should exist at multiple levels:

1. Unit tests for security, analysis, strategy selection, validation, and utilities.
2. Integration tests for build pipeline behavior.
3. Fixture-based compatibility tests for project types.
4. CI tests for reproducibility.
5. Real-device tests for Android runtime behavior.

Tests A/B/C are the current compatibility baseline; see `docs/TEST-MATRIX.md`.

## 18. Architectural Decision Rules

When a proposed change affects shared infrastructure, evaluate:

- compatibility impact
- security impact
- Termux impact
- Docker/CI impact
- concurrency impact
- testability
- future strategy support
- migration cost

Large architectural changes should be recorded as an ADR under `docs/ADR/` when they affect long-term project structure.

## 19. Anti-Patterns

Avoid:

- giant build functions
- framework-specific hacks in shared security code
- hard-coded environment paths
- fake build progress
- silent fallback after errors
- global mutable build state
- copying one strategy's assumptions into another
- modifying user source unnecessarily
- declaring universal support without a fixture and acceptance test

## 20. Target Evolution

The architecture should allow progression from the current supported strategies to broader compatibility while retaining the same lifecycle:

`INPUT → ANALYZE → STRATEGY → BUILD → VALIDATE → ARTIFACT`

New functionality should attach to this lifecycle rather than creating parallel pipelines unless there is a documented architectural reason.