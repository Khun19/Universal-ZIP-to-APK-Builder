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
PACKAGE_MANAGER_RC="NOT_RUN"
HEALTH_START_MS="$(date +%s%3N)"

write_result() {
  export STATUS REASON SOURCE_SHA APK_SHA256 INSTALL_RC LAUNCH_RC PROCESS_RC SCREENSHOT_RC HEALTH_RC PACKAGE_MANAGER_RC
  python3 - <<'PY'
import json, os
payload = {
  "schema_version": 2,
  "status": os.environ["STATUS"],
  "reason": os.environ["REASON"],
  "source_sha": os.environ["SOURCE_SHA"],
  "apk_sha256": os.environ["APK_SHA256"],
  "emulator_api": 35,
  "emulator_abi": "x86_64",
  "package_name": "com.rzbuilder.fixture.focusmode",
  "health_exit_code": os.environ["HEALTH_RC"],
  "package_manager_exit_code": os.environ["PACKAGE_MANAGER_RC"],
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
    echo "PACKAGE_MANAGER_EXIT_CODE=$PACKAGE_MANAGER_RC"
    echo "INSTALL_EXIT_CODE=$INSTALL_RC"
    echo "LAUNCH_EXIT_CODE=$LAUNCH_RC"
    echo "PROCESS_CHECK_EXIT_CODE=$PROCESS_RC"
    echo "SCREENSHOT_EXIT_CODE=$SCREENSHOT_RC"
  } | tee -a apk-evidence.txt
}

# Bind the result to the exact APK even when the Emulator itself is blocked.
if [[ ! -s "$APK" ]]; then
  STATUS="BLOCKED_EVIDENCE"
  REASON="Expected APK file is missing or empty: $APK"
  printf '%s\n' "$REASON" > emulator-install.txt
  write_result
  exit 21
fi
APK_SHA256="$(sha256sum "$APK" | cut -d ' ' -f1)"

collect_logcat() {
  timeout 30 adb logcat -d -v threadtime > emulator-logcat.txt 2>&1 || true
}

collect_diagnostics() {
  {
    echo "DIAGNOSTIC_CAPTURE_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "SOURCE_SHA=$SOURCE_SHA"
    echo "RUNNER_OS=${RUNNER_OS:-UNKNOWN}"
    echo "RUNNER_ARCH=${RUNNER_ARCH:-UNKNOWN}"
    echo "ANDROID_HOME=${ANDROID_HOME:-UNKNOWN}"
    echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-UNKNOWN}"
    echo "ANDROID_AVD_HOME=${ANDROID_AVD_HOME:-UNKNOWN}"
    echo "ANDROID_API_EXPECTED=35"
    echo "ANDROID_ABI_EXPECTED=x86_64"
    echo "HOST_DISK_USAGE"
    df -h "${GITHUB_WORKSPACE:-.}" /tmp 2>&1 || true
    echo "HOST_MEMORY"
    free -h 2>&1 || cat /proc/meminfo 2>&1 || true
    echo "EMULATOR_BINARY"
    command -v emulator 2>&1 || true
    timeout 10 emulator -version 2>&1 || true
    echo "ADB_VERSION"
    adb version 2>&1 || true
    echo "ADB_DEVICES"
    adb devices -l 2>&1 || true
    echo "EMULATOR_PROPERTIES"
    timeout 10 adb shell getprop ro.build.version.release 2>&1 || true
    timeout 10 adb shell getprop ro.build.version.sdk 2>&1 || true
    timeout 10 adb shell getprop ro.product.cpu.abi 2>&1 || true
    timeout 10 adb shell getprop ro.kernel.qemu 2>&1 || true
    echo "BOOT_ANIMATION_STATE"
    timeout 10 adb shell getprop init.svc.bootanim 2>&1 || true
    echo "PACKAGE_SERVICE"
    timeout 10 adb shell service check package 2>&1 || true
  } >> emulator-health.txt 2>&1
}

