#!/usr/bin/env bash
set -u

APK="tests/fixtures/nested-expo-monorepo/artifacts/focus-mode/android/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="com.rzbuilder.fixture.focusmode"
STATUS="INCONCLUSIVE"
REASON="No final classification was produced"
SOURCE_SHA="${GITHUB_SHA:-UNKNOWN}"
APK_SHA256="UNAVAILABLE"
INSTALL_RC="NOT_RUN"
LAUNCH_RC="NOT_RUN"
PROCESS_RC="NOT_RUN"
SCREENSHOT_RC="NOT_RUN"
HEALTH_RC="NOT_RUN"

write_result() {
  export STATUS REASON SOURCE_SHA APK_SHA256 INSTALL_RC LAUNCH_RC PROCESS_RC SCREENSHOT_RC HEALTH_RC
  python3 - <<'PY'
import json, os
payload = {
  "schema_version": 1,
  "status": os.environ["STATUS"],
  "reason": os.environ["REASON"],
  "source_sha": os.environ["SOURCE_SHA"],
  "apk_sha256": os.environ["APK_SHA256"],
  "emulator_api": 35,
  "emulator_abi": "x86_64",
  "package_name": "com.rzbuilder.fixture.focusmode",
  "health_exit_code": os.environ["HEALTH_RC"],
  "install_exit_code": os.environ["INSTALL_RC"],
  "launch_exit_code": os.environ["LAUNCH_RC"],
  "process_check_exit_code": os.environ["PROCESS_RC"],
  "screenshot_exit_code": os.environ["SCREENSHOT_RC"],
}
with open("emulator-result.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)
    f.write("\n")
PY
  {
    echo "EMULATOR_RESULT=$STATUS"
    echo "EMULATOR_REASON=$REASON"
    echo "SOURCE_SHA=$SOURCE_SHA"
    echo "APK_SHA256=$APK_SHA256"
    echo "HEALTH_EXIT_CODE=$HEALTH_RC"
    echo "INSTALL_EXIT_CODE=$INSTALL_RC"
    echo "LAUNCH_EXIT_CODE=$LAUNCH_RC"
    echo "PROCESS_CHECK_EXIT_CODE=$PROCESS_RC"
    echo "SCREENSHOT_EXIT_CODE=$SCREENSHOT_RC"
  } | tee -a apk-evidence.txt
}

collect_logcat() {
  adb logcat -d > emulator-logcat.txt 2>&1 || true
}

if ! command -v adb >/dev/null 2>&1; then
  STATUS="BLOCKED_EMULATOR"
  REASON="adb executable is unavailable in the test environment"
  HEALTH_RC=127
  printf '%s\n' "$REASON" > emulator-health.txt
  write_result
  exit 20
fi

timeout 60 adb wait-for-device > emulator-health.txt 2>&1
wait_rc=$?
boot_completed="$(timeout 30 adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
device_state="$(adb get-state 2>/dev/null | tr -d '\r')"
if [[ "$wait_rc" -ne 0 || "$boot_completed" != "1" || "$device_state" != "device" ]]; then
  HEALTH_RC="${wait_rc}"
  STATUS="BLOCKED_EMULATOR"
  REASON="Emulator did not reach ready state: wait_rc=$wait_rc boot_completed=$boot_completed device_state=$device_state"
  printf '%s\n' "$REASON" | tee -a emulator-health.txt
  collect_logcat
  write_result
  exit 20
fi
HEALTH_RC=0
printf 'ADB_STATE=%s\nSYS_BOOT_COMPLETED=%s\n' "$device_state" "$boot_completed" | tee -a emulator-health.txt

if [[ ! -s "$APK" ]]; then
  STATUS="BLOCKED_EVIDENCE"
  REASON="Expected APK file is missing or empty: $APK"
  printf '%s\n' "$REASON" | tee emulator-install.txt
  collect_logcat
  write_result
  exit 21
fi
APK_SHA256="$(sha256sum "$APK" | cut -d ' ' -f1)"

adb install -r "$APK" > emulator-install.txt 2>&1
INSTALL_RC=$?
if [[ "$INSTALL_RC" -ne 0 ]]; then
  STATUS="INCONCLUSIVE_INSTALL"
  REASON="Emulator health passed, but install failed; inspect install output and logcat before attributing the cause to APK or Emulator"
  collect_logcat
  write_result
  exit 1
fi

adb shell monkey -p "$PACKAGE" 1 > emulator-launch.txt 2>&1
LAUNCH_RC=$?
if [[ "$LAUNCH_RC" -ne 0 ]]; then
  STATUS="INCONCLUSIVE_LAUNCH"
  REASON="Install passed but launch command failed; inspect launch output and logcat"
  collect_logcat
  write_result
  exit 1
fi

sleep 5
adb shell pidof "$PACKAGE" > emulator-process.txt 2>&1
PROCESS_RC=$?
if [[ "$PROCESS_RC" -ne 0 || ! -s emulator-process.txt ]]; then
  collect_logcat
  if grep -Eqi 'FATAL EXCEPTION|AndroidRuntime.*FATAL' emulator-logcat.txt; then
    STATUS="FAIL_APP_RUNTIME"
    REASON="Install and launch command passed, but app process was not present and fatal runtime evidence was found"
  else
    STATUS="INCONCLUSIVE_RUNTIME"
    REASON="Install and launch command passed, but process verification failed without enough evidence to assign root cause"
  fi
  write_result
  exit 1
fi

adb exec-out screencap -p > emulator-screenshot.png 2>emulator-screenshot.stderr
SCREENSHOT_RC=$?
if [[ "$SCREENSHOT_RC" -ne 0 || ! -s emulator-screenshot.png ]]; then
  STATUS="INCONCLUSIVE_EVIDENCE"
  REASON="Install, launch, and process checks passed, but screenshot evidence could not be collected"
  collect_logcat
  write_result
  exit 1
fi

collect_logcat
STATUS="PASS"
REASON="Emulator health, exact APK install, launch command, process check, and screenshot collection passed; this smoke test does not prove full UI behavior or cross-framework coverage"
write_result
exit 0
