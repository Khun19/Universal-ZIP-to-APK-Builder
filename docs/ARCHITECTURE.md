# Universal ZIP-to-APK Builder — Architecture

## 1. Purpose

The Builder is a phone-first ZIP-to-APK orchestration system. It accepts an untrusted project ZIP, determines what kind of Android-buildable project it contains, invokes the correct real build flow, validates the resulting APK, and reports truthful evidence.

Canonical lifecycle:

`Secure Input → Detect → Evidence/Confidence → Strategy → Environment → Build → APK Discovery → APK Validation → Hash → Delivery → Runtime Validation when required`

The master milestone contract is defined only in `/ROADMAP.md`.

## 2. Approved Official Flow Adapter Principle

Frameworks with an established official/native Android build flow use an **Official Flow Adapter**.

`Official Framework Flow → Phone-Compatible Execution Environment → Real Native Build → Real APK → Install/Launch → Runtime Validation`

The Builder adapts the execution environment for phone/Termux/ARM64 constraints where necessary. It does not replace the framework's native build semantics with a mock compiler, fake APK, unrelated wrapper, or silent fallback.

Initial priority:

- React Native
- Expo
- Flutter
- Capacitor
- Native Android

A framework is not considered supported merely because a detector recognizes it. Support requires a deterministic strategy, real fixture, real build, APK validation, and the runtime evidence required by its milestone.

## 3. Repository Boundaries

### `lib/security`

Untrusted ZIP handling, safe extraction, path/symlink checks, limits, hashing, and APK validation.

### `lib/analyzer`

Evidence-based project detection, confidence/ambiguity handling, nested-root detection, and strategy selection inputs.

### `lib/build-engine`

Shared process execution, workspace isolation, time/resource limits, environment handling, artifact discovery, and common build lifecycle.

### Official Flow Adapter layer

Framework-specific orchestration belongs here or in the strategy registry. An adapter should invoke the framework's real tooling rather than reimplementing it.

Conceptually:

```text
Strategy Registry
      |
      +--> Native Android → native Gradle flow
      +--> React Native  → official RN Android flow
      +--> Expo          → official Expo prebuild/native flow
      +--> Flutter       → official Flutter toolchain
      +--> Capacitor     → official Capacitor sync/native flow
      +--> Web           → approved Web-to-APK strategy
```

### `lib/build-queue`

Optional job/queue infrastructure. It must not change the meaning of build success or bypass the shared validation contract.

### `lib/api-spec`, `lib/api-zod`, `lib/api-client-react`

API contract, validation schemas, and generated client code.

### `lib/db`

Persistence/repository layer where the selected product deployment uses a database.

### `artifacts/api-server`

API application layer.

### `artifacts/zip-to-apk-builder`

User-facing React/Vite interface. UI state must come from real build state; demo/local fixture data must never be treated as build evidence.

### `worker` and `docker/android-builder`

Secondary/CI/container execution environments. They are not a substitute for the phone-first Termux target.

### `tests`

Unit, integration, fixture, compatibility, security, and acceptance tests.

## 4. Build Contract

Every strategy must expose the same high-level contract:

1. Validate input.
2. Detect and record evidence.
3. Select an explicit strategy.
4. Validate/prepare the required environment.
5. Execute the real build flow.
6. Locate the APK deterministically.
7. Validate the APK.
8. Calculate SHA-256.
9. Deliver the artifact.
10. Perform install/launch/runtime validation when the milestone requires it.

A successful process exit code alone is never enough to claim runtime success.

## 5. Status Semantics

`PASS` — every mandatory criterion has evidence and passed.

`FAIL` — a mandatory criterion failed.

`BLOCKED` — an external prerequisite such as a required device/toolchain is unavailable.

`NOT RUN` — verification has not been executed.

**BLOCKED is never PASS.**

CI success, source inspection, APK creation, or compile-only success must not be promoted to a runtime PASS.

## 6. Build Isolation

Every build must have:

- unique job/workspace identity;
- controlled input/output directories;
- bounded resource and timeout policy;
- captured stdout/stderr;
- child-process cleanup;
- artifact path tracking;
- cleanup after completion/failure.

One build must not modify another build's workspace.

## 7. Environment Boundary

Do not hard-code SDK, Java, Node, package-manager, NDK, or build-tool paths.

Environment detection reports tool availability and versions.

The same orchestration model can run in:

- Termux/local Android phone;
- Docker Android builder;
- CI/GitHub Actions.

Environment-specific adaptations belong at the environment boundary.

## 8. Web and Hybrid Strategies

Web/PWA projects may use the approved Web-to-APK strategy when their output is suitable for offline Android packaging.

Capacitor/Ionic/Cordova projects retain their native Android semantics and use their real sync/build flows.

A generic WebView wrapper must not silently replace a detected native framework strategy.

## 9. Security Boundary

ZIP content is untrusted.

Required protections include:

- absolute-path rejection;
- traversal rejection;
- Windows drive-path rejection;
- unsafe/NUL path handling;
- symlink escape protection;
- file-count limits;
- uncompressed-size limits;
- compression-ratio controls;
- safe workspace resolution;
- shell/argument safety.

User-controlled filenames must never become shell syntax.

## 10. Artifact Boundary

An APK is successful only after the required validation stage.

Artifact evidence should include where available:

- build ID;
- filename;
- byte size;
- artifact path;
- SHA-256;
- package/application ID;
- validation status;
- runtime result when required.

Invalid or missing APKs must never be reported as SUCCESS.

## 11. Frontend Boundary

The UI should display:

- selected/detected project type;
- compatibility evidence;
- real build phase;
- meaningful logs;
- failure reason;
- artifact metadata;
- download/open/share state.

Do not fabricate percentage progress.

Demo fixtures or local UI mock data, if retained for development, must remain clearly separated from real build state and must never establish build evidence.

## 12. Testing Model

Testing has multiple levels:

1. Unit tests for security, analysis, strategy selection, validation, and utilities.
2. Integration tests for build orchestration.
3. Real fixture tests for each supported project type.
4. CI/reproducibility tests.
5. Termux execution tests.
6. Real-device install/launch/runtime tests for runtime-sensitive milestones.

The test matrix and validation workflow define the evidence required for milestone gates.

## 13. Extension Rules

Adding a framework requires:

- detector evidence;
- explicit strategy/Official Flow Adapter;
- deterministic unsupported diagnostics where necessary;
- real fixture;
- real build command/result;
- validated APK;
- runtime acceptance evidence where applicable.

Do not claim universal support from a detector alone.

## 14. Anti-Patterns

Avoid:

- fake/mock APKs;
- fake build logs or progress;
- compile-only runtime claims;
- silent strategy fallback;
- generic WebView replacement for native frameworks;
- hard-coded environment paths;
- global mutable build state;
- framework-specific hacks in shared security code;
- modifying user source unnecessarily;
- duplicate parallel pipelines without an explicit ADR.

## 15. Source of Truth

- `/ROADMAP.md` — milestone scope and gates.
- `docs/ARCHITECTURE.md` — this architecture.
- `docs/TEST-MATRIX.md` — test/evidence requirements.
- `docs/VALIDATION-WORKFLOW.md` — GitHub → Termux → real-device validation procedure.
- `docs/ADR/` — long-term architectural decisions.

Do not create a second roadmap or a second architecture document with competing rules.
