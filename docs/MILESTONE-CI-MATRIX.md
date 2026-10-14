# M1–M12 CI, Workflow, and Artifact Provenance Matrix

**Authority:** `ROADMAP.md` remains the only milestone source of truth. This document maps CI evidence and does not redefine milestone scope or declare any milestone PASS.

## Shared quality gate

The existing `.github/workflows/builder-quality-gates.yml` is the common Ubuntu gate for relevant code, tests, scripts, artifacts, workspace manifests, and workflow changes. It runs the repository's pinned pnpm/Node toolchain, frozen-lockfile install, typecheck, unit/regression tests, and workspace build. It now publishes a `quality-gate-provenance-<run>-<attempt>` artifact even when a prior quality step fails, when the evidence step itself can run.

The existing `.github/workflows/ubuntu-m6-build-test.yml` remains the targeted M6 workflow. It now attempts to publish `m6-build-apk-<run>-<attempt>` with the APK, SHA-256 sidecar, and `m6-apk-provenance.json`. A missing APK remains a failure. Its provenance explicitly says Android runtime validation was not performed by the Ubuntu build workflow.

## Current workflow inventory from canonical `main`

This is the workflow inventory identified in the current `main` snapshot; it is not a claim that all are suitable as required PR gates.

| Existing workflow | Current trigger/role observed | Milestone connection | Provenance/gating disposition |
|---|---|---|---|
| `.github/workflows/builder-quality-gates.yml` | Pull requests to `main` and pushes to `main` for listed shared code/test/workflow/docs paths | Shared common gate for relevant M1–M12 source, tests, and workflow changes | This PR adds run/commit/toolchain/input-hash provenance artifact. |
| `.github/workflows/ubuntu-m6-build-test.yml` | Pull requests to `main`, manual dispatch, and pushes on three named M6/feature branches | M6 only | This PR adds a separate provenance record and APK checksum artifact; device/runtime validation remains outside this workflow. |
| `.github/workflows/codeql.yml` | CodeQL security analysis workflow | Cross-cutting security signal, especially M1/M11; not a framework build gate | Keep as a separate security check. Its success does not replace unit tests, artifact provenance, or runtime acceptance. |
| `.github/workflows/fix-test-a-runtime-final.yml` | Push on `fix/test-a-runtime-final`; applies SAF patch, tests, then can commit/push generated source | Test A / static-web and Android directory-picker path, likely relevant to M3; branch-specific only | Not a general `main` acceptance gate. Has `contents: write` and self-committing behavior; audit separately before promoting or reusing it. |
| `.github/workflows/one-time-test-a-directory-picker.yml` | Push on `fix/test-a-directory-picker`; applies SAF patch, then can commit/push generated source | Test A / directory-picker behavior, likely relevant to M3; branch-specific only | Not a general `main` acceptance gate. Has `contents: write` and self-committing behavior; audit separately before promoting or reusing it. |

**Important coverage boundary:** the inventory currently confirms a shared gate and one specialized APK workflow, not twelve independent framework-build workflows. For M2–M5 and M7–M12, the common gate can test shared code but does not prove the corresponding framework can build. Targeted workflow/fixture coverage and artifact provenance for those milestones remain gaps until existing files are inspected and the missing evidence is added in focused PRs.

## Provenance contract

For each relevant CI run, record:

- Repository, exact source commit SHA, ref, event, workflow run ID and attempt.
- Toolchain versions and operating system/runner metadata.
- Relevant input/lockfile SHA-256 hashes.
- Artifact path, existence, size, SHA-256 where an artifact was actually produced.
- Workflow/run URL in the evidence location or associated validation record.
- Separate CI build status from install, launch, UI, and real-device behavior.

A provenance JSON file is evidence metadata, not a cryptographic signature or attestation. Artifact hash proves byte identity only; it does not prove APK safety, installation, launch, or feature correctness.

## M1–M12 workflow mapping

