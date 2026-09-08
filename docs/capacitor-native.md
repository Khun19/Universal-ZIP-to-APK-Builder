# Capacitor and Native Android builds

## Native Android ZIPs

The builder accepts an Android Gradle project at the ZIP root, under an
`android/` directory, or under one top-level directory. A native project must
contain:

- `settings.gradle` or `settings.gradle.kts`
- an `app/` module
- `AndroidManifest.xml`

The worker preserves the existing Android project, creates `local.properties`
from `ANDROID_HOME` when it is missing, runs the project's `gradlew` when
present, and otherwise uses the installed `gradle` command without forcing a
hard-coded wrapper version. This lets projects that require newer Android
Gradle Plugin versions select a compatible local Gradle installation.

## Capacitor ZIPs

A Capacitor project is detected by `capacitor.config.ts`, `capacitor.config.js`,
`capacitor.config.json`, or an equivalent config file. The project should also
contain a `package.json` with the local Capacitor CLI and Android package:

```bash
pnpm add @capacitor/core @capacitor/android
pnpm add -D @capacitor/cli
```

The build flow is:

```text
install JavaScript dependencies
→ npm/pnpm run build
→ cap add android (only when android/ is missing)
→ cap sync android
→ android/gradlew assembleDebug
→ validate the APK
```

Build a Capacitor ZIP through the CLI:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export AAPT2_PATH="$(command -v aapt2)"

pnpm exec tsx lib/cli.ts /path/to/capacitor-project.zip
```

The CLI does not download a global Capacitor CLI. It uses the project's local
CLI through the detected package manager, so the CLI and `@capacitor/android`
must be declared in the uploaded project's dependencies.

## Termux checks

```bash
java -version
node --version
pnpm --version
gradle --version
sdkmanager --list_installed
```

For Termux, `android.aapt2FromMavenOverride` should point to a working
`aapt2`, for example:

```text
android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2
```
