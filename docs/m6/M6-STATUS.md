# M6 React Native — Status

## Canonical implementation checkpoint

- Canonical branch: `feat/m6-react-native-canonical`
- Base implementation: cumulative PR #14 head `1fdf54`
- Baseline main: `afc19ee5b9c22fb5dae1a8852797ba4ef51e04ac`
- M6 scope: React Native Android only
- Expo: BLOCKED until React Native G1–G13 PASS

## Gates

| Gate | Requirement | Status |
|---|---|---|
| G1 | React Native detection | IMPLEMENTED / VERIFY |
| G2 | Official RN Android flow | IMPLEMENTED / VERIFY |
| G3 | Dependency installation | IMPLEMENTED / VERIFY |
| G4 | JDK 17 | IMPLEMENTED IN CUMULATIVE FIX / VERIFY |
| G5 | Gradle configuration | VERIFY |
| G6 | Metro/JS bundling | VERIFY |
| G7 | Native Android compilation | VERIFY |
| G8 | APK structural validation | VERIFY |
| G9 | APK installation | NOT YET ACCEPTED |
| G10 | Application launch | NOT YET ACCEPTED |
| G11 | RN runtime initialization | NOT YET ACCEPTED |
| G12 | JS/UI rendering | NOT YET ACCEPTED |
| G13 | Basic interaction | NOT YET ACCEPTED |

**M6 is NOT PASS.**

Build/CI success is not runtime PASS.

## Candidate history consolidated

PR #12 = initial RN implementation.
PR #13 = cumulative JDK 17 enforcement.
PR #14 = cumulative dependency declaration.

The canonical branch starts from PR #14 so those candidate fixes remain available as one coherent history.

## Known blocker

The CodeQL finding in `lib/worker.ts` was confirmed: `flutterCommand()` produced a shell command string containing `scaffoldPath`, and that string was passed to `exec()` (shell execution). The implementation now uses `execFile()` with discrete argv, including a positional-argument PRoot wrapper. Regression coverage was added. Tests/build validation are still required before this security checkpoint can be marked PASS.

## Runtime blocker

The real-device launch/runtime gate remains open. Do not guess Hermes/JSC/New Architecture as root cause; reproduce and collect device evidence first.

## Next

Start at Step 1: baseline audit of this canonical branch, then fix one root cause at a time.
