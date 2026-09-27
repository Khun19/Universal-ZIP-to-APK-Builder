# Developer Engineering Documentation

This directory is INTERNAL engineering documentation for developers and AI agents building the Universal ZIP-to-APK Builder. It is not end-user documentation.

## Purpose

A developer should be able to enter this directory and determine:
1. Project goal and applicable milestone
2. Architecture boundary
3. Framework build strategy
4. Build Flow Contract
5. Required inputs and toolchain
6. Preparation and dependency stages
7. Real build procedure
8. APK/artifact validation
9. Install and runtime validation
10. Test/evidence requirements
11. Failure and recovery expectations
12. Definition of Done and milestone gate

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

This directory is a navigation and engineering-contract layer. It must not become a second roadmap or competing architecture source.

## Developer flow

~~~
PROJECT GOAL
    ↓
MILESTONE / SCOPE
    ↓
FRAMEWORK BUILD STRATEGY
    ↓
BUILD FLOW CONTRACT
    ↓
DETECT
    ↓
REQUIREMENTS
    ↓
TOOLCHAIN
    ↓
PREPARE
    ↓
DEPENDENCIES
    ↓
REAL BUILD
    ↓
APK / ARTIFACT VALIDATION
    ↓
INSTALL
    ↓
RUNTIME
    ↓
FUNCTIONAL VALIDATION
    ↓
EVIDENCE
    ↓
MILESTONE GATE
~~~

## Audience boundary

Developer documentation may contain implementation details, commands, toolchain requirements, architecture, source paths, test contracts, failure classes, and recovery rules.

It must not be written as instructions for a person who is simply using the Builder to create an APK.

For end-user documentation, use docs/user/.

## Non-negotiable engineering rule

A framework is not considered supported merely because detection or source-level strategy code exists.

For a runtime-sensitive framework, evidence must progress through the applicable gates:

Detect → Prepare → Build → APK Validate → Install → Launch/Runtime → Functional Validation

CI/build success alone must not be promoted to runtime PASS.
