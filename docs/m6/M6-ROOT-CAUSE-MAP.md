# M6 React Native — Root Cause Map

This document separates confirmed evidence from hypotheses. An item is not a root cause until reproduced and evidenced.

## RC-01 — React Native strategy integration gap

**Classification:** CONFIRMED ARCHITECTURE GAP

**Evidence:** Baseline `lib/strategy.ts` does not define a React Native strategy in its strategy union or switch.

**Impact:** A React Native detector result cannot be considered fully integrated into the baseline strategy registry.

**Required fix:** Add an explicit React Native Official Flow Adapter/strategy and wire it through the existing architecture without unrelated fallback.

**Validation:** Analyzer → strategy selection test must deterministically select React Native.

---

## RC-02 — JDK 17 / Foojay provisioning risk

**Classification:** CONFIRMED ROOT-CAUSE FIX EXISTS OUTSIDE BASELINE

**Evidence:** PR #13 states that React Native 0.76.x's `@react-native/gradle-plugin` declares `kotlin.jvmToolchain(17)). The proposed fix selects a local JDK 17 and fails explicitly instead of allowing Gradle to attempt Foojay provisioning on Termux.

**Current status:** Fix exists in PR #13; not treated as merged baseline evidence.

**Required validation:** Clean RN fixture + Termux JDK17 selection + Gradle build.

---

## RC-03 — React Native dependency declaration

**Classification:** CONFIRMED ROOT-CAUSE FIX EXISTS OUTSIDE BASELINE

**Evidence:** PR #14 reports that the working RN 0.76.9 / Metro 0.81.5 flow required dependencies missing from the fixture metadata, including React Native CLI platform packages and `@babel/runtime`.

**Current status:** Fix exists in PR #14; PR does not claim runtime PASS.

**Required validation:** Clean extraction + dependency install + Metro bundle + native build.

---

## RC-04 — Runtime launch failure

**Classification:** CONFIRMED FAILURE, ROOT CAUSE NOT YET CLOSED

**Symptom:** Previous M6 validation reached APK installation but did not establish a successful RN runtime launch.

**Required action:** Reproduce from the current selected checkpoint and capture Android logcat around process start. Do not guess Hermes/JSC/New Architecture as the root cause.

**Required evidence:** exact launch command, package state, process result, FATAL EXCEPTION/native crash/JNI/SoLoader evidence if present.

---

## RC-05 — CodeQL shell/path construction

**Classification:** CONFIRMED SECURITY FINDING

**Evidence:** PR #12 and PR #14 have a CodeQL finding around `lib/worker.ts` line 368. The affected command construction concatenates a path into a shell command.

**Required fix:** Prefer argument-array process execution (execFile/spawn equivalent) or strict path validation plus safe execution. Do not merely suppress the finding.

**Validation:** security regression test + CodeQL/CI check.

---

## RC-06 — Flutter / unrelated M3 work

**Classification:** OUT OF SCOPE FOR M6

Flutter PR #16 must not be mixed into the M6 React Native fix sequence.

---

## Root-Cause Investigation Order

1. Baseline current main.
2. Resolve React Native strategy integration.
3. Establish official RN fixture flow.
4. Lock dependency contract.
5. Lock local JDK 17.
6. Resolve Gradle/native configuration.
7. Resolve bundling.
8. Produce and structurally validate APK.
9. Install.
10. Reproduce and root-cause launch failure.
11. Prove RN runtime initialization.
12. Prove JS/UI rendering.
13. Prove basic interaction.
14. Record PASS checkpoint.

No step advances after FAIL/BLOCKED.
