# Repository Overall Audit — 2026-10-14

**Repository:** [Khun19/Universal-ZIP-to-APK-Builder](https://github.com/Khun19/Universal-ZIP-to-APK-Builder)  
**Audit snapshot:** 2026-10-14 (GitHub API through connected repository access)  
**Default branch:** `main`  
**Main HEAD at audit:** `285b71e3b47217830ed465fb39e0d08639f57060`  
**Purpose:** Overall M1-to-current milestone status, branch/PR reconciliation, CI evidence, architecture and next actions.

> This is a repository-state audit, not a claim that every local/Termux test was run. CI and device evidence are distinguished. No feature code was changed by this audit.

## Executive verdict

**Overall status: PARTIAL / INTEGRATION BLOCKED.** The repository has meaningful documentation and a user-reported M6 Community Chat Demo device acceptance, but the passing M6 implementation is not yet reconciled into canonical `main`. Multiple open PRs form dependent stacks on feature/test branches. Do not merge those stacks wholesale.

### Snapshot

- 93 branches visible in GitHub.
- 23 open PRs (of which several target non-`main` branches).
- 3 open issues.
- Main tree contains 414 tracked entries at this snapshot.
- Main HEAD: `285b71e3b47217830ed465fb39e0d08639f57060`.
- Latest `main` CodeQL run observed: [38488198137](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38488198137), conclusion **success**.
- The M6 Community Chat Demo CI run [38482622301](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38482622301) passed on the PR branch, and the user reported install/launch/RN initialization/UI/Counter PASS. The source PR #44 remains a draft based on `test/community-chat-demo-builder-apk`, not `main`.
- PR #45's documentation standards were merged; merge commit `285b71e3b47217830ed465fb39e0d08639f57060`. The standards explicitly do not imply every security control is implemented.

## Main and branch integration risk

### Canonical truth

`main` is the stable branch by `AGENTS.md`. Build and runtime support must be evaluated from the code, fixture, tests and evidence that exist at the exact main commit—not by a feature branch's green CI alone.

### Major divergence evidence

| Branch | Compare vs main | Files changed in comparison | Risk / disposition |
|---|---:|---:|---|
| `test/community-chat-demo-builder-apk` | 118 ahead / 13 behind | 60 | Do not merge wholesale; isolate minimal RN implementation and fixture changes. |
| `feat/framework-specific-platform-generators` | 138 ahead / 13 behind | 64 | Large inherited stack; review adapter architecture and port only independently justified changes. |
| `feat/m6-react-native-canonical` | 66 ahead / 6 behind | 63 | Valuable RN implementation source, not merge-ready as one unit. |
| `feat/m6-official-rn-build-backend` | 39 ahead / 13 behind | 51 | Audit the minimal official-flow adapter diff and tests. |
| `feat/m6-g10-launch-validation` | 73 ahead / 13 behind | 48 | G10 is downstream of G7–G9; reconcile gates on main in a deliberate sequence. |
| `fix/m6-g10-theme` | 89 ahead / 13 behind | 50 | Do not merge the inherited stack for a theme fix. |
| `feat/m6-toolchain-preflight-evidence` | 72 ahead / 6 behind | 63 | Useful preflight/evidence work, but large inherited stack. |
| `feat/m3-flutter-direct-build` | 19 ahead / 13 behind | 26 | Reconcile against current main; no wholesale merge. |
| `feat/m5-flutter-direct-build` | 21 ahead / 13 behind | 34 | Reconcile direct Flutter flow and fixture on a focused branch. |
| `feat/m1-foundation-security-artifact-integrity` | 16 ahead / 6 behind | 69 | Broad architectural/dependency changes; do not treat as a focused M1 patch. |
| `feat/m1-core-zip-to-apk-hardening` | 5 ahead / 13 behind | 4 | Small diff, but rebase and regression-test first. |
| `feat/m2-web-wrapper-hardening` | 1 ahead / 13 behind | 3 | Small candidate; check if its change is still missing from main. |
| `feat/reliability-quality-gates-audit` | 9 ahead / 5 behind | 6 | Strong review candidate for ZIP extraction regression tests and CI gates; draft and must be rebased/tested. |
| `feat/rz-premium-dashboard-v1` | 4 ahead / 5 behind | 3 | UI-only change; review mobile behavior and mock-data separation. |
| `fix/m3-flutter-termux-runtime-main` | 22 ahead / 6 behind | 13 | Review current Dart/Termux failure and port a minimal fix, separate from M5 acceptance. |
| `chore/repo-consolidation-foundation-v2` | 1 ahead / 5 behind | 10 | Old foundation PR stack; reconcile with current canonical docs. |
| `dependabot/npm_and_yarn/npm_and_yarn-9d0c0715ee` | 1 ahead / 5 behind | 3 | Includes Vite 7 → 8 major version change; require full compatibility CI before merge. |

**Interpretation:** most feature branches are diverged, not clean fast-forward candidates. Ahead/behind counts are commit-graph facts, not a measure of code quality. The per-file diff should be reviewed on a focused, rebased PR before merging.

## M1–M12 status assessment

The roadmap defines scope and gates, but it does not itself prove that a gate passed. This table separates what is documented from what this snapshot proves.

| Milestone | Scope | Audit status | Evidence / gap |
|---|---|---|---|
| M1 | Foundation, ZIP security, environment, APK integrity | **PARTIAL / NOT GATE-PASS VERIFIED** | Security module and tests exist, but the main test matrix still has unchecked adversarial security cases. PR #39 adds stronger extraction checks, regression cases and quality-gate workflow; it is draft. |
| M2 | Analyzer and strategy registry | **PARTIAL** | Analyzer/strategy tests exist. Current main support claims must match actual adapter implementations; framework detection alone is not support evidence. |
| M3 | Static Web → APK | **NOT VERIFIED BY THIS SNAPSHOT** | Roadmap requires a real static-web fixture plus generated APK install/launch evidence. Keep prior user/device reports separate from canonical main evidence. |
| M4 | React/Vite/PWA → APK | **PARTIAL / DEVICE GATES UNCLEAR** | Web builder and PWA-related tests/fixtures exist, but the roadmap's two required ZIP fixtures and full runtime evidence are not shown as completed in the main acceptance docs. |
| M5 | Flutter → APK | **NOT GATE-PASS VERIFIED ON MAIN** | Flutter direct-build implementation and Termux Dart recovery exist in feature branches/PR #16; rebase, run exact real Termux build and install/runtime tests before claiming main support. |
| M6 | React Native → APK | **PASS FOR ONE REPORTED FIXTURE; MAIN INTEGRATION BLOCKED** | `docs/M6-ACCEPTANCE-REPORT.md` records Community Chat Demo CI PASS and user-reported physical-device install/launch/RN/UI/Counter PASS. But PR #44 is still draft and targets a test branch; RN code/fixture are not yet a clean main-based integration. Do not generalize to all RN projects. |
| M7 | Expo → APK | **NOT STARTED / GATED** | Must wait for RN-1 through RN-6 compatibility matrix and an explicit M7 decision. |
| M8 | Capacitor/Ionic/Cordova | **NOT GATE-PASS VERIFIED** | Contract/strategy documentation exists; no complete fixture-by-fixture acceptance evidence was found in the canonical main docs reviewed. |
| M9 | Native Android Kotlin/Java | **NOT GATE-PASS VERIFIED** | Native Gradle path exists in the architecture; a complete source-ZIP fixture and runtime acceptance record are still required for a formal claim. |
| M10 | Additional frameworks/special project types | **NOT STARTED AS ACCEPTED SUPPORT** | Add only one framework at a time with its own official flow, fixture and acceptance evidence. |
| M11 | Diagnostics, reliability, production security | **IN PROGRESS / NOT GATE-PASS VERIFIED** | Standards are documented. ZIP hardening and quality-gate automation are proposed in draft PR #39; documented requirements must not be mistaken for implemented checks. |
| M12 | Standalone Android Builder product and final E2E | **NOT COMPLETE** | UI prototype exists; dashboard PR #25 is open, and the repository still contains `artifacts/zip-to-apk-builder/src/services/mockData.ts`. UI demo data is not proof of a real end-to-end product. |

### M6 evidence boundary

- PR #44: [Fix Community Chat Demo ZIP missing Android Gradle project](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/44) — **open draft**, base `test/community-chat-demo-builder-apk`.
- CI: [Run 38482622301](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/38482622301) — success for that PR revision.
- User-reported device gates are recorded in [M6 acceptance report](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/blob/main/docs/M6-ACCEPTANCE-REPORT.md); report clearly labels the device results as user-reported, not independently captured.
- Required next step: a fresh, focused main-based RN integration PR with a minimal change set, current lockfile, regression tests and CI. Then pull that exact SHA in Termux and record device evidence.

## CI and validation findings

1. The latest main CodeQL run passed. This is security scanning evidence, not proof that all tests/builds passed.
2. Main currently lists only three workflow files: `.github/workflows/codeql.yml`, `.github/workflows/fix-test-a-runtime-final.yml`, and `.github/workflows/one-time-test-a-directory-picker.yml`. A general builder quality-gates workflow is proposed in PR #39, not on main.
3. PR #45's CodeQL passed, but its `Test A runtime bridge finalization` run failed. Because PR #39 proposes removing the PR trigger for that one-off workflow, review workflow scoping so documentation PRs are not blocked by unrelated runtime-finalization automation.
4. `package.json` provides typecheck/build/test scripts; those scripts existing is not proof that they passed at the audited SHA.
5. The main test matrix has unchecked security cases for absolute paths, traversal, drive paths, symlink escape, file-count/size limits, compression ratios, timeout/cleanup and other hardening. Track each as implemented/tested/CI-verified separately.
6. Main's root `package.json` still includes `@replit/connectors-sdk`, and legacy `artifacts/api-server`, `lib/db`, `worker`, Docker and Replit files remain. Architecture documents classify them as Secondary/Legacy, but cleanup/ownership decisions are not fully reconciled. Avoid expanding this architecture without an ADR.

## Open PR triage — all 23 open PRs

The following is a triage recommendation, not an approval or merge operation.

| PR | Title | Base ← head | State | Recommended action |
|---|---|---|---|---|
| [#44](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/44) | Fix Community Chat Demo ZIP missing Android Gradle project | `test/community-chat-demo-builder-apk` ← `fix/community-chat-rn-android-scaffold` | Draft | HOLD / DO NOT MERGE WHOLE BRANCH: based on test/community-chat-demo-builder-apk; preserve the fixture PASS, then port minimal RN changes to main via a fresh focused branch. |
| [#43](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/43) | Fix Community RN APK JS bundle generation | `feat/framework-specific-platform-generators` ← `fix/community-chat-rn-js-bundle` | Ready | HOLD: based on framework-generator branch; review generator semantics and port only after canonical strategy contract is agreed. |
| [#42](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/42) | Add framework-specific Android platform generators | `test/community-chat-demo-builder-apk` ← `feat/framework-specific-platform-generators` | Draft | HOLD / DO NOT MERGE WHOLE BRANCH: base is test/community-chat-demo-builder-apk and the diff inherits a large M6 stack. |
| [#40](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/40) | test(m6): add runtime interaction acceptance fixture | `fix/m6-g10-theme` ← `fix/m6-runtime-interaction` | Draft | HOLD: runtime-interaction test is based on fix/m6-g10-theme; rebase after the canonical RN path lands on main. |
| [#39](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/39) | security/ci: harden ZIP extraction and add quality gates | `main` ← `feat/reliability-quality-gates-audit` | Draft | HIGH PRIORITY REVIEW: security ZIP extraction + regression tests + quality-gates workflow; draft and diverged, rebase to main and run all gates before merge. |
| [#38](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/38) | docs: define hybrid cloud toolchain capability registry | `main` ← `docs/cloud-toolchain-capability-registry` | Draft | LOW PRIORITY / REVIEW SCOPE: capability registry docs; ensure it does not introduce a competing cloud/hosted architecture. |
| [#37](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/37) | fix(m6): use AppCompat theme for React Native activity | `main` ← `fix/m6-g10-theme` | Draft | DO NOT MERGE AS-IS: the branch carries a large inherited RN stack (89 commits ahead, 13 behind main, 50 changed files); cherry-pick theme fix into a focused main-based branch after RN scaffold exists. |
| [#36](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/36) | fix(m6): initialize ReactHost for RN runtime launch | `feat/m6-g10-launch-validation` ← `fix/m6-g10-reacthost-init` | Ready | HOLD: ReactHost fix targets feat/m6-g10-launch-validation, not main; port after selecting canonical RN implementation. |
| [#35](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/35) | test: independent React Native 0.76.9 real-device smoke test | `feat/m6-g10-launch-validation` ← `test/rn-independent-smoke-0769` | Draft | HOLD: independent RN smoke test targets an old G10 branch; retain test value but rebase/port to canonical main-based RN fixture. |
| [#33](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/33) | M6 G10 — React Native APK launch validation | `feat/m6-g9-apk-install-validation` ← `feat/m6-g10-launch-validation` | Ready | HOLD / SEQUENCE DEPENDENCY: G10 launch validation targets G9 branch; do not merge directly until G7-G9 code is reconciled with main. |
| [#32](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/32) | test(m6): add G9 Android install validation | `feat/m6-g8-apk-structural-validation` ← `feat/m6-g9-apk-install-validation` | Ready | HOLD / SEQUENCE DEPENDENCY: G9 install validation targets G8 branch; reconcile in a single canonical M6 integration plan. |
| [#31](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/31) | test(m6): make G8 APK structural validation explicit | `feat/m6-g7-native-compile-validation` ← `feat/m6-g8-apk-structural-validation` | Ready | HOLD / SEQUENCE DEPENDENCY: G8 APK structural validation targets G7 branch; reconcile before merge. |
| [#30](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/30) | test(m6): add focused native compile gate | `fix/m6-metro-pnpm-workspace-visibility` ← `feat/m6-g7-native-compile-validation` | Ready | HOLD / SEQUENCE DEPENDENCY: G7 native compile gate targets Metro workspace branch; reconcile before merge. |
| [#29](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/29) | fix(m6): expose hoisted pnpm deps to Metro | `fix/m6-babel-runtime-fixture` ← `fix/m6-metro-pnpm-workspace-visibility` | Ready | HOLD / SEQUENCE DEPENDENCY: Metro/pnpm workspace change targets Babel runtime branch; test with canonical lockfile. |
| [#28](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/28) | fix(m6): link Babel runtime in RN fixture | `fix/m6-hermes-termux-qemu` ← `fix/m6-babel-runtime-fixture` | Ready | HOLD / SEQUENCE DEPENDENCY: Babel runtime change targets Hermes QEMU branch; do not merge independently. |
| [#27](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/27) | fix(m6): run bundled Hermes through Termux QEMU | `fix/m6-rn-workspace-install` ← `fix/m6-hermes-termux-qemu` | Ready | HOLD / SEQUENCE DEPENDENCY: Hermes QEMU workaround requires explicit Termux/ARM64 justification and security review. |
| [#26](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/26) | fix(m6): restore workspace-aware hoisted pnpm install | `fix/m6-rn-runtime-validator` ← `fix/m6-rn-workspace-install` | Ready | HOLD / SEQUENCE DEPENDENCY: workspace-aware install targets runtime-validator branch; fold only if still needed by the selected implementation. |
| [#25](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/25) | feat(ui): RZ premium professional dashboard v1 | `main` ← `feat/rz-premium-dashboard-v1` | Ready | UI review only: dashboard restyle removes substantial existing layout and currently references mock data; require mobile UI review and real backend-state integration before claiming product completion. |
| [#23](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/23) | build(deps): bump the npm_and_yarn group across 2 directories with 1 update | `main` ← `dependabot/npm_and_yarn/npm_and_yarn-9d0c0715ee` | Ready | DEPENDENCY REVIEW: stale update includes Vite 7 → 8 major upgrade plus multer bump; run lockfile/typecheck/build/tests and evaluate compatibility before merge. |
| [#22](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/22) | docs: add phase 1 repository ownership inventory | `chore/repo-consolidation-foundation-v2` ← `chore/phase1-ownership-inventory` | Draft | HOLD / STALE BASE: child PR targets chore/repo-consolidation-foundation-v2; compare against canonical docs and close/retarget after preserving unique useful material. |
| [#21](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/21) | chore: establish canonical repository structure | `main` ← `chore/repo-consolidation-foundation-v2` | Draft | HOLD / STALE FOUNDATION PR: repo structure changes target main but branch is 1 commit ahead and 5 behind; reconcile with already merged canonical architecture docs before considering. |
| [#18](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/18) | feat(m6): canonical React Native implementation checkpoint | `main` ← `feat/m6-react-native-canonical` | Ready | DO NOT MERGE WHOLE BRANCH: canonical RN implementation is 66 commits ahead and 6 behind main with large lockfile/runtime/worker changes; use as source for a focused port and re-test. |
| [#16](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/pull/16) | fix(m3): recover Flutter builds when Termux Dart is not executable | `main` ← `fix/m3-flutter-termux-runtime-main` | Draft | HIGH PRIORITY M3/M5 ROOT-CAUSE REVIEW: Termux Flutter/Dart recovery branch is 22 commits ahead and 6 behind main; port minimal tested fix after validating exact current failure and keeping M3/M5 scopes separate. |

## Open issues

| Issue | Title | Labels |
|---|---|---|
| [#41](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/41) | [M6 follow-up] Build and validate isolated React Native demo ZIP | M6 |
| [#34](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/34) | Roadmap — Validated Project Generation & Framework Compatibility Platform | enhancement |
| [#24](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/24) | 🧭 Development Command Center — Milestone → PR → Termux PASS/FAIL | — |

Recommended issue order:
1. [#41 M6 follow-up](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/41): separate RN ZIP fixture validation after preserving the known M6 baseline.
2. [#24 Development Command Center](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/24): make the milestone → PR → Termux evidence loop operational and keep statuses current.
3. [#34 Framework Compatibility Platform](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/issues/34): treat as future product expansion; do not let it bypass current milestone gates.

## Branch inventory — all 93 visible branches

This is the exact branch-name/head-SHA inventory at audit time. The labels are triage hints, not automatic deletion instructions. Confirm open PR references and unique commits before deleting any branch.

| Branch | Head SHA (12 chars) | Triage group |
|---|---|---|
| `backup/main-before-universal-integration-2026-09-16` | `d5958bedc44e` | other; inspect before cleanup |
| `chore/consolidate-master-roadmap` | `6ebef288e14e` | maintenance/consolidation |
| `chore/m6-agent-handoff-prep` | `048dd0d527ae` | maintenance/consolidation |
| `chore/phase1-ownership-inventory` | `073bdc638ba8` | maintenance/consolidation |
| `chore/remove-unused-replit-connectors-sdk` | `65423a29d91c` | maintenance/consolidation |
| `chore/repo-consolidation-cleanup` | `ea2102fb0789` | maintenance/consolidation |
| `chore/repo-consolidation-foundation` | `7b099f30de91` | maintenance/consolidation |
| `chore/repo-consolidation-foundation-v2` | `d788ee56bf56` | maintenance/consolidation |
| `ci/pnpm-pin-11.23.0` | `04e661298e64` | other; inspect before cleanup |
| `dependabot/npm_and_yarn/npm_and_yarn-9d0c0715ee` | `6cba2c75e557` | other; inspect before cleanup |
| `docs/build-quality-security-standards` | `b864c0ea1220` | documentation branch |
| `docs/cloud-toolchain-capability-registry` | `176b62e4fb25` | documentation branch |
| `docs/developer-user-layer-separation` | `5df9e9a477ba` | documentation branch |
| `docs/developer-user-separation` | `92999e72e0bc` | documentation branch |
| `docs/goal-alignment-architecture-sync` | `dfc7c4e52c4f` | documentation branch |
| `docs/m0-engineering-control` | `9f042f46a869` | documentation branch |
| `docs/rz-governance` | `c2faf5c13c53` | documentation branch |
| `feat/deterministic-zip-auto-repair` | `2b57f91f671d` | other; inspect before cleanup |
| `feat/framework-agent-requirement-engine` | `11ab94fa6339` | other; inspect before cleanup |
| `feat/framework-specific-platform-generators` | `6250a5dc6024` | other; inspect before cleanup |
| `feat/m0-build-engine-formalization` | `bcc284dac150` | milestone feature; compare/port |
| `feat/m1-core-zip-to-apk-hardening` | `4866424641c4` | milestone feature; compare/port |
| `feat/m1-foundation-security-artifact-integrity` | `59a3eccfaa97` | milestone feature; compare/port |
| `feat/m2-web-wrapper-hardening` | `41f42ede2e93` | milestone feature; compare/port |
| `feat/m3-flutter-direct-build` | `db24208050fc` | milestone feature; compare/port |
| `feat/m5-flutter-direct-build` | `5df9e9a477ba` | milestone feature; compare/port |
| `feat/m6-g7-native-compile-validation` | `f9b020cc4883` | M6 branch; reconcile before merge |
| `feat/m6-g8-apk-structural-validation` | `ed0ceb865d2b` | M6 branch; reconcile before merge |
| `feat/m6-g9-apk-install-validation` | `873eb662e6db` | M6 branch; reconcile before merge |
| `feat/m6-g10-launch-validation` | `9c5c69d57d5a` | M6 branch; reconcile before merge |
| `feat/m6-official-rn-build-backend` | `9142f2080b8b` | M6 branch; reconcile before merge |
| `feat/m6-react-native-canonical` | `bcdf81ab0b30` | M6 branch; reconcile before merge |
| `feat/m6-react-native-expo-direct-build` | `f35cadcdbdad` | M6 branch; reconcile before merge |
| `feat/m6-rn-clean` | `15931faded3d` | M6 branch; reconcile before merge |
| `feat/m6-toolchain-preflight-evidence` | `39fc3a0505ee` | M6 branch; reconcile before merge |
| `feat/react-native-demo-zip` | `2104a7511f53` | other; inspect before cleanup |
| `feat/reliability-quality-gates-audit` | `f1d96b2eeeba` | other; inspect before cleanup |
| `feat/rz-premium-dashboard-v1` | `cb1c71a2c0f1` | other; inspect before cleanup |
| `feature/flutter-direct` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-direct2` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-direct3` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-direct4` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-direct` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-direct2` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-direct3` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-final` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-impl` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-impl2` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-impl3` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-impl4` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-impl5` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-hardening-work` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-mobile-integration-hardening` | `8b2758b59199` | duplicate Flutter experiment |
| `feature/flutter-patch` | `3e149315904c` | duplicate Flutter experiment |
| `feature/flutter-patch2` | `3e149315904c` | duplicate Flutter experiment |
| `feature/project-ux` | `a7445eb0ee22` | other; inspect before cleanup |
| `final-integration` | `beed581d4f77` | other; inspect before cleanup |
| `fix/community-chat-rn-android-scaffold` | `209a68d221fe` | fix branch; inspect PR/unique commits |
| `fix/community-chat-rn-js-bundle` | `f2892e3a30a3` | fix branch; inspect PR/unique commits |
| `fix/m3-flutter-termux-runtime` | `f50329969456` | fix branch; inspect PR/unique commits |
| `fix/m3-flutter-termux-runtime-main` | `748e7df213d6` | fix branch; inspect PR/unique commits |
| `fix/m6-babel-runtime-fixture` | `6883ab54bd88` | M6 branch; reconcile before merge |
| `fix/m6-g10-reacthost-init` | `bd0411c74a05` | M6 branch; reconcile before merge |
| `fix/m6-g10-theme` | `893dcd7ef84e` | M6 branch; reconcile before merge |
| `fix/m6-hermes-termux-qemu` | `bc78fb7fd2c4` | M6 branch; reconcile before merge |
| `fix/m6-metro-pnpm-workspace-visibility` | `68a0d5deb45c` | M6 branch; reconcile before merge |
| `fix/m6-react-native-runtime-crash` | `44716753917f` | M6 branch; reconcile before merge |
| `fix/m6-rn-dependency-complete` | `1fdf54dfbcdb` | M6 branch; reconcile before merge |
| `fix/m6-rn-java17-toolchain` | `5f711b3dc647` | M6 branch; reconcile before merge |
| `fix/m6-rn-runtime-validator` | `093d2c5c4cb5` | M6 branch; reconcile before merge |
| `fix/m6-rn-workspace-install` | `767f67817fa8` | M6 branch; reconcile before merge |
| `fix/m6-runtime-interaction` | `3be50649602c` | M6 branch; reconcile before merge |
| `fix/template-generated-build-paths` | `877fd7933d7b` | fix branch; inspect PR/unique commits |
| `fix/template-generator-output-dir` | `b3a6a73707bb` | fix branch; inspect PR/unique commits |
| `fix/test-a-directory-picker` | `424db42fc50f` | fix branch; inspect PR/unique commits |
| `fix/test-a-directory-picker-ci` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-ci2` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-ci3` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-ci4` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-ci6` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-ci7` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-patch` | `e2b9204a3617` | fix branch; inspect PR/unique commits |
| `fix/test-a-directory-picker-patch-ci` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-a-directory-picker-patch-ci5` | `4d6c46f751dd` | duplicate Test A CI head |
| `fix/test-b-pwa-arm64` | `6b8402488640` | fix branch; inspect PR/unique commits |
| `fix/test-c-camera-qr` | `8902eb12dd89` | fix branch; inspect PR/unique commits |
| `integration/universal-builder-hardening` | `2e3168738016` | other; inspect before cleanup |
| `main` | `285b71e3b472` | canonical main |
| `refactor/repository-architecture-cleanup` | `3aa56ff946c1` | other; inspect before cleanup |
| `repo-cleanup` | `493e03b22bf2` | other; inspect before cleanup |
| `test/community-chat-demo-builder-apk` | `7b6d508458e9` | M6 test stack |
| `test/rn-independent-smoke-0769` | `f58ef8bc2b6f` | M6 branch; reconcile before merge |
| `test/v0.2-auto-reply-e2e` | `42aa6da863ce` | other; inspect before cleanup |

### Branch hygiene findings

- 16 Flutter experiment branches point to the same head `3e149315904c`: `feature/flutter-direct`, `feature/flutter-direct2`, `feature/flutter-direct3`, `feature/flutter-direct4`, `feature/flutter-hardening-direct`, `feature/flutter-hardening-direct2`, `feature/flutter-hardening-direct3`, `feature/flutter-hardening-final`, `feature/flutter-hardening-impl`, `feature/flutter-hardening-impl2`, `feature/flutter-hardening-impl3`, `feature/flutter-hardening-impl4`, `feature/flutter-hardening-impl5`, `feature/flutter-hardening-work`, `feature/flutter-patch`, `feature/flutter-patch2`.
- Eight Test A CI branches point to the same head `4d6c46f751dd`: `fix/test-a-directory-picker-ci`, `fix/test-a-directory-picker-ci2`, `fix/test-a-directory-picker-ci3`, `fix/test-a-directory-picker-ci4`, `fix/test-a-directory-picker-ci6`, `fix/test-a-directory-picker-ci7`, `fix/test-a-directory-picker-patch-ci`, `fix/test-a-directory-picker-patch-ci5`.
- `docs/developer-user-layer-separation` and `feat/m5-flutter-direct-build` share head `5df9e9a477ba`.
- These duplicates are cleanup candidates only after checking PRs, unique commits, and whether a branch is a recovery reference. Preserve the backup branch until the audit confirms it is safe to remove.

## Prioritized completion plan

### P0 — Establish one integration baseline
1. Keep `main` as the only canonical integration target.
2. Do not merge PR #44, #42, #43, #37, #36, #35, #33–#26 or PR #18 wholesale; their bases/ancestry are feature stacks.
3. Select one canonical M6 source branch, identify the minimum RN-related commits/files, and create a fresh main-based integration branch.
4. Require the standard typecheck/build/test and M6 fixture CI on that PR.

### P1 — Close security/reliability gap
1. Rebase PR #39 to current main.
2. Review extraction path containment, symlink/duplicate/case-collision handling, archive resource limits and cleanup.
3. Run existing extractor tests plus adversarial regression tests and general quality gates.
4. Merge only when checks pass; update the test matrix with real evidence, not checkboxes by intention.

### P1 — Complete M6 validation scope before M7
Run RN fixture sequence from `docs/FRAMEWORK-SOURCE-ZIP-CONTRACT.md`: RN-1 minimal bare app, RN-2 navigation, RN-3 assets/fonts, RN-4 persistent storage, RN-5 real native module, RN-6 version/toolchain matrix. Record ZIP and lockfile hashes, toolchain, APK checksum, package ID, install/launch and feature evidence. Keep Expo/M7 gated until this matrix is reviewed.

### P2 — Restore Flutter/Web milestone evidence
1. Review PR #16 against the actual Termux Dart executable failure and port the minimal fix to a clean main-based PR.
2. Separate M3 static web, M4 React/Vite/PWA and M5 Flutter acceptance. One framework's passing fixture does not satisfy another milestone.
3. Run the required ZIP fixtures through Builder → real APK → install → launch on the target phone and record evidence.

### P2 — UI and dependency hygiene
1. PR #25: review dashboard changes on a phone-sized viewport and remove/clearly isolate mock build data before connecting real build state.
2. PR #23: treat Vite 8 as a major compatibility change, not a routine patch. Test every affected workspace.
3. Review PR #38 for whether cloud-toolchain capability metadata is informational only and does not add a competing hosted architecture.

### P3 — Branch cleanup and architecture reconciliation
1. For every open PR targeting a non-main branch, either port unique value to a main-based focused PR or close it after preserving needed commits.
2. Remove duplicate branches only after checking that no PR or user workflow depends on them.
3. Decide ownership/removal of Replit/API-server/database/queue legacy files in a separate, documented cleanup PR; do not combine it with M6 runtime changes.

## Merge decision rules

- **Merge after rebase + passing checks:** small, isolated, tested fixes whose diff is genuinely limited to the intended change.
- **Cherry-pick/port, do not merge wholesale:** large divergent feature branches or PRs with old non-main bases.
- **Keep draft / blocked:** changes missing required CI/device evidence, or dependent on an upstream feature branch.
- **Close after preserving value:** superseded duplicate PRs/branches, once unique changes have been accounted for.
- **Never claim:** M1–M5 or M7–M12 PASS solely from roadmap text, detector presence, a green CodeQL run, or a single M6 demo fixture.

## Audit limitations

- This audit read repository metadata, main documentation, open PR/issue inventories, recent Actions runs, selected file diffs and commit-graph comparisons for the most consequential branches.
- All 93 branch names/head SHAs are inventoried above; commit-graph/file comparisons were focused on milestone/security/RN/UI/dependency branches with material integration risk, rather than asserting every branch is merge-ready.
- Branch protection details could not be read through the connected GitHub integration (403); therefore branch protection is **unknown**, not assumed absent.
- No new Termux build or independent physical-device test was executed as part of this repository audit.
