# Universal ZIP-to-APK Builder — Agent/Workspace Notes

## Project direction

This is a **phone-first Universal ZIP-to-APK Builder**.

Primary local target:

- Android phone
- Termux
- ARM64 Android tooling
- real local APK builds
- real install/launch/runtime validation

Secondary environments such as Docker and CI may be used for reproducibility and regression testing, but they do not replace the phone/Termux validation gate.

## Development workflow

Use the **GitHub-Gated Milestone Development & Termux Validation Loop**:

1. Work on one milestone.
2. Push the focused change to GitHub.
3. Pull the exact commit in Termux.
4. Run the prescribed real fixture/build.
5. Install and runtime-test when required.
6. Record evidence.
7. PASS → next milestone.
8. FAIL/BLOCKED → remain on the same milestone.

Do not claim PASS from CI, source inspection, or compile-only output.

## Architecture

Canonical sources:

- `ROADMAP.md` — milestone scope and gates
- `docs/ARCHITECTURE.md` — architecture
- `docs/TEST-MATRIX.md` — evidence requirements
- `docs/VALIDATION-WORKFLOW.md` — validation procedure
- `docs/ADR/` — architectural decisions

### Official Flow Adapter

Frameworks with an established official/native Android build flow must use an Official Flow Adapter.

`Official Framework Flow → Phone-Compatible Environment → Real Native Build → Real APK → Runtime Validation`

Initial priority:

- React Native
- Expo
- Flutter
- Capacitor
- Native Android

The adapter may adapt the execution environment for Termux/ARM64, but must not replace native framework semantics with fake builds, generic wrappers, or silent fallback.

## Repository boundaries

- `lib/analyzer` — project detection/evidence
- `lib/security` — ZIP validation/extraction/hash/APK validation
- `lib/build-engine` — shared build execution
- Official Flow Adapters/strategy registry — framework-specific real build orchestration
- `lib/worker.ts` — build execution boundary used by the current local/server architecture
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema` — database schema
- `artifacts/zip-to-apk-builder` — React/Vite UI

## Commands

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
```

Regenerate API artifacts after OpenAPI changes:

```pnpm --filter @workspace/api-spec run codegen
```

## Product truth

- No mock APKs.
- No fake build logs.
- No simulated progress presented as real build state.
- APK success requires validation and SHA-256.
- Runtime-sensitive success requires real device evidence.

## UI mock/demo data

The UI currently contains development/demo state under `artifacts/zip-to-apk-builder/src/services/mockData.ts`.

That data is **not build evidence**. Do not use it to claim that a real project was analyzed, built, installed, or run. Any future cleanup of the UI should replace demo state with real API/build state rather than silently preserving mock behavior.

## Termux

The exact Android SDK, Java, Gradle, Node, package-manager, and framework toolchain versions are environment-specific. Detect them at runtime; do not hard-code paths.

The local build environment may use Android SDK + Gradle on Termux. Docker/Redis are not prerequisites for the phone-first local build path.

## Notes

Before modifying shared build infrastructure, inspect existing implementations and tests first. Prefer the smallest safe change and preserve evidence requirements.
