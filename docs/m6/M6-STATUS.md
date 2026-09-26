# M6 React Native — Status

## Starting Point

- Baseline branch: `main`
- Preparation branch: `chore/m6-agent-handoff-prep`
- M6 scope: React Native Android only
- Expo: **BLOCKED until React Native G1–G13 are PASS**
- Workflow: GitHub-Gated Milestone Development & Termux Validation Loop

## Acceptance Gates

| Gate | Requirement | Status |
|---|---|---|
| G1 | React Native project detection | NOT VERIFIED |
| G2 | Official React Native Android flow/scaffold | NOT VERIFIED |
| G3 | Dependency installation | NOT VERIFIED |
| G4 | JDK 17 selection/enforcement | FIX EXISTS IN PR #13; NOT BASELINE-PASS |
| G5 | Gradle configuration | NOT VERIFIED |
| G6 | Metro/JS bundling | NOT VERIFIED |
| G7 | Native Android compilation | NOT VERIFIED |
| G8 | APK structural validation | NOT VERIFIED |
| G9 | APK installation | NOT VERIFIED |
| G10 | Application launch | FAIL/PENDING REPRODUCTION ON CURRENT BASELINE |
| G11 | React Native runtime initialization | NOT VERIFIED |
| G12 | JavaScript/UI rendering | NOT VERIFIED |
| G13 | Basic runtime interaction | NOT VERIFIED |

## Important Rule

Build success, APK existence, APK installation, or CI success does **not** equal M6 PASS.

M6 PASS requires G1–G13 with evidence.

## Known Open M6 Work

- PR #12: React Native Android flow
- PR #13: JDK 17 enforcement
- PR #14: React Native dependency declaration

These are not treated as merged M6 PASS evidence.

## Current Architecture Finding

The current `main` `lib/strategy.ts` strategy union contains:

- `native-gradle`
- `capacitor`
- `web-wrapper`
- `unknown`

It does not currently expose a React Native strategy in the baseline file. This must be resolved as part of M6 architecture work rather than bypassed with a generic WebView fallback.

## Security Finding

PR #12 and PR #14 have an unresolved CodeQL finding around `lib/worker.ts` line 368 concerning shell commands constructed from uncontrolled absolute paths. This must be fixed or explicitly proven safe before the affected M6 path is considered production-ready.

## Non-Goals

- No Expo work.
- No APK Identity Layer.
- No unrelated milestone changes.
- No fake/mock APK path.
- No generic WebView fallback for a React Native project.

## Status

**M6 = NOT PASS / BLOCKED FOR FURTHER ROOT-CAUSE WORK**
