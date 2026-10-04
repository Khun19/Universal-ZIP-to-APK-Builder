# Independent React Native 0.76.9 Smoke Test

This test is intentionally separate from the M6 fixture. It creates a fresh React Native 0.76.9 project using the official React Native Community CLI, installs dependencies with npm, builds the Android APK with JDK 17, then optionally installs and launches the APK on the real phone through the existing Shizuku/rish bridge.

Purpose:

- distinguish a React Native runtime/environment problem from an M6 fixture problem;
- avoid the M6 fixture's pnpm workspace and custom Java application classes;
- test the standard RN 0.76.9 New Architecture baseline;
- keep the existing M6 fixture untouched.

React Native 0.76 enables the New Architecture by default. The standard template uses the React Native 0.76 New Architecture and merged native-library/SoLoader flow.

## Termux

After pulling branch `test/rn-independent-smoke-0769`:

```bash
cd ~/Universal-ZIP-to-APK-Builder
git checkout test/rn-independent-smoke-0769
git pull --ff-only origin test/rn-independent-smoke-0769
bash scripts/m6-rn-independent-smoke.sh
```

The script uses JDK 17 explicitly. This smoke test pins JDK 17 because the M6 Termux environment has already shown Gradle/JDK compatibility issues with newer JDKs.

The complete output is saved to:

`.workspace/rn-independent-smoke-0769-result.txt`

To build only, without device installation/launch:

```bash
RUN_DEVICE_TEST=0 bash scripts/m6-rn-independent-smoke.sh
```

To reuse the generated project without recreating/installing dependencies:

```bash
REBUILD=0 bash scripts/m6-rn-independent-smoke.sh
```

Expected decision:

- **Build PASS + install PASS + launch PASS** → RN 0.76.9 works on this Termux/MIUI device; the M6 runtime failure is fixture/configuration-specific.
- **Build PASS + install PASS + launch FAIL** → investigate RN/Android/Termux/MIUI runtime compatibility independently of M6.
- **Build FAIL** → investigate the Termux Android/Gradle/JDK environment before changing M6 runtime code.
