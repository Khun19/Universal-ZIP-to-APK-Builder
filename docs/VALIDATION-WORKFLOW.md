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


## Gradle cache comparison evidence

A same-source repeat run was completed for PR #88 before the Node 24 action-version refresh. Both attempts used source commit `9c61761638cc16c6b5c26c3015327daa81a02e97` and restored the same Gradle cache key:

- Workflow run: [`39478730690`](https://github.com/Khun19/Universal-ZIP-to-APK-Builder/actions/runs/39478730690), attempt 1 and rerun attempt 2.
- Cache key: `setup-java-Linux-x64-gradle-d1e4c46fa42b4f8f4785d05a573e7c174995e852a467b47798b0752c63b2e174`.
- Both attempts logged `Cache hit` and `Cache restored successfully`; restored cache size was approximately 1,108,598,848 bytes.
- Pull-request runs report the cache as read-only by default, so this evidence proves repeatable restore, not that this PR wrote or refreshed the cache.
- Primary APK size remained 109,260,611 bytes, but SHA-256 differed between attempts (`b5488b399ddb258a4b8201e29316f266bbd79c57bc20935c7d62566ec8a3da56` vs. `9d1ea48d16bce6d54665dffbcf91b5b50a36c454361ed78f43879e3c518f5016`). The bare-scaffold APK was also the same size (110,564,257 bytes) but had different hashes across attempts. This is a reproducibility observation, not evidence of a behavior change.
- The logs do not establish a reliable speed improvement; runner timing varied and the second restore was not faster. Do not claim a cache performance gain from cache-hit evidence alone.
- These runs validate the cache configuration at commit `9c61761638cc16c6b5c26c3015327daa81a02e97`. The subsequent Node 24 action-version update must pass its own exact-head checks before PR #88 can leave draft.

## APK identity and real-device eligibility gate

Before sharing any APK for device testing, verify the actual APK SHA-256 (not the artifact ZIP digest), source commit, workflow run ID, package identity, provenance, and tested-APK registry. Same-hash APKs must not be offered as new device-test candidates. A different hash alone is not a behavior change. Record device results against the exact APK SHA-256 + source commit + run ID. See [`docs/APK-IDENTITY-GATE.md`](APK-IDENTITY-GATE.md) and [`docs/tested-apk-registry.json`](tested-apk-registry.json).

## Framework-specific APK build and evidence contract

Each build strategy MUST declare one exact output path (or a finite, strategy-owned list of exact paths) and the expected application ID when known. Do not select the first APK found by a repository-wide `find | head -n 1`. Discovery must stay inside the selected strategy's output directory; zero matches or multiple ambiguous matches fail closed.

| Detected framework | Build strategy | Expected output area |
| --- | --- | --- |
| Native Android | Run the project's Gradle wrapper with `--no-daemon assembleDebug` from the Android project root | The selected Android module's `build/outputs/apk/debug/` |
| React Native | Run `cd android && ./gradlew --no-daemon assembleDebug` from the React Native project root | `android/app/build/outputs/apk/debug/` |
| Flutter | Run `flutter build apk --debug` | `build/app/outputs/flutter-apk/` |
| Vite/HTML via Capacitor | Install project dependencies using the lockfile, run the declared web build, run `npx cap sync android`, then run the Android Gradle wrapper from `android/` | `android/app/build/outputs/apk/debug/` |

A framework name alone is not proof of support. The selected strategy must verify required project markers and toolchain availability before running. Plain HTML/Vite must use an explicitly detected and configured Android wrapper/integration; never assume a Capacitor Android project exists.

### Mandatory APK validation gates

1. Exact strategy-owned output path exists; file is non-empty and below the configured maximum size (initial policy default: 250 MiB, configurable by the strategy).
2. APK opens as a ZIP archive and every entry passes CRC/read validation.
3. `AndroidManifest.xml` exists, and at least one DEX file or native library exists.
4. Extract the actual application ID using `apkanalyzer manifest application-id` (or the pinned Android build-tools `aapt dump badging` fallback) and compare it to the strategy's expected ID when configured.
5. Calculate SHA-256 from the actual APK bytes.
6. Write per-build provenance and a machine-readable validation report. Every gate records PASS/FAIL; a failed gate fails the job and prevents APK delivery.

### Per-build provenance

Keep `build-provenance.json` (or the current strategy's equivalent `provenance.json`) alongside the APK and upload both in the same workflow artifact. Include at least:

- repository, source commit SHA, workflow ref/SHA, workflow name, run ID and run attempt;
- detected framework, selected strategy and exact output path;
- JDK, Gradle Wrapper, Android SDK/build-tools and framework version when discoverable;
- actual manifest application ID, APK byte size and APK SHA-256;
- individual validation gate results and overall CI build result;
- `device_acceptance.status` set to `NOT_RUN` by default, or PASS/FAIL only when a real-device test was performed for this exact APK SHA-256, source commit and workflow run. Include device-test evidence reference when available.

Do not label the uploaded artifact ZIP digest as the APK SHA-256. Artifact storage and provenance are separate: provenance binds the APK bytes to their source/build run; the workflow artifact merely transports the files.

### Cache performance evidence

Use one Gradle cache mechanism per Gradle build job. The selected M6 workflow uses `gradle/actions/setup-gradle@v6` with `cache-provider: basic`; do not also set `actions/setup-java`'s `cache: gradle` or independently cache the same Gradle User Home.

Record cache status and the measured build-step duration for at least two comparable runs on the same workflow/runner class and source/build inputs. Treat the first run as the baseline (usually cold) and the second as the repeat run; do not assume either is cold/warm without the action's actual cache evidence. Compare cache status, build duration, build result and APK validation result. A cache hit never upgrades a build or validation failure to PASS, and two runs are required before claiming a measured speed improvement.

CI/build acceptance and physical-device acceptance are separate gates. A CI success must not set device acceptance to PASS.

