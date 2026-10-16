# Validation Workflow

This document defines the project-wide verification loop for the Universal ZIP-to-APK Builder.

## Source-of-Truth Loop

`Repository guidance/specs → Goal Alignment Audit → focused GitHub PR → GitHub Actions Ubuntu build/test → exact-commit artifact/provenance verification → real-device acceptance when required → evidence → milestone gate`

Repository documentation is part of the development contract. When guidance conflicts, use the current explicit project requirements and the most specific applicable repository rule, and document unresolved conflicts rather than silently choosing a legacy path.

GitHub is the source of truth for source, tests, workflow definitions, CI runs, artifacts, and recorded engineering decisions. GitHub Actions on Ubuntu is the primary build/test environment. Termux is an optional local recovery/diagnostic path, not a routine build prerequisite. Real Android behavior is verified separately from CI.

## Milestone Rule

Work is gated one milestone at a time:

1. Inspect the current `main` state and the applicable repository instructions/specifications.
2. Run a **Goal Alignment & Deviation Audit** against the target goal, current architecture, milestone scope, and acceptance criteria.
3. Implement only the current milestone on a focused branch.
4. Run applicable automated checks.
5. Run the Goal Alignment & Deviation Audit again after implementation.
6. Push the focused branch and open a pull request against `main`.
7. Review the applicable GitHub Actions results and changed files for the exact candidate commit.
8. Confirm artifact provenance ties the APK to that exact commit, workflow run, and fixture; record its SHA-256.
9. Merge only the milestone currently under validation after required review and checks pass.
10. When runtime behavior matters, download the artifact from the recorded run, verify its hash/provenance, then install and verify it on a real Android device.
11. Run local Termux builds/tests only when explicitly required for recovery, diagnosis, or a check unavailable in CI; record why.
12. Record evidence in the test matrix or an associated test record.
13. A milestone is complete only when its applicable acceptance criteria have evidence **and the goal-alignment audit is ALIGNED**.
14. Stop at the gate and do not start the next milestone until the current milestone is explicitly accepted.

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

GitHub Actions on Ubuntu is the primary environment for reproducible repository checks and framework-specific APK builds. Select the workflow that actually covers the target fixture; a workflow file existing is not proof that it ran or passed. For each candidate commit, inspect the run conclusion, job logs, uploaded artifact, APK validation output, and provenance. CI success is not proof of Android installation, launch, permissions, camera access, QR scanning, or other device-only behavior.

The project should distinguish these states:

- `CI PASS` — the applicable GitHub Actions checks passed.
- `LOCAL RECOVERY PASS` — an explicitly required local/Termux diagnostic or build check passed. This is not a substitute for the canonical CI run.
- `REAL DEVICE PASS` — the applicable Android runtime checks passed on a device/emulator.
- `BLOCKED` — a required environment or device is unavailable.
- `NOT RUN` — verification has not been executed.

## Optional Termux / local recovery procedure

Do not install or retain a full Android SDK on the phone just to perform routine APK builds. Use GitHub Actions for the normal build path. Enter the local path only when diagnosing a CI gap, developing a local-only change, or restoring the environment for an explicitly approved task.

When local execution is required, first inspect available scripts and current setup instructions. Install only the required Node.js/package-manager dependencies; restore Android SDK/build tools and framework toolchains only for the specific local test. Detect tool paths rather than hard-coding them.

Example repository checks when dependencies are already available:

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
```

A local APK, if produced, must be labelled as a local build and recorded separately from CI artifacts. Capture the source commit, environment/toolchain, command, exit code, APK path/size, and SHA-256.

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

## CI coverage and limitations

CI coverage varies by workflow and fixture. Before claiming a framework is CI-verified, confirm that the applicable workflow actually ran successfully for the exact source commit and produced a validated artifact. Do not infer full framework coverage from workflow filenames or from a successful unrelated workflow. Device-only behavior remains a separate acceptance gate when the roadmap requires it. If the required workflow or evidence is missing, report `BLOCKED` or `NOT RUN`; do not make a local Termux build the default substitute.
