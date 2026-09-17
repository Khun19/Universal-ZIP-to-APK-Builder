# Validation Workflow

This document defines the project-wide verification loop for the Universal ZIP-to-APK Builder.

## Source-of-Truth Loop

`GitHub change → CI verification → Termux execution → real APK/device verification → evidence → milestone gate`

GitHub is the source of truth for source, tests, workflow definitions, and recorded engineering decisions. Termux is the primary local execution environment for phone-first builds. Real Android behavior is verified separately from CI.

## Milestone Rule

Work is gated one milestone at a time:

1. Inspect the current `main` state and milestone acceptance criteria.
2. Implement only the current milestone on a focused branch.
3. Run applicable automated checks.
4. Push the focused branch and open a pull request against `main`.
5. Review CI results and the changed files.
6. Merge only the milestone currently under validation.
7. Pull the resulting `main` commit in Termux.
8. Run the milestone's required local build/tests.
9. When runtime behavior matters, install and verify the generated APK on a real Android device.
10. Record evidence in the test matrix or an associated test record.
11. A milestone is complete only when its applicable acceptance criteria have evidence.
12. Stop at the gate and do not start the next milestone until the current milestone is explicitly accepted.

## CI Responsibilities

GitHub Actions provides reproducible repository-level checks and workflow-specific regression checks. Current workflows include CodeQL and targeted Test A/Test A-directory-picker validation. CI success is not treated as proof of Android installation, launch, permissions, camera access, QR scanning, or other device-only behavior.

The project should distinguish these states:

- `CI PASS` — the applicable GitHub Actions checks passed.
- `TERMUX PASS` — the applicable local Termux checks passed.
- `REAL DEVICE PASS` — the applicable Android runtime checks passed on a device/emulator.
- `BLOCKED` — a required environment or device is unavailable.
- `NOT RUN` — verification has not been executed.

## Termux Procedure

From the repository checkout:

```sh
cd ~/Universal-ZIP-to-APK-Builder-main

git fetch origin --prune
git checkout main
git pull --ff-only origin main

pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
```

For a build acceptance test, use a complete project ZIP and run the documented CLI entry point, for example:

```sh
pnpm run start:cli "/storage/emulated/0/Download/<project>.zip"
```

The build record must retain the command output needed to identify the phase, exit code, APK path/name, APK size, and SHA-256 when an APK is produced.

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
