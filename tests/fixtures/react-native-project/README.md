# M6 React Native fixture

This fixture contains real React Native package metadata and JavaScript entry
points together with a native Android project. The integration test installs
the declared dependencies, builds the Android project with Gradle, and validates
the generated APK returned by the pipeline.

The debug APK bundles `index.android.bundle` and disables developer support so
that it launches without Metro. It uses the version-matched Hermes runtime: the
legacy Android JSC artifact available to this build does not supply an ARM64
library. `MainApplication` follows the React Native 0.76 bootstrap contract by
initializing SoLoader with `OpenSourceMergedSoMapping`; that mapping is required
to load React Native's merged native libraries on Android.

React Native 0.76.9 distributes an x86_64 Linux `hermesc`, not an ARM64 Linux
host compiler. On Termux ARM64 the fixture configures the React Native Gradle
plugin's supported `hermesCommand` option to run that version-matched compiler
through the installed `qemu-x86_64` user-mode emulator. This is a build-host
compatibility step only; the APK contains the native ARM64 Hermes runtime.
