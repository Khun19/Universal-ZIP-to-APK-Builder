# Development Readiness Audit — Universal ZIP-to-APK Builder

- Audit date: 2026-10-12
- Scope: repository state, PR #38, GitHub Actions, tests/security evidence, M6 runtime acceptance, capability registry, and UI/UX direction
- Mode: read-only audit before this branch; proposed workflow/document changes are isolated on `feat/reliability-quality-gates-audit`
- Merge policy: PR #38 remains open and Draft; no branch is merged by this work
- M6 status: **BLOCKED / NOT PASS** until current APK passes physical-device launch, UI rendering, and required interaction checks

## Executive findings

1. PR #38 is documentation-only and remains Draft/Open. Its head is `176b62e4fb25107fd6d976855be27007001fac49`; it has not been merged.
2. PR #38's CodeQL jobs passed, but the unrelated `Test A runtime bridge finalization` job failed before dependency install, typecheck, or tests.
3. The failure is reproducible in workflow logs: the workflow's normalization step rewrites `scripts/patch-test-a-directory-picker.py` into code that references `old_call` without defining it, raising `NameError: name 'old_call' is not defined`. The workflow is currently configured for every pull request targeting `main`, despite being a Test A-specific finalization workflow.
4. The M6 cloud build at commit `3907c23e93294f1fc1d061edf32a50db18cfb993` succeeded and produced an APK. This proves cloud build and the test's APK checks only; the device runtime gate has not been proven by this CI run.
5. The M6 integration test runs native build/structural assertions only when `RUN_ANDROID_INTEGRATION=1`. Its device install/launch block additionally requires `RUN_ANDROID_INSTALL=1` and a working `adb` or `rish` control path. A cloud-hosted runner cannot control the user's physical phone by default.
6. The root test matrix lists security cases, but checkboxes in a document are not execution evidence. CI must run executable tests for traversal, symlink escape, file-count/size/compression limits, APK structure, and strategy selection.
7. The UI prototype under `artifacts/zip-to-apk-builder` is a React/Vite application with separate pages for upload/analysis, build console, success/failure, history, projects, environment, and settings. Its `App.tsx` imports generated `@workspace/api-client-react` hooks for health, project, build, logs, analysis, and artifact download. Before this UI is treated as the phone-first product, verify that it is not mandatorily coupled to the legacy API server and that all status is derived from real build state rather than demo data.
8. Repository metadata still exposes a Replit homepage and the root manifest includes `@replit/connectors-sdk`. This is a cleanup/audit candidate, not sufficient proof by itself that the dependency is unused or safe to remove.

## Verified evidence

### PR #38
- URL: https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/38
- State: open, Draft, not merged
- Head commit: `176b62e4fb25107fd6d976855be27007001fac49`
- Changed files: `docs/ARCHITECTURE.md`, `docs/CLOUD-TOOLCHAIN-CAPABILITY-REGISTRY.md`
- Checks: CodeQL and language analysis succeeded; `finalize` failed at the Android SAF patch step.

### M6 build artifact
- Workflow run: https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38099400322
- Branch: `fix/m6-g10-theme`
- Commit: `3907c23e93294f1fc1d061edf32a50db18cfb993`
- Result: cloud build succeeded; APK artifact uploaded.
- Artifact URL: https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38099400322/artifacts/11687270906
- Artifact ZIP size: 33,989,585 bytes
- APK SHA-256 from job log: `9b4bba3b457a95424e4f99ada57d2db5e0d33e879e740776790297e19ec86cfb`
- Device install/launch/UI/interactions: **NOT VERIFIED by this CI run**.

### Repository checks
- Main branch currently has three workflow files: CodeQL, Test A runtime finalization, and one-time Test A directory-picker patch runner.
- The M6 branch additionally has `.github/workflows/ubuntu-m6-build-test.yml`.
- The repository's `docs/VALIDATION-WORKFLOW.md` correctly distinguishes CI, Termux, and real-device evidence.
- Branch-protection settings could not be read through the connected GitHub integration; required status checks are therefore **unknown**, not assumed absent.

## Required quality gates

