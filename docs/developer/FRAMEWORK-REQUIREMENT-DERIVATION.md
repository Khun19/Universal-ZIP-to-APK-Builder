# Framework Requirement Derivation & Agent Execution Contract

## Purpose

This contract makes the Developer Layer capable of turning the Builder's project goal into **framework-specific, testable requirements** and then using those requirements to determine what an AI agent must implement next.

The goal is not to tell an agent to "fix React Native" or "add Flutter support".

The goal is:

`PROJECT GOAL → FRAMEWORK SCOPE → DERIVED REQUIREMENTS → ACCEPTANCE CRITERIA → CURRENT EVIDENCE → GAP → NEXT TASK → IMPLEMENT → VERIFY`

An agent must reason from the required outcome and evidence, not from the amount of code already present.

## 1. Source-of-truth hierarchy

When deriving requirements, the agent MUST inspect sources in this order:

1. `ROADMAP.md` — project/milestone goal and scope
2. `AGENTS.md` — engineering and agent rules
3. `docs/ARCHITECTURE.md` — architectural boundaries
4. `docs/developer/FRAMEWORK-BUILD-FLOW-CONTRACT.md` — required framework stages
5. `docs/TEST-MATRIX.md` — acceptance/evidence expectations
6. `docs/VALIDATION-WORKFLOW.md` — GitHub → Termux → real-device validation
7. framework strategy implementation and related tests
8. current build logs, APK evidence, runtime logs, and failure reports

If a lower-level source conflicts with a higher-level source, the agent must stop and resolve the conflict rather than silently choosing one.

## 2. Requirement derivation

For every framework, the agent MUST derive requirements from five dimensions:

### A. Project outcome

What must the Builder ultimately deliver?

For the current Builder this normally includes:

`supported ZIP → correct strategy → real framework build → real APK → APK validation → install → runtime → functional validation → evidence`

### B. Framework semantics

What does the real framework require to produce a native Android application?

Examples:

- React Native: native Android project, JS bundle/runtime, native dependencies, Gradle integration, RN runtime initialization.
- Flutter: Flutter project metadata, Flutter-generated Android project, Dart dependencies, Flutter Android build.
- Capacitor: web build output, Capacitor Android project, native plugin dependencies, Gradle build.

The agent must use the framework's real/native build semantics where an official flow exists.

### C. Execution environment

Requirements must include the actual supported build environment.

Examples:

- Android/Termux ARM64
- Java/JDK version
- Android SDK/build-tools
- Gradle
- Node/package manager
- framework SDK
- native libraries/NDK where applicable
- memory/storage/network constraints

An environment workaround is valid only if it preserves framework semantics.

### D. Evidence

Every requirement must have observable acceptance evidence.

Bad:

`RN build support works`

Good:

`A real RN fixture builds an APK, APK validates, installs on the target phone, launches, initializes the RN runtime, renders the expected screen, and produces recorded evidence.`

### E. Failure and recovery

Every required stage must define:

- failure condition
- diagnostic evidence
- safe retry behavior
- deterministic repair if possible
- `NEEDS_INPUT` condition
- `BLOCKED` condition
- prohibited fallback

## 3. Requirement quality rules

A derived requirement MUST be:

- specific
- observable
- testable
- traceable to a project goal
- traceable to a framework/build stage
- associated with evidence
- associated with a PASS condition
- associated with a failure action

A requirement MUST NOT be created merely because a particular implementation pattern is convenient.

## 4. Agent status algorithm

For an incomplete framework, the agent MUST perform this loop:

```
READ PROJECT GOAL
      ↓
READ FRAMEWORK CONTRACT
      ↓
IDENTIFY FRAMEWORK
      ↓
DERIVE / REFRESH REQUIREMENTS
      ↓
READ CURRENT IMPLEMENTATION
      ↓
READ TESTS + EVIDENCE
      ↓
BUILD CURRENT STATUS MATRIX
      ↓
FIND EARLIEST REQUIRED NON-PASS STAGE
      ↓
CLASSIFY BLOCKER
      ↓
CREATE BOUNDED IMPLEMENTATION TASK
      ↓
IMPLEMENT
      ↓
RUN STAGE-SPECIFIC TEST
      ↓
IF FAIL → RECORD FAILURE → REMAIN ON SAME STAGE
      ↓
IF PASS → RECORD EVIDENCE → ADVANCE TO NEXT STAGE
      ↓
REPEAT UNTIL DEFINITION OF DONE
```

