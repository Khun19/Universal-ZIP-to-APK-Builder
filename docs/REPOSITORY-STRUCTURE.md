# Repository Structure Contract

This document defines the canonical repository layout for the phone-first Universal ZIP-to-APK Builder.

## Canonical product layers

1. `artifacts/zip-to-apk-builder/` — Layer 1: Android Builder UI source/prototype.
2. `scripts/` — Layer 2: Termux/local environment setup and diagnostics.
3. `lib/` — Layer 3: GitHub Builder code.

Legacy server, database, queue, worker, Docker/container, Replit, and hosted-backend components are not canonical product layers.

## Target core layout

```text
Universal-ZIP-to-APK-Builder/
├── artifacts/
│   └── zip-to-apk-builder/       # Layer 1 — UI
├── lib/                          # Layer 3 — Builder core
│   ├── analyzer/                 # detection/evidence
│   ├── security/                 # untrusted ZIP/input protection
│   ├── build-engine/             # shared process/build lifecycle
│   ├── strategies/               # explicit strategy registry
│   ├── adapters/                 # official framework-flow adapters
│   ├── apk/                      # APK discovery/validation/hash
│   └── shared/                   # shared contracts/types
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   ├── security/
│   └── acceptance/
├── scripts/                      # Layer 2 — Termux/setup/diagnostics
├── docs/
│   ├── ARCHITECTURE.md
│   ├── VALIDATION-WORKFLOW.md
│   ├── TEST-MATRIX.md
│   └── ADR/
├── ROADMAP.md
└── AGENTS.md
```

## Consolidation rule

The target layout is a **boundary contract**, not permission to blindly move existing code.

Existing code is migrated only when its ownership is understood, imports/workspace references are updated together, tests remain valid, Termux validation is preserved, and the change has a focused commit.

## Core ownership

| Area | Responsibility |
|---|---|
| analyzer | project detection, evidence, confidence, ambiguity |
| security | ZIP/input safety and workspace protection |
| build-engine | process execution, isolation, time/resource limits, lifecycle |
| strategies | deterministic strategy selection |
| adapters | real official framework build flows |
| apk | discovery, structural validation, metadata, SHA-256 |
| shared | contracts/types used across the core |
| tests | verification and acceptance evidence |
| scripts | phone/Termux environment preparation and diagnostics |
| UI | presentation of real Builder state |

## Current consolidation status

- Canonical three-layer architecture: **DEFINED**
- Target repository structure: **DEFINED**
- M6 RN canonical path: **ACTIVE**
- Legacy/secondary inventory: **IN PROGRESS**
- Physical code migration: **NOT STARTED**
- M6 runtime gate: **NOT PASS**