if ! command -v adb >/dev/null 2>&1; then
  STATUS="BLOCKED_EMULATOR"
  REASON="adb executable is unavailable; SDK/tool setup failure must be inspected before assigning an Emulator runtime cause"
  HEALTH_RC=127
  printf '%s\n' "$REASON" > emulator-health.txt
  write_result
  exit 20
fi

# Capture the initial transport state, then wait only for a bounded interval.
adb devices -l > emulator-adb-before.txt 2>&1 || true
timeout 60 adb wait-for-device >> emulator-adb-before.txt 2>&1
wait_rc=$?
device_state="$(timeout 10 adb get-state 2>/dev/null | tr -d '\r')"
boot_completed=""
package_manager_ready=0
for attempt in $(seq 1 24); do
  boot_completed="$(timeout 10 adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  if [[ "$device_state" == "device" && "$boot_completed" == "1" ]]; then
    if timeout 10 adb shell cmd package list packages >/dev/null 2>&1; then
      package_manager_ready=1
      PACKAGE_MANAGER_RC=0
      break
    fi
  fi
  sleep 5
  device_state="$(timeout 10 adb get-state 2>/dev/null | tr -d '\r' || true)"
done
HEALTH_END_MS="$(date +%s%3N)"
HEALTH_PROBE_MS=$((HEALTH_END_MS - HEALTH_START_MS))
if [[ "$wait_rc" -ne 0 || "$device_state" != "device" || "$boot_completed" != "1" || "$package_manager_ready" -ne 1 ]]; then
  HEALTH_RC="$wait_rc"
  [[ "$HEALTH_RC" == "0" ]] && HEALTH_RC=1
  STATUS="BLOCKED_EMULATOR"
  REASON="Emulator/ADB readiness failed within bounded probe: wait_rc=$wait_rc device_state=$device_state sys_boot_completed=$boot_completed package_manager_ready=$package_manager_ready"
  collect_diagnostics
  printf 'ADB_STATE=%s\nSYS_BOOT_COMPLETED=%s\nPACKAGE_MANAGER_READY=%s\nREADINESS_PROBE_MS=%s\n' "$device_state" "$boot_completed" "$package_manager_ready" "$HEALTH_PROBE_MS" >> emulator-health.txt
  collect_logcat
  write_result
  exit 20
fi
HEALTH_RC=0
{
  echo "ADB_STATE=$device_state"
  echo "SYS_BOOT_COMPLETED=$boot_completed"
  echo "PACKAGE_MANAGER_READY=$package_manager_ready"
  echo "READINESS_PROBE_MS=$HEALTH_PROBE_MS"
  echo "READINESS_PROBE_STARTED_UTC=$(date -u -d "@$((HEALTH_START_MS / 1000))" +%Y-%m-%dT%H:%M:%SZ)"
  echo "READINESS_PROBE_FINISHED_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "ANDROID_API_EXPECTED=35"
  echo "ANDROID_ABI_EXPECTED=x86_64"
  timeout 10 adb shell getprop ro.build.version.release | sed 's/^/ANDROID_RELEASE=/'
  timeout 10 adb shell getprop ro.build.version.sdk | sed 's/^/ANDROID_API_ACTUAL=/'
  timeout 10 adb shell getprop ro.product.cpu.abi | sed 's/^/ANDROID_ABI_ACTUAL=/'
  timeout 10 adb shell getprop init.svc.bootanim | sed 's/^/BOOT_ANIMATION_STATE=/'
  echo "PACKAGE_MANAGER_PROBE=cmd package list packages"
} | tee emulator-health.txt
collect_diagnostics

adb install -r "$APK" > emulator-install.txt 2>&1
INSTALL_RC=$?
if [[ "$INSTALL_RC" -ne 0 ]]; then
  STATUS="INCONCLUSIVE_INSTALL"
  REASON="Emulator readiness passed, but install failed; inspect install output, package service, host resources, and logcat before attributing cause"
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
REASON="ADB, sys.boot_completed, package-manager readiness, exact fixture APK install, launch command, process check, and screenshot collection passed; smoke test does not prove full UI behavior, repeated cold-boot stability, or cross-framework coverage"
write_result
exit 0