| Milestone | Common quality gate | Targeted workflow/evidence expected | Acceptance status rule |
|---|---|---|---|
| M1 — Foundation, ZIP security, artifact integrity | Required for changes under `lib/**`, `tests/**`, `scripts/**`, manifests and workflow files | ZIP resource-limit/adversarial tests; extraction cleanup and path collision tests; provenance for the exact test commit | Do not PASS until security boundaries and actual streamed-byte limits have dedicated passing tests |
| M2 — Universal analyzer and strategy registry | Required for analyzer/strategy source and tests | Detection/ambiguity/unsupported-project fixture tests and strategy selection evidence | Detection alone is not framework-build support |
| M3 — Static Web → APK | Required for relevant code/test/workflow changes | Static web fixture → real APK build, APK structural checks, checksum/provenance artifact | CI build and real-device acceptance remain distinct |
| M4 — React/Vite/PWA → APK | Required for relevant code/test/workflow changes | Pinned JS toolchain, representative React/Vite/PWA fixtures, APK checksum/provenance | Each required fixture must be reported separately |
| M5 — Flutter → APK | Required for relevant code/test/workflow changes | Pinned Flutter/JDK/Android SDK, real Flutter Android build, APK structure and provenance | No PASS from a mock or absent APK |
| M6 — React Native → APK | Required; specialized workflow already exists | `.github/workflows/ubuntu-m6-build-test.yml`; APK + SHA-256 + provenance | Ubuntu build PASS does not establish install/launch/UI PASS |
| M7 — Expo → APK | Required once work is authorized | Add a targeted Expo workflow only after M6 is explicitly accepted | Remain gated until M6 PASS; no early compatibility claims |
| M8 — Capacitor/Ionic/Cordova → APK | Required for relevant changes | Add/retain framework-specific fixtures and official Android build workflow after inventory | Separate fixture-level build and runtime evidence |
| M9 — Native Android Kotlin/Java → APK | Required for relevant changes | Gradle/JDK/SDK build fixture, manifest/package validation, checksum/provenance | Missing or invalid APK is FAIL |
| M10 — Additional frameworks/special project types | Required for strategy/test changes | One explicit strategy/fixture/workflow at a time | Unsupported strategy must fail diagnostically; no universal claim |
| M11 — Diagnostics, reliability, production security | Required for security/reliability changes | Regression, timeout, cancellation, isolation, redaction, dependency/security and provenance tests | Documented control is not implemented evidence |
| M12 — Standalone Android Builder product and final E2E | Required for relevant code/test/workflow changes | End-to-end fixture matrix from ZIP intake through APK delivery; per-fixture provenance | Final gate requires all mandatory criteria and separate runtime evidence where specified |

### Existing-workflow connection rule

1. All milestone source/test changes in the current shared paths use the common quality gate.
2. Framework-specific build workflows remain specialized; do not replace them with a generic workflow that hides toolchain differences.
3. During the next workflow-inventory PR, enumerate every existing `.github/workflows/*.yml` and map its actual triggers, tests, artifact outputs, and M1–M12 scope. Do not infer a workflow exists merely because this matrix lists a target.
4. A workflow must upload provenance alongside each mandatory build artifact. If a legacy workflow cannot yet do this, mark that milestone's provenance coverage PARTIAL until a focused PR adds it.
5. New workflow paths are included in the common gate's triggers so CI changes are themselves tested.

## Implementation order

1. Establish and validate the shared quality-gate provenance artifact.
2. Validate M6 APK provenance without changing the M6 build architecture.
3. Fix M1 security test failures and prove boundary/adversarial cases.
4. Inventory all existing workflows and link each one to the applicable milestone(s).
5. Add provenance to existing APK-producing workflows one focused PR at a time.
6. Add or repair targeted framework gates in roadmap order; do not start M7 before M6 PASS.
7. Complete M11 reliability/security coverage, then M12 end-to-end acceptance.

## Governance safeguards

- Keep the approved M1–M12 roadmap and current three-layer product architecture intact.
- Do not merge unrelated feature branches or divergent stacks wholesale.
- Every change is a focused PR against `main`; use exact commit/run/artifact evidence before merge.
- Do not use an old APK to validate a newer source commit.
- Preserve `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, and `SKIPPED` as distinct statuses.
- CI success is not real-device success. If required device evidence is unavailable, record `BLOCKED`.