The agent MUST NOT skip an earlier failed required stage to work on a later stage.

## 5. Automatic gap detection

For each requirement, compare:

`REQUIRED STATE` vs `VERIFIED STATE`

Classify the result as:

- `PASS` — acceptance evidence exists and is current.
- `FAIL` — evidence shows the requirement is not satisfied.
- `IN_PROGRESS` — implementation exists but acceptance evidence is incomplete.
- `BLOCKED` — progress requires external/user/environment input.
- `NOT_STARTED` — no meaningful implementation/evidence.
- `NOT_APPLICABLE` — explicitly justified as unnecessary for this framework.

The agent must select the **earliest required FAIL/IN_PROGRESS/NOT_STARTED stage** as the next target.

## 6. What the agent is allowed to add

When a requirement is missing, the agent may add whatever implementation is necessary to satisfy the project's architecture and framework semantics, including:

- strategy code
- framework adapters
- toolchain detection
- project preparation
- dependency handling
- native Android configuration
- build commands
- environment adaptations
- artifact validation
- runtime diagnostics
- tests
- fixtures
- deterministic repair/recovery
- evidence collection
- developer documentation

The agent must not limit itself to editing the file where the visible error occurred.

The required change is defined by the **requirement gap**, not by the error message alone.

## 7. Root-cause rule

An error message is not automatically the requirement.

Example:

`libjscexecutor.so not found`

This is a symptom.

The agent must determine which requirement is actually unsatisfied, such as:

- correct RN runtime architecture
- correct native library packaging
- compatible RN/Hermes/JSC configuration
- correct native initialization
- correct official RN Android flow
- device-compatible native artifact

The agent should then fix the smallest architectural cause that satisfies the requirement.

## 8. Prohibited completion shortcuts

An agent MUST NOT mark a framework complete by:

- compiling only
- producing an APK without installing it
- installing without launching
- launching without framework runtime initialization
- replacing the framework with WebView or another unrelated strategy
- generating a fake/mock APK
- suppressing or hiding runtime errors
- changing acceptance criteria to match a broken implementation
- moving to another framework because the current framework is failing
- claiming device/runtime PASS from CI alone

## 9. Runtime-sensitive framework rule

For runtime-sensitive frameworks, the minimum completion chain is:

`DETECT → REQUIREMENTS → TOOLCHAIN → PREPARE → DEPENDENCIES → BUILD → APK VALIDATE → INSTALL → RUNTIME → FUNCTIONAL → EVIDENCE`

Build success is therefore an intermediate state, not framework completion.

## 10. Agent task output

Before implementation, an agent should produce a machine-readable/current-state equivalent of:

```
FRAMEWORK: <name>
OVERALL_STATUS: INCOMPLETE | BLOCKED | COMPLETE

CURRENT_FAILED_STAGE: <stage>
CURRENT_REQUIREMENT: <requirement id>
ROOT_CAUSE_OR_UNKNOWN: <diagnosis>
NEXT_ACTION: <bounded implementation task>

REQUIRED_CHANGES:
  - <change>

SUCCESS_CRITERIA:
  - <observable criterion>

TESTS:
  - <test/evidence>

PROHIBITED_ACTIONS:
  - <fallback that would violate the contract>

BLOCKED_BY:
  - <external dependency/input, if any>
```

## 11. Definition of Done

A framework is COMPLETE only when:

1. every applicable required stage is `PASS`;
2. every requirement has current evidence;
3. the real framework-native flow has been exercised;
4. a real APK has been validated;
5. runtime acceptance has passed where required;
6. functional acceptance has passed where required;
7. failure/recovery behavior is documented;
8. tests/regression checks pass;
9. evidence identifies the verified commit/environment;
10. the milestone gate is explicitly satisfied.

This contract is the bridge between the Builder's project goal and an AI agent's implementation decisions.
