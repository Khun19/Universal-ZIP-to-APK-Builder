# M6 Toolchain Preflight & Evidence Contract

## Purpose

M6 remains the canonical React Native milestone. This checkpoint adds the first part of the modern evidence model without changing the acceptance rule: **G1–G13 must all pass before M6 is complete.**

## Pre-build contract

For the React Native strategy, the Builder now performs a toolchain preflight before the Android Gradle build:

- React Native version
- Node version
- package-manager version
- JDK 17 availability and actual java -version
- Gradle Wrapper version from gradle-wrapper.properties
- Android Gradle Plugin version from the Android root build file
- Android SDK path
- host ABI
- AGP/Gradle minimum compatibility when the AGP version is known

A known incompatibility fails early. Unknown compatibility is recorded as UNVERIFIED rather than guessed.

The M6 baseline deliberately uses JDK 17. React Native's Android environment guidance recommends JDK 17, and AGP 8.x requires JDK 17. The canonical fixture uses AGP 8.7.3, for which Android Developers document Gradle 8.9 as the minimum.

## Evidence schema

lib/m6-evidence.ts defines:

- per-stage start time and duration
- gate state
- toolchain snapshot
- APK size and SHA-256
- failure classification

The current Builder records evidence for:

- G3 dependency installation
- G4/G5 toolchain preflight
- G7 native compilation
- G8 APK validation

G1/G2/G6 and G9–G13 still require their dedicated test/device evidence. They are intentionally not marked PASS by this checkpoint.

## Failure classification

The first classification layer distinguishes common root-cause families:

- ANDROID_AAPT2
- JDK_COMPATIBILITY
- AGP_CONFIGURATION
- DEPENDENCY_RESOLUTION
- NATIVE_TOOLCHAIN
- METRO_BUNDLE
- RESOURCE_MEMORY
- RESOURCE_DISK
- NETWORK_OR_TIMEOUT
- UNKNOWN_BUILD_FAILURE

This is diagnostic evidence, not auto-repair. Smart Recovery remains a later milestone after M6 PASS.

## Performance evidence

Stage duration is now captured for dependency installation, preflight, native compilation, and APK validation. This gives the later Performance Layer real measurements without enabling Gradle Configuration Cache/Build Cache during the M6 stabilization gate.

## Acceptance rule

- No Expo.
- No M7.
- No later recovery/performance/technology-expansion implementation.
- Termux remains the final authority for G9–G13.
- A failed gate keeps M6 on the same gate.