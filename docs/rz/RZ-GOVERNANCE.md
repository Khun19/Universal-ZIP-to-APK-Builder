# RZ Governance

## Purpose and Authority

RZ is the sole active project workflow for architecture, requirements, implementation, verification, real Android validation, and release of the Universal ZIP-to-APK Builder. GitHub is the source/history/CI record; Termux is an execution and validation environment; the required Android device supplies runtime evidence. BMAD is not the active project workflow. Retained BMAD-named files are reference material only.

RZ does not change historical milestone decisions by itself. Initial state snapshot: M1-M5 history/status are preserved; M6 is **PAUSED / BLOCKED**; M7 is **NOT STARTED**. Work on M6 or M7 requires a new explicit human decision recorded through RZ-DEFINE. This document does not resume either.

## Lifecycle

`DEFINE → DESIGN → SPECIFY → REVIEW → PLAN → IMPLEMENT → VERIFY → BUILD → INSPECT → COMMIT/PUSH → EXACT-COMMIT TERMUX SYNC/VALIDATE → INSTALL/RUN → PROVE → RELEASE`

Mapped to stages: RZ-DEFINE; RZ-ARCH; RZ-REQ and RZ-SPEC; RZ-REVIEW; RZ-MILESTONE; RZ-BUILD implementation substep; RZ-CHECK source verification; RZ-BUILD artifact-build substep; RZ-CHECK post-build/integration/regression verification; RZ-ARTIFACT; GitHub handoff; RZ-TERMUX; RZ-RUNTIME; RZ-GATE; RZ-RELEASE. `RZ-BUILD` therefore has two ordered substeps with RZ-CHECK between them; this is one build stage with explicit implementation and build outputs, not permission to skip either check. Build may occur locally before publication and must be repeated from the exact pushed commit in Termux when required. Evidence identifies the producing environment. `RZ-GATE` is a decision, not an execution step. A required stage/check may be N/A only with rationale and accountable owner approval.

## Stage Contract

Every RZ stage definition and record must state all of:

1. Input
2. Action
3. Output
4. Evidence
5. Acceptance criteria
6. Owner/responsibility
7. Status
8. Failure behavior
9. Exit condition

Use the stage-specific pages for these contracts. A blank item is not implicitly satisfied: the stage is NOT VERIFIED and cannot exit.

## One Milestone at a Time

Only one milestone may be active. Its approved baseline, objective, scope, out-of-scope work, dependencies, acceptance criteria, and evidence plan are fixed before implementation. Do not start, implement, or gate a later milestone while the current milestone is not PASS. Record unrelated findings for later; do not opportunistically refactor or bundle them.

The milestone record includes: ID, name, objective, scope, out of scope, dependencies, acceptance criteria, build requirements, test requirements, artifact requirements, Termux requirements, runtime requirements, evidence requirements, regression requirements, known limitations, gate result, Git commit, Git push, final status; plus baseline commit/branch, requirement/spec trace IDs, risk/security applicability, decision owner/time, and controlled-change history.

## Status Definitions

- `NOT STARTED`: authorized work has not begun.
- `NOT VERIFIED`: required evidence/check has not been produced or is insufficient. No pass/fail claim is made.
- `BLOCKED`: work/check cannot proceed due to a named unavailable prerequisite. Record what is blocked and the unblock condition. Do not infer failure or success.
- `FAIL`: an executed acceptance check failed with evidence. The milestone remains active and cannot advance.
- `PAUSED`: an accountable human explicitly suspends work. It is not a pass and does not authorize the next milestone.
- `PASS`: every mandatory acceptance criterion has sufficient linked evidence and the accountable human gate owner accepts it.

No evidence means NOT VERIFIED. Missing evidence cannot be called PASS. When a gate has both observed failures and missing checks, record FAIL for the failed criteria and NOT VERIFIED/BLOCKED for the others; overall gate is not PASS.

## Failure and Recovery

`FAIL or BLOCKED → SAME MILESTONE → root-cause evidence (or explicitly unknown) → scoped fix → rebuild → revalidate affected checks and regressions → re-inspect/re-run as required → RZ-GATE again`.

Never transition from FAIL, BLOCKED, NOT VERIFIED, or PAUSED to the next milestone. `RZ-DEV` is only same-milestone remediation. Do not guess a root cause; uncertainty remains explicit. Re-run every acceptance check affected by the fix and all required regression checks. A gate can PASS only after every mandatory item is resolved.

## Evidence Rules

Evidence categories are distinct: source/review, automated test, build, artifact, installation, runtime, and release. Each item has a stable evidence ID, claim/category, source or operator, exact source commit and/or artifact SHA-256, timestamp/timezone, command/procedure and result, and a durable log/report/link where available.

