# Repository, Milestone, Architecture & Roadmap Audit — 2026-10-15

**Repository:** [Khun19/Universal-ZIP-to-APK-Builder](https://github.com/Khun19/Universal-ZIP-to-APK-Builder)  
**Canonical branch:** `main`  
**Audit baseline:** `12eca7d7c94fb31000a82a5bf8cf07773c05d17c`  
**Method:** GitHub-connected repository metadata, README, roadmap, architecture, validation workflow, test matrix, quality/security standards, M6 acceptance report, recent commits, branches, and open PR inventory.  
**Scope limitation:** This audit did not run Termux commands or independently operate the physical Android device. Runtime claims are limited to the evidence already recorded in the repository and user-reported test results.

## 1. Executive decision

**Overall: PARTIAL — milestone integration and evidence reconciliation still required.**

The current `main` contains the canonical three-layer architecture, official-flow adapter principles, framework detection/build-path integration, and build-quality documentation. However, repository-wide completion cannot be claimed: M1 has an unresolved ZIP resource/memory-bound issue; M2–M5 require complete, exact-commit acceptance evidence; M6 must be revalidated on a fresh APK built from the exact current-main SHA after the known AppCompat launch-crash history; M7 remains gated; M8–M12 do not have complete acceptance records in this audit.

A green CI run, a passing APK from another branch, or a user-reported test of another fixture must not be substituted for the exact commit and fixture being accepted.

## 2. Source-of-truth state

- Default branch: `main`.
- Baseline commit: [`12eca7d7c94fb31000a82a5bf8cf07773c05d17c`](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/commit/12eca7d7c94fb31000a82a5bf8cf07773c05d17c).
- This commit records the merge of the main-based M2–M6 framework detection/build-path integration after its stated Quality Gates, CodeQL, and M6 APK integration build passed.
- `README.md`, `ROADMAP.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, `docs/VALIDATION-WORKFLOW.md`, `docs/TEST-MATRIX.md`, `docs/BUILD-QUALITY-SECURITY-STANDARDS.md`, and `docs/ADR/` remain the controlling specifications for their respective concerns.
- `ROADMAP.md` is the only milestone scope source of truth. The current-state table added to it is an evidence snapshot and does not change milestone numbering or acceptance gates.

## 3. Architecture audit

### Keep — approved canonical architecture

The existing architecture is aligned with the product goal and should not be replaced by a new backend architecture:

1. **Layer 1 — Android Builder UI:** phone-first user experience, truthful build status, APK delivery, and optional developer diagnostics.
2. **Layer 2 — Termux Environment Setup:** phone-local setup, toolchain detection, and diagnostics.
3. **Layer 3 — GitHub Builder Code:** ZIP security, analyzer, strategy registry, Official Flow Adapters, build engine, APK validation, tests, and evidence.

Required pipeline:

`ZIP → Security Validation → Project Detection/Evidence → Strategy Selection → Environment Preparation → Real Framework Build → APK Discovery/Validation → SHA-256/Provenance → Delivery → Device Runtime Validation where required`

### Enforce these boundaries

- Preserve real framework build semantics through Official Flow Adapters.
- Keep project detection separate from verified support claims.
- Keep shared execution/isolation/security separate from framework-specific strategy code.
- Treat CI, Termux execution, APK validation, install, launch, UI rendering, and touch interaction as distinct evidence stages.
- Keep `artifacts/api-server/`, `lib/db/`, `lib/build-queue/`, `worker/`, Docker/container infrastructure, and Replit-specific components secondary/legacy. Do not make them required product layers without an explicit ADR.
- UI progress and success states must be derived from actual build-engine state. No fake percentages, mock build evidence, silent WebView substitution, or success before APK validation.

### Architecture gaps to track

- Verify all current strategies conform to one shared build lifecycle and structured result/evidence contract.
- Ensure cancellation, timeouts, child-process cleanup, workspace isolation, resource limits, and failure cleanup are common engine responsibilities.
- Ensure environment paths and tool versions are detected rather than hard-coded.
- Add a consistent support classification: `SUPPORTED AND VERIFIED`, `BUILD VERIFIED / DEVICE NOT VERIFIED`, `EXPERIMENTAL`, `UNSUPPORTED`, and `BLOCKED`.
- Do not implement a new backend, queue, or hosted build service as a shortcut for the phone-first goal.

## 4. Milestone state

| Milestone | State at audit | Main gap |
|---|---|---|
| M1 | PARTIAL / NOT PASS | Open PRs #54 and #51 cover archive limits/boundaries; AdmZip's buffer-based inflation leaves a hard process-memory-bound limitation unresolved. |
| M2 | PARTIAL | Main-based framework detection/build paths exist; full analyzer fixtures, ambiguity handling, and deterministic unsupported diagnostics need a recorded gate. |
| M3 | NOT GATE-PASS VERIFIED | Need current-main static-web fixture → real APK → hash/provenance → phone install/launch evidence. |
| M4 | PARTIAL | Open PR #57 proposes isolated Vite/PWA APK acceptance; both required fixtures and runtime behaviors must be recorded. |
| M5 | PARTIAL | Open PR #58 proposes isolated Flutter acceptance; no cross-milestone substitution and no acceptance without exact artifact/provenance plus phone runtime evidence. |
| M6 | IMPLEMENTATION IN MAIN; EXACT-MAIN DEVICE GATE BLOCKED | Fresh APK from exact current main SHA must pass install, launch, UI rendering, and touch interaction. The Community Chat Demo report is fixture-specific and must not be treated as proof for a different current-main APK. |
| M7 | NOT STARTED / GATED | Wait for M6 current-main device gate and reviewed RN-1…RN-6 compatibility evidence. |
| M8 | NOT GATE-PASS VERIFIED | Capacitor, Ionic, Cordova fixtures plus permissions/plugin runtime acceptance. |
| M9 | NOT GATE-PASS VERIFIED | Kotlin and Java native fixtures plus device acceptance. |
| M10 | NOT STARTED AS VERIFIED SUPPORT | One target at a time; real strategy, fixture, build, APK, and runtime evidence. |
| M11 | PARTIAL | Standards exist; security, isolation, concurrency, diagnostics, recovery, and regression gates still need evidence. |
| M12 | NOT GATE-PASS VERIFIED | Standalone UI must be backed by real state and pass mandatory end-to-end fixtures. |

## 5. Open PR triage — observed on 2026-10-15

PR state is a snapshot; always refresh before merging.

### Highest priority

- [PR #37 — AppCompat theme fix](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/37): verify the minimal theme fix and regression assertion against the current-main integration. It does not count as device acceptance until the resulting exact-commit APK is tested.
- [PR #54 — configurable ZIP resource limits](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/54) and [PR #51 — ZIP limit boundary tests](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/51): reconcile overlapping scope; explicitly resolve or retain the memory-bound limitation as a blocking security gap.
- [PR #56 — shared quality gates and artifact provenance](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/56): inspect exact-head CI and provenance artifacts before merge.
- [PR #57 — M4 Vite/PWA acceptance](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/57) and [PR #58 — M5 Flutter acceptance](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/58): keep each milestone isolated; verify exact artifact hash/provenance and do not infer physical-device success from CI.

### Community Chat Demo / divergent M6 PR stack

PRs #44 and #43 remain open; PRs #42, #40, #36, and related M6 work also appear as open branches/PRs. Do not merge an inherited stack wholesale. Compare each change against current `main`, port only the minimum required change onto a clean main-based branch, and run current-head checks. Preserve the Community Chat Demo fixture evidence as a separate fixture record.

### Documentation / dependencies

- [PR #55 — GitHub Actions validation alignment](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/55): review against the current README/roadmap/workflows; avoid duplicate or conflicting policy.
- [PR #53 — Multer dependency update](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/53) and [PR #23 — grouped dependency update](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/23): run complete workspace tests; treat major frontend/build-tool changes as compatibility work, not routine patch updates.
- PR #25 dashboard UI and PR #38 toolchain capability registry require checks that mock state stays separate and no hosted backend becomes an implicit product requirement.

Do not bulk-close old PRs or delete branches as part of this documentation change. Check unique commits, PR dependencies, and recovery value first.

## 6. Immediate development sequence

### P0 — M6 current-main device acceptance

1. Confirm the exact `main` SHA used for the build.
2. Build a fresh APK from that exact commit after the required theme fix is integrated.
3. Record APK filename, size, package ID, SHA-256, CI run/artifact ID, and provenance.
4. Install that APK on the target Android phone.
5. Launch it and verify no AppCompat/ReactHost crash.
6. Verify expected UI rendering and exercise a meaningful touch interaction.
7. Save screenshots/logs and record PASS/FAIL per gate.
8. If any gate fails, remain on M6 and fix only the confirmed root cause.
9. Do not start M7/Expo until the M6 gate and RN compatibility review are explicitly accepted.

### P1 — M1 security

1. Inspect PR #54 and #51 diffs/checks on their exact heads.
2. Verify separate tests for archive file-count, aggregate uncompressed size, per-entry size, compression ratio, path depth, duplicate/case-colliding paths, symlinks/special files, malformed ZIPs, and staging cleanup.
3. Resolve the AdmZip pre-inspection buffer inflation risk with a streaming/bounded extraction approach, or explicitly keep the security milestone blocked. Metadata checks alone are not a hard memory bound.
4. Run adversarial tests and general quality gates before merge.

### P1 — per-milestone acceptance

For M2–M5, build a main-based acceptance sequence with exact source ZIP hashes, detector evidence, toolchain versions, APK structural/manifest validation, SHA-256, provenance, and the required Termux/device evidence. Never reuse a prior milestone's APK as evidence for a later commit.

### P2 — UI integration

- Wire the UI to actual build state and logs.
- Display the detected framework, chosen strategy, active phase, actionable errors, APK validation, checksum, and delivery state.
- Keep detailed logs in Developer Mode by default; ordinary user flow should stay simple.
- Add a test proving demo/mock fixtures cannot set real build state to PASS.

### P3 — repository hygiene

- Port useful changes from divergent branches through focused PRs.
- Remove duplicate/legacy branches only after checking dependencies and preserving unique work.
- Review unused Replit/backend residues separately; don't mix broad cleanup with a runtime/security fix.
- Keep dependencies pinned/reproducible and update the lockfile only with the intended package-manager workflow.

## 7. Required evidence record

For every acceptance run, retain:

- milestone/test ID and fixture name;
- fixture ZIP SHA-256;
- branch and exact commit SHA;
- workflow run and artifact ID/URL;
- detected project type and confidence/evidence;
- selected strategy and build command;
- toolchain/dependency versions;
- build exit code and relevant logs;
- APK filename, byte size, package ID, structural validation, and SHA-256;
- install result;
- launch result;
- UI rendering result;
- touch/feature interaction result;
- device model/Android version where applicable;
- limitations, skipped gates, and root-cause notes.

Use `PASS`, `FAIL`, `BLOCKED`, and `NOT RUN` exactly. Do not mark a whole milestone PASS when a mandatory row is missing.

## 8. Goal-alignment result

**ALIGNED with required corrections.**

The three-layer phone-first architecture and Official Flow Adapter principle remain appropriate. The immediate deviation risk is false completion: CI builds, fixture-specific evidence, and current-main device acceptance can be conflated. The roadmap status snapshot and M6 report qualification added in this change make that boundary explicit. No framework expansion or architecture replacement is authorized by this audit.
