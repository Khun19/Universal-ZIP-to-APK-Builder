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

**Classification:** CONFIRMED SECURITY FINDING

Candidate M6 work has a CodeQL finding around `lib/worker.ts` involving shell command construction with a path.

**Required fix:** safe argument-based process execution or equivalent validated safe execution. Do not suppress the finding.

## Rules

- One root cause → one minimal fix → regression test → build → device validation.
- FAIL/BLOCKED stays on the same step.
- No Expo until RN G1–G13 PASS.
- No BMAD.