- Build PASS is not milestone PASS.
- APK exists is not proof the APK works.
- APK installs is not proof the app launches.
- App launches is not proof of feature, offline, permission, or sustained runtime behavior.
- CI PASS proves only the configured CI jobs.
- No physical-device evidence means device runtime is NOT VERIFIED (or BLOCKED if the device/prerequisite is unavailable).

## GitHub-Gated Ownership

1. AI/developer may inspect, implement approved scope, run available tests/builds, inspect APKs, and report evidence honestly.
2. CI maintainers own configured GitHub checks; CI does not prove Termux or phone behavior.
3. The source owner approves the milestone definition and scope changes.
4. The implementation owner commits/pushes only the approved scoped files after local checks; record exact commit and push result.
5. The Termux operator checks out/pulls that exact commit and supplies environment, commands, exit codes, logs, and APK identity.
6. The phone operator installs that exact APK and supplies device identity plus install/launch/feature observations/logs.
7. The accountable human gate owner reviews the complete evidence bundle. AI cannot declare an unobserved external or physical-device gate PASS.
8. The release owner gives explicit release approval after RZ-GATE PASS.

Canonical handoff: `Define → Implement → Verify → Build → Commit → Push → user pulls exact commit → Termux validation → phone runtime validation → evidence → RZ-GATE → PASS/FAIL/BLOCKED`.

## Reproducibility

For each milestone result, preserve the source commit and branch; starting baseline; clean/dirty status; OS/device and architecture; relevant SDK/JDK/Gradle/Node/package-manager/framework/dependency versions; lockfile and relevant non-secret configuration hashes; exact commands, exit codes, and logs; input fixture/ZIP hash; test result references; APK filename, size, SHA-256, package/application ID, version, SDK range, ABI and signing identity; and validation time/timezone. Device evidence additionally records device model, Android/API level, ABI, installed artifact hash, exact procedure, and logs/observations. Never record secrets.

If a field does not apply, record N/A with reason. If unavailable, record UNKNOWN/NOT VERIFIED and block any gate that requires it.

## Regression Lock

Previously PASS milestones and their acceptance criteria/tests are protected. The current milestone plan identifies impacted protected milestones and required regression suites. A regression failure blocks current progression and is fixed/revalidated before gate PASS. Reopening prior acceptance requires an explicit RZ-DEFINE change record, owner approval, impact review, and rerun; do not silently change its status or criteria. Preserve M1-M5 recorded history in this governance migration.

## Scope and Change Control

All work must map to an approved requirement and the single active milestone. Unrelated refactoring/features are deferred. A requirements, architecture, acceptance, scope, dependency, or toolchain change is an RZ-DEFINE change record containing reason, affected IDs/milestones, impact, security/regression risks, evidence/gate effects, and human approval. Architecture/requirement/acceptance changes return through RZ-ARCH/RZ-REQ/RZ-SPEC/RZ-REVIEW as applicable and establish a new baseline before implementation. Never weaken acceptance criteria after observing a failure to manufacture PASS. A material post-PASS change invalidates affected evidence and reopens the relevant gate explicitly.

Urgent cross-milestone issues are recorded and prioritized, not silently fixed inside the current milestone. Any exception requires explicit human scope approval, a traceable change, impact review, and revised gate plan; one milestone remains active.

## Traceability

Use stable IDs and a lightweight mapping:

`REQ-ID → SPEC section → milestone → code/commit → test ID → evidence ID → gate result → release record`.

Every acceptance criterion maps to evidence or an explicit approved N/A. Orphan requirements, tests, or claims prevent gate PASS.

## ZIP-to-APK Security Checkpoints

For every applicable milestone, plan and record checks for: untrusted ZIP paths (absolute/traversal/drive paths), symlinks, malicious filenames/files, file-count/size/compression limits, workspace containment/isolation, dependency acquisition and lifecycle scripts, generated build scripts/commands and injection boundaries, toolchain execution/network access, APK structure/manifest/permissions/package identity/signature/ABI/native libraries, and artifact hash integrity. Mark inapplicable items N/A with rationale and owner approval. These are governance checkpoints, not a claim that a security feature exists or a substitute for tests.

## Release Gate

Release requires RZ-GATE PASS and a release record tied to exact source commit and artifact hash; applicable CI/test/build and APK inspection evidence; package/version/signing identity; required installation and runtime validation; known limitations; release notes; and accountable human approval. A successful Gradle build alone never authorizes release. If the release class does not require phone runtime, record the approved release class and rationale; do not mislabel it as phone-validated.

## Change to RZ

Changes to this governance system itself use RZ-DEFINE and a self-audit: map the proposal to affected controls, update the smallest necessary docs/templates, perform a second full audit, and obtain human approval before publishing. Until that gate passes, the existing RZ version remains authoritative.
