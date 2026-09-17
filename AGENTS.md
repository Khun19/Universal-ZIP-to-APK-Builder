# Universal ZIP-to-APK Builder — Agent Instructions

## Mission

Build a reliable Universal ZIP-to-APK Builder that accepts supported web/application projects packaged as ZIP files and produces a real, installable, validated Android APK.

The long-term pipeline is:

`ZIP → secure extraction → project analysis → strategy selection → dependency preparation → web build when required → Android wrapper/native build → Gradle → APK discovery → validation → SHA-256 → artifact delivery`

Do not optimize only for demos. Preserve a clean architecture so additional frameworks, build strategies, Android capabilities, and execution environments can be added without rewriting the core.

## Source of Truth

GitHub repository: `Khun19/Universal-ZIP-to-APK-Builder`

GitHub is the source of truth for code, history, issues, pull requests, CI results, tests, and important engineering decisions.

Before important changes, inspect the current repository state, recent commits, related files, tests, issues/PRs, and GitHub Actions. Never rely on stale chat history when the repository can answer the question.

## Roles

### ChatGPT / Lead Agent
- Architecture and roadmap
- Root-cause analysis
- Task decomposition
- Code review
- Test strategy
- Git/GitHub coordination
- Documentation and architectural decisions
- Termux command guidance

### Termux
- Local execution
- Dependency installation
- Web and Android builds
- Tests
- Real APK generation
- Real-device validation
- Log collection

### GitHub
- Permanent source/history
- Branches and commits
- Pull requests and reviews
- Actions/CI
- Issues and decisions

## Engineering Rules

1. Inspect before modifying.
2. Reproduce bugs before fixing them.
3. Prefer the smallest safe change.
4. Do not hide build errors.
5. Do not invent test results, CI results, paths, APIs, or environment state.
6. Do not break existing successful tests while fixing another case.
7. Avoid unnecessary dependencies and rewrites.
8. Keep security, analysis, strategy selection, execution, API, UI, and artifact validation separated.
9. Prefer deterministic and reproducible builds.
10. Preserve backward compatibility where practical.

## Git Rules

Use `main` as the stable branch. For meaningful work prefer focused branches:

- `feature/<name>`
- `fix/<name>`
- `test/<name>`
- `refactor/<name>`
- `ci/<name>`
- `security/<name>`

Never force-push shared history or discard unrelated user work. Use focused commits with descriptive messages. Do not commit secrets, credentials, private certificates, or unnecessary build artifacts.

## Bug Protocol

`OBSERVE → REPRODUCE → LOCATE FAILURE STAGE → IDENTIFY ROOT CAUSE → CHECK HISTORY → MINIMAL FIX → TEST → REGRESSION TEST → DOCUMENT → COMMIT`

Classify failures when useful: `ZIP_SECURITY`, `PROJECT_DETECTION`, `DEPENDENCY_INSTALL`, `WEB_BUILD`, `PWA`, `WORKBOX`, `ANDROID_WRAPPER`, `GRADLE`, `ANDROID_SDK`, `APK_DISCOVERY`, `APK_VALIDATION`, `RUNTIME`, `PERMISSION`, `API`, `DATABASE`, `FRONTEND`, `CI`, or `ENVIRONMENT`.

## CI and Real Testing

GitHub Actions is a verification gate, not proof of real-device behavior.

`CI PASS ≠ REAL DEVICE PASS`

For relevant builds verify APK existence, structural validity, installation, launch, permissions, navigation, storage/network behavior, and feature-specific runtime behavior.

Maintain and extend the test matrix in `docs/TEST-MATRIX.md`.

## Security

ZIP input is untrusted. Protect against Zip Slip, absolute/traversal paths, unsafe symlinks, malicious filenames, command injection, decompression bombs, excessive file counts/sizes, workspace escape, and cross-build workspace access.

Never interpolate unsanitized user-controlled values into shell commands. Isolate each build workspace.

## Architectural Forecasting

Before adding a feature ask:

- Will another strategy need this?
- Should this be an interface or reusable library?
- Can it be configured instead of hard-coded?
- Will it work in Termux and CI/Docker?
- Does it introduce global state or security risk?
- Will it make future testing harder?

Prefer extensibility without premature implementation of every future feature.

Keep clean boundaries between project analysis, build strategy selection, build execution, environment detection, security, APK discovery/validation, artifact management, API, UI, and workers/queues.

## Termux Command Guidance

When local execution is needed, provide copy/paste-ready commands with:

1. Purpose
2. Command
3. Expected result
4. Next action

Avoid destructive commands unless the impact is explicit and confirmation is obtained when unrelated/user data may be affected.

## Documentation

Record important architectural decisions, compatibility workarounds, known failures, and test requirements in repository documentation. Explain why a decision exists, not only what changed.

## Definition of Done

A task is complete only when applicable:

- implementation complete
- error handling complete
- tests added/updated
- local tests passed
- regression tests passed
- CI checked
- real APK/device test checked when relevant
- documentation updated
- Git status understood
- focused commit created
- unrelated changes preserved

## Final Task Report

Use:

`STATUS: COMPLETED / PARTIAL / BLOCKED`

`CURRENT MILESTONE: ...`

`CHANGES: ...`

`ROOT CAUSE: ...`

`FILES: ...`

`LOCAL TEST: PASS / FAIL / NOT RUN`

`REAL APK TEST: PASS / FAIL / NOT RUN / NOT AVAILABLE`

`GITHUB CI: PASS / FAIL / NOT RUN`

`REGRESSION: ...`

`KNOWN RISKS: ...`

`FUTURE IMPACT: ...`

`NEXT ACTION: ...`

Never claim verification without evidence.