# M1–M12 GitHub Actions Coverage Matrix

**Purpose:** Incrementally align the existing repository and workflows with the approved `ROADMAP.md` without renumbering milestones, replacing the canonical architecture, or claiming unverified completion.

**Authority:** `ROADMAP.md` remains the sole milestone source of truth. This matrix tracks CI coverage; it does not redefine milestone scope or mark milestones PASS.

## Evidence states

- **Present / partial** — an existing workflow or test covers only part of the gate; inspect its exact commit and logs.
- **Planned** — required coverage has not yet been established by this matrix.
- **PASS** — may be recorded only with a successful run on the exact candidate commit and the required artifact/test evidence.
- **BLOCKED** — required runner, SDK, device, fixture, or other prerequisite is unavailable.
- **NOT RUN** — no qualifying evidence has been produced.

A green workflow is not equivalent to a milestone PASS. Device/runtime criteria remain separate from CI.

## Milestone coverage

| Milestone | Approved scope from `ROADMAP.md` | GitHub Actions coverage target | Additional acceptance evidence | Initial coverage assessment |
|---|---|---|---|---|
| M1 | Foundation, ZIP security, artifact integrity | Typecheck; focused ZIP-security tests; adversarial boundary/collision/path/symlink tests; extraction cleanup; security checks | Exact-limit and limit-plus-one results; actual streamed bytes; malformed archive handling; APK validation/hash tests where applicable | Present / partial; PR #54's Builder Quality Gates, CodeQL, M5, and M6 build checks pass on the latest recorded head, but the M6 isolated Community Chat workflow fails; ZIP-limit boundary coverage still needs review with PR #51 |
| M2 | Universal analyzer and strategy registry | Unit tests for each detection signal, nested roots, confidence/ambiguity, deterministic strategy selection, unsupported-project diagnostics | Fixture-to-detection report and selected strategy evidence | Planned; inventory existing tests before adding jobs |
| M3 | Static Web → APK | Static web fixture build on Ubuntu; APK discovery/structure/hash checks; upload artifact | Install/launch evidence when required by the gate | Planned / needs coverage audit |
| M4 | React/Vite/PWA → APK | Representative React/Vite/PWA fixtures; pinned Node/package manager; native wrapper build; artifact checks | Fixture matrix and device/runtime result where required | Planned / needs coverage audit |
| M5 | Flutter → APK | Pinned Flutter/JDK/Android SDK; official Flutter Android build; APK structure and SHA-256; upload artifact | Install/launch evidence on supported device where required | Planned / needs coverage audit |
| M6 | React Native → APK | Existing Ubuntu M6 build workflow; frozen dependency install; React Native pipeline test; APK artifact and SHA-256 | Install, launch, initialization, UI render, and interaction evidence are distinct from build CI | Present / partial; inspect current workflow and exact run evidence |
| M7 | Expo → APK | Add only after M6 is accepted; pinned Expo/React Native toolchain and representative Expo fixtures | Real APK provenance and runtime evidence | Gated; not to be started before M6 PASS |
| M8 | Capacitor/Ionic/Cordova → APK | Framework-specific official Android build paths; fixture tests; APK structure/hash/artifact | Install/launch where required | Planned |
| M9 | Native Android Kotlin/Java → APK | Gradle/JDK/SDK build fixtures; manifest/package validation; artifact and checksum | Install/launch where required | Planned |
| M10 | Additional frameworks and special project types | Add a separate job/fixture per explicitly supported strategy; unsupported projects must fail diagnostically | Compatibility evidence per strategy; no universal compatibility claim without results | Planned; strategy-by-strategy only |
| M11 | Diagnostics, reliability, production security | Regression suite; timeout/resource/cancellation/error-path tests; dependency/security checks; artifact provenance checks | Failure logs, reproducibility and recovery evidence | Planned / needs coverage audit |
| M12 | Standalone Android Builder product and final E2E | End-to-end fixture matrix from ZIP through analysis/build/validation/artifact delivery; fail on missing mandatory outputs | Required install/launch checks and complete evidence record for each mandatory fixture | Planned; final acceptance only after upstream gates |

## Incremental implementation order

1. **Baseline and workflow inventory:** inspect `.github/workflows/`, root/package scripts, test fixtures, and the current `main` commit. Do not delete or replace workflows during inventory.
2. **M1 first:** resolve the current PR #54 merge conflict, review the streaming extraction/resource-limit implementation against PR #51 boundary tests, and require both exact-head CI evidence and below/equal/above-limit tests before accepting the gate.
3. **Shared quality checks:** establish one non-duplicated Ubuntu workflow for lockfile install, typecheck, unit tests, and workspace build, reusing existing scripts and preserving specialized workflows.
4. **Artifact contract:** for build workflows, require the expected artifact, record the exact source SHA and toolchain, and publish SHA-256. Missing mandatory artifacts fail the job.
5. **M2 tests:** make analyzer/strategy behavior deterministic before widening framework jobs.
6. **Framework gates in roadmap order:** add or repair one milestone workflow at a time. Keep M7 blocked until M6 acceptance is explicit.
7. **M11/M12 hardening:** add reliability and end-to-end coverage after the underlying framework paths have evidence.
8. **Review and merge:** every change is a focused PR based on `main`; merge only after required checks and scope review pass. Never merge a divergent feature stack wholesale.

## Guardrails

- Preserve the existing three-layer architecture documented in `ROADMAP.md`: Android Builder UI, Termux Environment Setup, GitHub Builder Code. GitHub Actions is the development/CI execution environment; it does not silently replace the product's runtime architecture.
- Do not renumber or redefine M1–M12 in this matrix.
- Do not claim device validation from an Ubuntu build.
- Do not use an old APK as evidence for a newer commit.
- Do not treat a skipped test, absent artifact, or uninspected workflow as PASS.
- Do not add M13+ for CI tasks; improve the acceptance evidence inside the existing milestone structure.
- Update this matrix only when workflow/test evidence changes, and include the run URL and commit SHA in the associated validation record.
