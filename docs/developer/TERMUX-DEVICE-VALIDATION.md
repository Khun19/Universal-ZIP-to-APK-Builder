# Termux / Device Validation Contract

## Purpose

The AI agent may derive requirements, implement code, run repository tests, and prepare validation commands. It must not fabricate Android-device evidence.

The validation boundary is:

AI agent -> Termux -> Android package manager/runtime -> device evidence -> GitHub evidence

Termux is the required execution environment for the phone-first builder workflow. Android device state is the runtime truth.

## Commands

Discover the environment:

    pnpm validate:framework discover --framework react-native

Validate an existing APK:

    pnpm validate:framework validate \
      --framework react-native \
      --apk /storage/emulated/0/Download/M6-React-Native-Final-Test.apk \
      --package com.builder.m6reactnative \
      --output /storage/emulated/0/Download/M6-react-native-validation.json

When installation is part of the evidence, add:

    --install

If activity resolution cannot determine the launcher activity, provide:

    --activity com.builder.m6reactnative/.MainActivity

## Evidence rules

- APK_VALIDATE=PASS means the APK exists and its integrity/signature checks passed when available.
- INSTALL=PASS means Android package installation completed successfully.
- RUNTIME=PASS means launcher/process evidence passed; it does not prove feature behavior.
- FUNCTIONAL=NOT_VERIFIED is intentional until actual UI/feature behavior is tested.
- Missing device evidence never becomes a fabricated PASS.
- If a required stage is FAIL, NOT_VERIFIED, or BLOCKED, the framework remains incomplete at the earliest applicable stage.

## React Native rule

For the current M6 gate, do not move to Expo merely because React Native runtime is difficult. RN must first pass its required runtime stages using the official/native Android flow.

Known runtime symptoms such as missing native libraries are treated as evidence to trace back to the framework requirement and packaging/configuration state, not as the requirement itself.
