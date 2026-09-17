# ADR 0001 — Engineering Control and Validation

- Status: Accepted
- Date: 2026-09-18
- Scope: Repository workflow, milestone gating, CI, Termux, and real-device validation

## Context

The builder is a phone-first ZIP-to-APK system, while GitHub and GitHub Actions provide source control and automated verification. Android runtime behavior cannot be inferred from source inspection or a successful CI/build command alone.

The roadmap therefore requires a repeatable separation between repository checks, local Termux execution, and real Android runtime evidence.

## Decision

1. `main` is the stable source-of-truth branch.
2. Meaningful work uses a focused branch and a focused commit/PR.
3. Milestones are implemented and validated one at a time.
4. GitHub Actions is a verification gate, not proof of real-device behavior.
5. Termux is the primary local execution environment for the phone-first workflow.
6. Runtime-sensitive Android acceptance requires installation and feature verification on a real Android device or explicitly records `BLOCKED` when the required environment is unavailable.
7. The test matrix is the acceptance contract and must distinguish `PASS`, `FAIL`, `BLOCKED`, and `NOT RUN`.
8. Build artifacts are not considered successful solely because Gradle exits successfully; APK discovery, validation, and integrity evidence are required where the milestone calls for them.
9. CI/device limitations are documented rather than hidden by broad PASS claims.

## Consequences

This keeps source changes, automated checks, local phone builds, and runtime verification as separate evidence layers. It may leave a milestone incomplete when a device or required environment is unavailable, but that is preferable to treating unverified behavior as complete.

## Related Documents

- `AGENTS.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST-MATRIX.md`
- `docs/VALIDATION-WORKFLOW.md`
