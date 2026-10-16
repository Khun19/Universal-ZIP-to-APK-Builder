# Development Workflow

This document describes the repository's practical development and validation loop. It supplements, and does not override, the canonical guidance in `README.md`, `ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/VALIDATION-WORKFLOW.md`, `docs/TEST-MATRIX.md`, and applicable repository rules.

## Source of Truth and Build Priority

- GitHub `main` is the canonical source of truth for repository code, workflow definitions, and recorded decisions.
- GitHub Actions on Ubuntu is the primary automated build and validation path.
- Local Node.js/Termux work is optional and secondary. Use it for targeted diagnosis, recovery, development, or checks that cannot reasonably be performed in CI; record why it was needed.
- Real Android installation and runtime behavior are separate acceptance checks when required by the milestone. CI success alone is not device acceptance.
- Framework support and milestone completion must be based on the current roadmap and required evidence, not merely on detector code, workflow-file presence, or a successful workspace build.

## Canonical Development and Validation Loop

For each milestone or focused fix:

1. **Inspect guidance and current state.** Read the applicable repository instructions and specifications, inspect current `main`, and confirm the active milestone, scope, and acceptance criteria in `ROADMAP.md`.
2. **Run a goal-alignment audit.** Check the target goal, architecture, milestone scope, requirements, dependencies, and acceptance criteria. Identify scope drift or technically valid changes that do not meet the intended goal.
3. **Make one focused change.** Keep the change small, avoid unrelated refactors, and work on a focused branch.
4. **Run relevant checks.** Execute applicable automated tests, typechecks, and build checks. Report checks that are skipped, unavailable, or blocked.
5. **Open a focused pull request.** Explain what changed and why, link relevant issues, and include the validation plan and evidence.
6. **Verify exact-commit CI.** Inspect the applicable GitHub Actions runs, conclusions, job logs, changed files, and checks for the exact candidate commit. A workflow file existing, or an unrelated workflow passing, is not evidence that the required workflow passed.
7. **Verify build artifacts and provenance when applicable.** Confirm that the artifact and fixture correspond to the candidate commit and workflow run. Validate the APK structure and manifest as required, record package identity where applicable, and calculate SHA-256 from the actual persisted APK bytes.
8. **Perform real-device acceptance separately when required.** Obtain the APK from the recorded workflow run, verify its identity/hash and provenance, then install and exercise it on a real Android device. Record the exact APK SHA-256, source commit, workflow run, device context, and observed behavior.
9. **Record evidence and decide the gate.** Record the result in `docs/TEST-MATRIX.md` or the appropriate acceptance record. Merge and advance only when required reviews, checks, evidence, and goal-alignment criteria pass.

## Failure and Milestone Discipline

- Do not skip a failed, blocked, or goal-misaligned milestone.
- On failure, diagnose the root cause, fix the same milestone, and repeat the applicable checks against the new exact commit.
- If required CI, artifact, fixture, device, or other evidence is unavailable, report `BLOCKED` or `NOT RUN`; do not infer success.
- Do not use an APK from an older commit or unrelated fixture to prove acceptance of the current candidate.
- Do not begin the next milestone until the current milestone's applicable acceptance criteria are explicitly satisfied and the required evidence is recorded.

## APK Build Truth and Evidence

A successful command, typecheck, unit test, or workspace build does not by itself prove that an Android APK was produced or works. For an APK build claim, verify the applicable evidence, including:

- exact source commit and GitHub Actions workflow/run;
- input fixture identity and SHA-256;
- relevant toolchain versions and build result;
- persisted APK path and byte size;
- valid APK/ZIP structure and readable, valid `AndroidManifest.xml`, where required;
- SHA-256 calculated from the persisted APK bytes;
- artifact provenance linking the APK to the source commit, run, and fixture;
- installation, launch, and feature-specific runtime results when required.

Keep CI results, optional local recovery results, and real-device results distinct. A different APK hash alone does not prove a behavior change.

## Optional Local / Termux Recovery

Do not make a full phone-side Android SDK a routine prerequisite. Use GitHub Actions for normal builds. Before local execution, inspect the repository's current setup and diagnostic scripts; install or restore only the tools needed for the explicitly approved local task. Detect tool paths rather than assuming fixed locations.

When local checks are needed, record the source commit, environment/toolchain, commands, exit codes, output artifact details, and SHA-256. Label any locally produced APK as a local build and keep its evidence separate from CI artifacts.

## Security and Workspace Safety

ZIP files are untrusted input. Relevant checks should address path traversal (including absolute paths and `../`), Windows drive paths, unsafe or NUL filenames, symlink escapes, workspace containment, excessive entry counts, expanded size and compression ratios, and safe command/argument handling. Never interpret user-controlled filenames as shell syntax. Preserve unrelated working projects and user data during local diagnosis or recovery.

## Status Labels

Use explicit labels and distinguish each evidence category:

- `CI PASS` — applicable GitHub Actions checks passed for the exact candidate commit.
- `LOCAL RECOVERY PASS` — an explicitly required local/Termux check passed; this does not replace required CI evidence.
- `REAL DEVICE PASS` — the required installation and runtime checks passed on a real device or documented emulator.
- `FAIL` — a mandatory criterion failed.
- `BLOCKED` — a required prerequisite or environment is unavailable.
- `NOT RUN` — the verification has not been performed.

`CI PASS` is not equivalent to `REAL DEVICE PASS`. Mark a milestone accepted only when all applicable mandatory criteria and evidence requirements are satisfied.

## AI / Session Bootstrap

When resuming work, inspect the current GitHub `main` state and read the applicable canonical repository guidance before changing files. Use this document as a practical workflow summary, not as an override for `README.md`, `ROADMAP.md`, `docs/VALIDATION-WORKFLOW.md`, the test matrix, architecture decisions, or current repository instructions. If documents conflict or the applicable requirement is unclear, record the conflict and resolve it explicitly rather than following stale guidance.
