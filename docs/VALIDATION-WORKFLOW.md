# Validation Workflow

This document defines the project-wide verification loop for the Universal ZIP-to-APK Builder.

## Source-of-Truth Loop

`Repository guidance/specs → Goal Alignment Audit → focused GitHub PR → GitHub Actions CI/build/artifacts → evidence review → device/runtime verification when required → milestone gate`

Repository documentation is part of the development contract. When guidance conflicts, use the current explicit project requirements and the most specific applicable repository rule, and document unresolved conflicts rather than silently choosing a legacy path.

GitHub is the source of truth for source, tests, workflow definitions, build logs, artifacts, and recorded engineering decisions. **GitHub Actions on Ubuntu is the primary development, automated-test, and reproducible-build environment.** Termux is not a required development step. Physical Android install/launch checks remain a separate acceptance gate whenever the milestone requires runtime evidence; CI success alone never proves device behavior.

## Milestone Rule

Work is gated one milestone at a time:

1. Inspect the current `main` state and the applicable repository instructions/specifications.
2. Run a **Goal Alignment & Deviation Audit** against the target goal, current architecture, milestone scope, and acceptance criteria.
3. Implement only the current milestone on a focused branch.
4. Run applicable automated checks.
5. Run the Goal Alignment & Deviation Audit again after implementation.
6. Push the focused branch and open a pull request against `main`.
7. Review CI results and the changed files.
8. Merge only the milestone currently under validation.
9. Download and inspect artifacts produced by the exact PR commit; verify APK structure and SHA-256 where applicable.
10. When runtime behavior matters, install and verify that exact APK on a real Android device or supported emulator; if unavailable, record BLOCKED rather than claiming PASS.
11. Record workflow run URL, commit SHA, fixture hash, toolchain versions, artifact name/size/hash, test result, and runtime evidence in the test matrix or an associated test record.
12. A milestone is complete only when its applicable acceptance criteria have evidence **and the goal-alignment audit is ALIGNED**.
13. Stop at the gate and do not start the next milestone until the current milestone is explicitly accepted.

### Goal Alignment & Deviation Audit

The audit is a development/governance gate, not a substitute for technical validation.

Check:

- target goal and current requirements;
- canonical three-layer architecture;
- technically correct changes that could still cause goal deviation;
- missing requirements, dependencies, constraints, or acceptance criteria;
- false progress where tests/builds pass without proving the intended outcome;
- scope drift;
- Secondary/Legacy infrastructure being mistaken for canonical product architecture.

Audit outcomes:

- **ALIGNED** — no material goal deviation found.
- **DEVIATION FOUND** — correction/re-plan is required before progression.
- **BLOCKED** — required information or prerequisite is unavailable.

A DEVIATION FOUND or BLOCKED result keeps the work at the current milestone.

## CI Responsibilities

GitHub Actions provides reproducible repository-level checks and workflow-specific regression checks. Current workflows include CodeQL and targeted Test A/Test A-directory-picker validation. CI success is not treated as proof of Android installation, launch, permissions, camera access, QR scanning, or other device-only behavior.

The project should distinguish these states:

- `CI PASS` — the applicable GitHub Actions checks passed.
- `TERMUX PASS` — the applicable local Termux checks passed.
- `REAL DEVICE PASS` — the applicable Android runtime checks passed on a device/emulator.
- `BLOCKED` — a required environment or device is unavailable.
- `NOT RUN` — verification has not been executed.

## GitHub Actions Procedure

For each focused PR:

1. Check out the exact PR head SHA on an Ubuntu runner.
2. Install the repository-pinned runtime and package-manager versions.
3. Install dependencies from the committed lockfile using frozen-lockfile mode.
4. Run the repository's existing typecheck, unit tests, and workspace build checks.
5. Run the milestone-specific tests and framework build only when that workflow is applicable.
6. Upload required artifacts with a clear name and bounded retention; emit SHA-256 and build metadata.
7. Fail the workflow on missing mandatory artifacts or failed checks. Do not turn optional/skipped checks into PASS.
8. Keep workflows additive and scoped: do not remove existing checks or change framework architecture as part of CI migration without a separate reviewed PR.

Current workflow coverage is partial. New workflows should be added in small steps after inspecting the existing scripts and avoiding duplicate/conflicting jobs. The milestone-by-milestone coverage plan is tracked in `docs/MILESTONE-CI-MATRIX.md`.

## Real Android Verification

When the acceptance criterion requires runtime verification, the APK must be installed through the normal Android UI (or an equivalent documented device procedure) and checked for the feature-specific behavior. Do not convert a successful Gradle build into a runtime PASS.

## Evidence Record

For important acceptance tests record:

- Test ID
- Date
- Git commit SHA
- Input fixture
- Environment
- Command(s)
- Result
- APK name and size, when applicable
- SHA-256, when applicable
- Device/emulator information, when applicable
- Relevant failure logs, when failed

## Current CI Limitation

The current CI configuration is intentionally documented as partial verification. It does not replace the Termux and real-device gates required by the roadmap. Broad Android build/device coverage remains future work under the later reliability/CI milestones.
