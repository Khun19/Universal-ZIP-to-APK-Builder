# GitHub-Gated Milestone Development & Termux Validation Loop

This document is the canonical development protocol for Universal-ZIP-to-APK-Builder.

## Purpose

Keep implementation and real Android validation synchronized. GitHub is the canonical development source; Termux on Android is the real local validation/build environment.

## Source of Truth

- `origin/main` / GitHub `main` is the canonical development state.
- Do not treat an unpushed local change as the completed milestone.
- Before testing, Termux must be synchronized to the exact GitHub commit being validated.

## Required Milestone Loop

For every milestone or capability test:

1. **INSPECT** the current GitHub source and understand the existing implementation.
2. **IMPLEMENT** exactly one milestone or focused fix.
3. **CHECK** relevant automated tests/typechecks before publishing when practical.
4. **COMMIT + PUSH** the implementation to GitHub.
5. **TERMUX SYNC**: the user pulls/resets Termux to the exact GitHub state.
6. **TERMUX VALIDATE**: run typecheck/tests and, when required, the real local build using the real test ZIP.
7. **WAIT** for the user's explicit `PASS` or `FAIL` confirmation.

### If PASS

- The milestone is accepted.
- Only then may development advance to the next milestone/test.

### If FAIL

- Do **not** advance.
- Diagnose the failure in the same milestone.
- Fix the GitHub source.
- Commit and push the fix.
- Have the user synchronize Termux again.
- Repeat validation until the user explicitly confirms `PASS`.

## Hard Rules

- Never silently skip a failed milestone.
- Never move to the next capability test before the current test is explicitly accepted.
- Never declare a real APK build successful from unit tests/typecheck alone.
- Never assume a test ZIP is complete; verify that the user has a suitable complete real-world ZIP for the project type before a real test.
- Do not repeat an already-passed project-type test unless testing a different capability, regression, or explicitly requested scenario.
- Prefer complete copy-pasteable Termux command blocks; do not require `nano` for file editing.
- Preserve unrelated working projects and user data.

## Real APK Build Truth

A build is only considered a real success when all required conditions are satisfied:

- isolated builder process exits successfully (exit code 0)
- a real APK file exists at the expected persisted output path
- the APK is structurally valid as a ZIP/APK
- `AndroidManifest.xml` is readable/valid
- SHA-256 is calculated from the persisted APK bytes
- when installation/runtime validation is part of the milestone, that validation also passes

## Capability Test Sequence

The current capability sequence is intentionally ordered and gated:

| Test | Project type | Primary capability |
|---|---|---|
| A | Local File Manager + ZIP Explorer | Browser File System API + ZIP handling |
| B | Offline Field Survey PWA | PWA / offline storage / form data |
| C | Camera QR Scanner | Camera API + QR scanning |
| D | Web Serial Console | Web Serial API |
| E | Bluetooth Sensor Dashboard | Web Bluetooth API |
| F | NFC Tag Manager | Web NFC API |

Do not reorder or skip this sequence without explicit project-level approval.

## Current Project State

At the time this protocol was added:

- Test A is the current gated capability test.
- The real Test A ZIP is `Local-File-Manager-ZIP-Explorer.zip`.
- A portability fix was added so npm web builds sanitize Replit-internal `resolved` URLs from `package-lock.json` while preserving integrity metadata and use the public npm registry.
- The fix and its regression test are on GitHub `main`.
- Termux typecheck and automated tests must pass before the real Test A build is considered.
- The next action is the real Test A Termux build/validation.
- Test B must not begin until Test A is explicitly confirmed `PASS`.

## New AI / GPT Session Bootstrap

When a new AI/GPT session starts on this repository, first read this file and treat it as the project workflow contract. Then inspect the current GitHub `main` state before making changes.

Recommended bootstrap instruction:

> Read `docs/DEVELOPMENT-WORKFLOW.md` first. Treat GitHub `main` as the source of truth and Termux as the real validation environment. Follow the GitHub-Gated Milestone Development & Termux Validation Loop exactly. Work on only one milestone at a time, push changes to GitHub, wait for Termux validation, and do not advance until the user explicitly confirms PASS. If validation fails, fix the same milestone and republish it.

## Acceptance Language

Use explicit state labels in progress reports:

- `READY FOR TERMUX TEST`
- `TERMUX PASS — WAITING FOR USER CONFIRMATION`
- `TERMUX FAIL — SAME MILESTONE BLOCKED`
- `MILESTONE ACCEPTED — PROCEEDING`

The user's explicit `PASS` is the gate that authorizes the next milestone.
