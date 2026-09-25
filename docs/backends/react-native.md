# Official React Native Build Backend

The React Native backend is an orchestrator, not a replacement React Native build system.

## Build contract

1. Detect a genuine React Native project from package metadata.
2. Install the project's declared JavaScript dependencies with its detected package manager.
3. Require a real Android project for a pure React Native app.
4. For pure React Native projects, configure the disposable workspace to use React Native's documented build-from-source composite:
   - `includeBuild('../node_modules/react-native')`
   - dependency substitution for `react-android`, `react-native`, `hermes-android`, and `hermes-engine`.
5. Keep Hermes enabled and let React Native own Hermes/Metro/Codegen/native compilation.
6. Invoke the project's Gradle wrapper when present, otherwise the installed Gradle fallback.
7. Validate the produced APK as a real Android archive and record its SHA-256.
8. Runtime installation/launch validation remains an external phone gate; a successful Gradle build alone is not an M6 PASS.

## Non-goals

- Do not vendor or fork React Native.
- Do not replace Hermes with a fake executable.
- Do not disable Hermes to hide a host-toolchain failure.
- Do not synthesize an Android project for a pure React Native ZIP.
- Do not move to Expo before the React Native runtime gate passes.

## Termux/aarch64

The backend intentionally keeps Hermes enabled and uses React Native's source-build path. The aarch64 host compiler/toolchain remains a separate environment capability gate and must be proven with a real `hermesc` and a real APK/runtime build.