1. **Source and dependency integrity** — exact commit SHA; frozen lockfile install; pinned runtime/package manager; no accidental lockfile edits.
2. **Static checks** — typecheck and workspace build must run on applicable PRs.
3. **Unit/regression tests** — executable analyzer, strategy, pipeline, extractor/security, API/UI-state, and template tests.
4. **ZIP security** — absolute/traversal/drive/NUL path handling, symlink escape, archive bomb/resource limits, extraction containment, entry count, and cleanup after failure.
5. **Strategy correctness** — evidence-based detection; explicit adapter selection; unsupported/ambiguous inputs return truthful BLOCKED/UNSUPPORTED rather than silently substituting a wrapper.
6. **Real APK build** — framework-specific fixture, pinned/recorded toolchain, deterministic APK discovery, and retained failure logs.
7. **APK validation** — archive integrity, manifest/package identity, required native libraries/assets, signature verification where applicable, size, and SHA-256.
8. **Provenance** — source commit, fixture/input digest, runner image, Java/Node/package manager/SDK/NDK/Gradle/framework versions, build command, exit code, APK metadata/hash, and logs.
9. **Physical-device runtime** — install, launch, expected UI render, core interaction, and crash/ANR observations; must be recorded separately from CI.
10. **Security/permissions** — least-privilege workflow permissions, third-party action pinning policy, no secrets in ZIP/logs/artifacts, isolated untrusted builds, and bounded time/resource use.
11. **Network resilience** — bounded retries with backoff for transient failures only, timeout, resumable/verified transfers where supported, cache integrity, and clear distinction between source errors and provider/quota outages.
12. **Goal-alignment audit** — preserve the three canonical product layers and prevent legacy API/database/queue/worker/Docker/Replit components from becoming mandatory product architecture without an ADR.

## UI/UX direction to validate before implementation

- Mobile-first, ZIP-first home screen with one primary action and recent build results.
- Project analysis summary before build: detected framework/version, confidence/evidence, required toolchain, and supported execution route.
- Honest staged progress: Analyze → Prepare → Build → Validate → Ready; do not fabricate percentages.
- Clear error classes: invalid/unsafe ZIP, unsupported project, dependency/build error, network outage, quota/credentials, APK validation failure.
- Developer Mode with collapsible logs and copyable diagnostic bundle.
- Result screen that distinguishes Build Passed, APK Validated, Device Installed, and Device Runtime Verified.
- Show APK size, package ID, version/SDK details where reliably extracted, SHA-256, source commit, and download action.
- Accessible tap targets, readable text on small screens, keyboard/screen-reader labels, and recoverable upload/download errors.
- Keep UI independent from a specific build provider through a stable Builder client contract. Confirm the generated API client does not force a retired server into the canonical product flow.

## Implementation order

### Step 1 — Audit and CI baseline
- Keep PR #38 unmerged.
- Fix the unrelated Test A workflow trigger/normalization defect in a focused PR.
- Add a normal repository quality workflow for frozen install, typecheck, tests, and workspace build.
- Record CI status and branch-protection limitation.

### Step 2 — M6 physical-device acceptance
- Use only an APK built from the exact M6 commit being validated.
- Compare APK SHA-256 with the workflow evidence.
- Install on the user's Android phone; verify launch, React Native initialization, visible UI, and a defined interaction.
- On failure, preserve the exact screenshot/log and remain M6 BLOCKED/FAIL; do not begin framework expansion.

### Step 3 — Reliability foundation
- Turn security and APK checklist items into executable regression tests and required CI jobs.
- Add a shared build evidence/provenance schema and consistent status semantics.
- Add bounded network retries, timeout/cancellation, cache policy, and artifact retention policy only where tests demonstrate the behavior.
- Keep provider-specific logic behind adapters; do not implement multi-provider routing in this phase.

### Step 4 — UI/UX foundation
- Audit the existing React/Vite screens and their data source; remove no dependencies until usage and migration impact are verified.
- Define a stable build-state/client contract and implement mobile-first UX in a separate focused branch.
- Add UI tests for upload/analyze/build/error/retry/download flows, with no demo fixture counted as build evidence.
- Perform usability checks on a narrow phone viewport before declaring the UX accepted.

## Acceptance rule

No phase is marked PASS from documentation alone. Each phase needs a commit SHA, CI run, applicable test outputs, and device evidence where runtime is part of the criterion. PR #38 remains unmerged until reviewed separately. Multi-provider routing remains deferred until M6 passes and the shared capability/security/provenance contracts are validated.
