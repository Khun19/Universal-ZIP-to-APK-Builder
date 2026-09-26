# M6 React Native — Root Cause Map

## RC-01 — Strategy integration

**Classification:** CONFIRMED ARCHITECTURE GAP ON MAIN

Baseline `main` does not expose a React Native strategy in `lib/strategy.ts`. The canonical M6 branch contains the candidate RN implementation and must be tested to ensure detection reaches the explicit RN flow without WebView fallback.

**Required evidence:** deterministic analyzer + strategy tests.

## RC-02 — JDK 17

**Classification:** CANDIDATE FIX PRESENT; VERIFY

PR #13's cumulative fix addresses RN 0.76.x Gradle plugin JDK 17 toolchain behavior and avoids uncontrolled Foojay provisioning on Termux.

**Required evidence:** clean RN fixture + local JDK17 + successful Gradle configuration/build.

## RC-03 — Dependency declaration

**Classification:** CANDIDATE FIX PRESENT; VERIFY

PR #14 adds RN CLI platform packages and `@babel/runtime` explicitly based on the working RN 0.76.9 / Metro 0.81.5 flow.

**Required evidence:** clean dependency installation + Metro bundle + native build.

## RC-04 — Runtime launch

**Classification:** CONFIRMED FAILURE / ROOT CAUSE OPEN

The previous M6 path did not establish successful real-device runtime launch.

**Required evidence:** exact install/launch command, logcat, process state, native/JNI/SoLoader evidence if applicable.

## RC-05 — CodeQL shell/path issue

**Classification:** CONFIRMED VULNERABILITY → FIX IMPLEMENTED; VERIFY

`flutterCommand()` concatenated `scaffoldPath` into a shell command string and `exec()` executed that string through a shell. This was a genuine command-injection risk when a path containing shell metacharacters reached the Flutter scaffold command.

**Fix implemented:** Flutter execution now uses `execFile()` with discrete arguments. The Ubuntu PRoot path passes the project path and Flutter executable as positional shell arguments and the wrapper uses `cd -- "$1"` / `exec "$flutter" "$@"` rather than interpolating the project path into the shell script.

**Required evidence:** targeted regression test, typecheck/test suite, and CodeQL/CI verification.

## Rules

- One root cause → one minimal fix → regression test → build → device validation.
- FAIL/BLOCKED stays on the same step.
- No Expo until RN G1–G13 PASS.
- No BMAD.
