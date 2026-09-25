# M3 Flutter Termux Runtime Recovery

## Failure

The real Termux Flutter build reached:

```
flutter pub get && flutter build apk --debug
```

but the Flutter SDK's bundled Dart executable failed with an Android/Termux-style:

```
cannot execute: required file not found
```

A Flutter checkout can therefore exist on the host filesystem while its bundled Dart runtime is not executable on the host OS.

## Root cause

The builder previously treated `command -v flutter` as sufficient evidence that Flutter was runnable. That is not enough for a Flutter installation whose wrapper script exists but whose bundled Dart ELF cannot execute.

The failure must be classified at the execution-environment boundary before `flutter create`, `flutter pub get`, or `flutter build`.

## Fix

The official Flutter flow now uses a deterministic executor resolver:

1. Resolve the actual `flutter` executable from PATH.
2. Derive its bundled Dart path under `bin/cache/dart-sdk/bin/dart`.
3. Execute `dart --version` directly.
4. Use native Termux Flutter only when that Dart runtime is runnable.
5. Otherwise use the configured Ubuntu PRoot Flutter SDK.
6. Route Flutter Android platform generation through the resolved executor as well.
7. In PRoot mode, use the guest Linux Android SDK from `FLUTTER_PROOT_ANDROID_HOME` and leave AAPT2 resolution to the guest SDK instead of forcing the host Termux AAPT2.
8. Run the real Flutter commands:
   - `flutter pub get`
   - `flutter build apk --debug`
9. Discover the generated APK, validate its Android manifest, and record SHA-256.

## Configuration

Defaults:

```
FLUTTER_PROOT_DISTRO=ubuntu
FLUTTER_PROOT_PATH=/opt/flutter/bin/flutter
FLUTTER_PROOT_ANDROID_HOME=/opt/android-sdk
```

A different PRoot distro, Flutter SDK path, or guest Android SDK can be provided through these environment variables.

## Why PRoot

PRoot-Distro is designed to run Linux distributions inside Termux without root. This provides a glibc/Linux userland for toolchains that are not executable as native Android/Termux binaries.

## Regression coverage

The regression suite checks:

- a broken bundled Dart runtime is detected before Flutter is invoked;
- a working Dart runtime is accepted;
- Flutter strategy selection remains explicit;
- the structured analyzer detects Flutter before treating its `android/` directory as generic native Android;
- the build-engine does not silently route Flutter into the generic web/Capacitor build.

## Acceptance

Source-level regression coverage can be checked in GitHub/CI. The decisive M3 acceptance gate remains a real Termux Flutter project build that produces a real APK and, for runtime-sensitive validation, installation/launch evidence.

This document does not mark the real-device gate as passed.
