# M6 React Native — AI Agent Handoff

## Mission

Fix M6 React Native Android support through the real React Native native Android build flow.

## Hard Rules

1. React Native only.
2. Expo is blocked until M6 React Native G1–G13 are PASS.
3. No BMAD.
4. One root cause at a time.
5. One fix at a time.
6. Every completed step must be committed and pushed.
7. A failed step stays failed until fixed and re-tested.
8. Never claim runtime PASS from build/CI/source inspection.
9. Do not replace RN with a generic WebView wrapper.
10. Do not weaken security checks to make a build pass.

## Current Checkpoint

**Current Step:** STEP 1 — Baseline Audit

**Status:** READY

**Last PASS:** None for complete M6

**Last known failure:** RN APK previously reached installation but runtime launch was not established.

**Known confirmed architecture gap:** Baseline `lib/strategy.ts` has no explicit React Native strategy.

**Known external fixes to evaluate:** PR #13 (JDK 17), PR #14 (RN dependency declaration), PR #12 (RN flow).

**Known security blocker:** CodeQL shell/path construction finding around `lib/worker.ts` line 368 in PR #12/#14.

**Expo:** BLOCKED

## Required Step Record

For every step, update this file with:

- STEP
- STATUS
- ROOT CAUSE
- EVIDENCE
- FIX
- FILES CHANGED
- TESTS
- BUILD RESULT
- APK PATH
- APK SIZE
- APK SHA-256
- INSTALL RESULT
- LAUNCH RESULT
- RUNTIME RESULT
- DEVICE/ENVIRONMENT
- COMMIT SHA
- NEXT ACTION
- KNOWN LIMITATIONS

## Handoff Rule

Another AI agent must be able to continue from this file and the referenced Git commit without this chat.

If the current AI session ends, the next agent must:

1. Read this file.
2. Inspect the recorded commit.
3. Reproduce the current failure.
4. Continue only from the recorded NEXT ACTION.
5. Never redo a completed PASS step unless regression evidence requires it.

## M6 PASS Definition

M6 is PASS only when all G1–G13 are evidenced:

G1 detection
G2 official RN Android flow
G3 dependencies
G4 JDK17
G5 Gradle
G6 Metro
G7 native compile
G8 APK validation
G9 install
G10 launch
G11 RN runtime
G12 JS/UI
G13 interaction

## Current Next Action

Perform the complete baseline audit on `main`, compare PR #12/#13/#14 against it, and select the smallest coherent M6 implementation path. Do not merge unrelated work and do not start Expo.
