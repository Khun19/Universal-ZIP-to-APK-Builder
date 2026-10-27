#!/usr/bin/env bash
set +e
APK="tests/fixtures/nested-expo-monorepo/artifacts/focus-mode/android/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="com.rzbuilder.fixture.focusmode"

if [[ ! -s "$APK" ]]; then
  printf 'APK missing or empty: %s\n' "$APK" > emulator-install.txt
  install_rc=98
else
  adb wait-for-device
  adb install -r "$APK" > emulator-install.txt 2>&1
  install_rc=$?
fi

if [[ "$install_rc" -eq 0 ]]; then
  adb shell monkey -p "$PACKAGE" 1 > emulator-launch.txt 2>&1
  launch_rc=$?
  sleep 8
  adb shell pidof "$PACKAGE" > emulator-process.txt 2>&1
  process_rc=$?
  adb exec-out screencap -p > emulator-screenshot.png 2>/dev/null
  screenshot_rc=$?
  adb logcat -d > emulator-logcat.txt 2>&1
else
  launch_rc=99
  process_rc=99
  screenshot_rc=99
  printf 'Install failed; launch not attempted.\n' > emulator-launch.txt
  adb logcat -d > emulator-logcat.txt 2>&1
fi

{
  echo "SOURCE_SHA=$GITHUB_SHA"
  if [[ -s "$APK" ]]; then
    echo "APK_SHA256=$(sha256sum "$APK" | cut -d ' ' -f1)"
  else
    echo "APK_SHA256=UNAVAILABLE"
  fi
  echo "EMULATOR_API=35"
  echo "EMULATOR_ABI=x86_64"
  echo "INSTALL_EXIT_CODE=$install_rc"
  echo "LAUNCH_EXIT_CODE=$launch_rc"
  echo "PROCESS_CHECK_EXIT_CODE=$process_rc"
  echo "SCREENSHOT_EXIT_CODE=$screenshot_rc"
} | tee -a apk-evidence.txt

test "$install_rc" -eq 0 && test "$launch_rc" -eq 0 && test "$process_rc" -eq 0 && test "$screenshot_rc" -eq 0
