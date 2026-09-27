# Developer Engineering Documentation

This directory is INTERNAL engineering documentation for developers and AI agents building the Universal ZIP-to-APK Builder. It is not end-user documentation.

## Purpose

A developer should be able to enter this directory and determine:
1. Project goal and applicable milestone
2. Architecture boundary
3. Framework build strategy
4. Build Flow Contract
5. Framework-specific requirements derived from the project goal
6. Current completion state and exact next action
7. Required inputs and toolchain
8. Preparation and dependency stages
9. Real build procedure
10. APK/artifact validation
11. Install and runtime validation
12. Test/evidence requirements
13. Failure and recovery expectations
14. Definition of Done and milestone gate

## Canonical source map

| Concern | Canonical source |
|---|---|
| Product/milestone goal | /ROADMAP.md |
| System architecture | docs/ARCHITECTURE.md |
| Build acceptance/test evidence | docs/TEST-MATRIX.md |
| GitHub → Termux → device validation | docs/VALIDATION-WORKFLOW.md |
| Long-term architectural decisions | docs/ADR/ |
| Agent/developer operating rules | /AGENTS.md |
| Framework flow contract | docs/developer/FRAMEWORK-BUILD-FLOW-CONTRACT.md |
| Requirement derivation | docs/developer/FRAMEWORK-REQUIREMENT-DERIVATION.md |
| Machine-checkable completion state | docs/developer/framework-completion-status.schema.json |
| Completion-state example | docs/developer/FRAMEWORK-COMPLETION-STATE-EXAMPLE.md |

This directory is a navigation and engineering-contract layer. It must not become a second roadmap or competing architecture source.

## Developer flow

~~~
PROJECT GOAL
    ↓
MILESTONE / SCOPE
    ↓
FRAMEWORK BUILD STRATEGY
    ↓
DERIVE FRAMEWORK REQUIREMENTS
    ↓
BUILD FLOW CONTRACT
    ↓
CURRENT IMPLEMENTATION + EVIDENCE
    ↓
COMPLETION STATUS MATRIX
    ↓
EARLIEST GAP / BLOCKER
    ↓
BOUNDED IMPLEMENTATION TASK
    ↓
TEST + REAL VALIDATION
    ↓
UPDATE EVIDENCE / STATUS
    ↓
MILESTONE GATE
~~~

## AI-agent operating rule

When a framework is incomplete, the agent must not treat the visible error as the whole task.

It must derive the required framework behavior from the project goal, compare that required state with current implementation and evidence, identify the earliest unmet requirement, and implement what is necessary to satisfy that requirement.

The agent may add strategy code, framework adapters, toolchain handling, preparation, dependency handling, native configuration, tests, fixtures, diagnostics, or deterministic recovery when those changes are required by the derived requirements.

The agent must remain on the current failed stage until its acceptance criteria are verified. It must not silently change the acceptance criteria, use an unrelated fallback, or advance to another framework merely because the current one is difficult.

## Audience boundary

Developer documentation may contain implementation details, commands, toolchain requirements, architecture, source paths, test contracts, failure classes, and recovery rules.

It must not be written as instructions for a person who is simply using the Builder to create an APK.

For end-user documentation, use docs/user/.

## Non-negotiable engineering rule

A framework is not considered supported merely because detection or source-level strategy code exists.

For a runtime-sensitive framework, evidence must progress through the applicable gates:

Detect → Requirements → Toolchain → Prepare → Dependencies → Build → APK Validate → Install → Launch/Runtime → Functional Validation → Evidence

CI/build success alone must not be promoted to runtime PASS.
