# M6 React Native — AI Agent Handoff

## Canonical branch

`feat/m6-react-native-canonical`

Starting implementation commit:

`1fdf54` (PR #14 cumulative candidate)

Baseline main:

`afc19ee5b9c22fb5dae1a8852797ba4ef51e04ac`

## Mission

Make the real React Native Android flow work end-to-end through the Builder.

## Hard rules

1. RN only; Expo is blocked.
2. Do not use BMAD.
3. Do not replace RN with WebView/mock APK.
4. One root cause at a time.
5. Every PASS step gets its own commit/push checkpoint.
6. FAIL/BLOCKED does not advance.
7. Build success is not runtime PASS.
8. Security findings must be fixed, not suppressed.

## Current step

**STEP 1 — Canonical baseline audit**

Status: READY

## Acceptance gates

G1 Detection
G2 Official RN Android flow
G3 Dependencies
G4 JDK 17
G5 Gradle
G6 Metro
G7 Native compile
G8 APK validation
G9 Install
G10 Launch
G11 RN runtime
G12 JS/UI
G13 Interaction

M6 PASS requires all 13.

## Known work inherited

- PR #12 initial RN flow
- PR #13 JDK 17 enforcement
- PR #14 dependency declaration

These are consolidated in this branch for audit/fix continuity.

## Known blockers

- CodeQL shell/path construction finding in candidate worker flow.
- Real-device launch/runtime not yet accepted.

## Checkpoint format

After every completed step record:
- step/status
- root cause/evidence
- fix
- files changed
- tests
- build result
- APK path/size/SHA-256
- install result
- launch result
- runtime result
- environment/device
- commit SHA
- next action
- limitations

## Handoff

If an AI session ends, the next agent reads this file, inspects the latest commit, reproduces only the current step, and continues from NEXT ACTION. Do not redo completed PASS work unless regression evidence requires it.
