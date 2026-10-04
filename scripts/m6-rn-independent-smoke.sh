#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="${HOME}/Universal-ZIP-to-APK-Builder"
WORK="${ROOT}/.workspace/rn-independent-smoke-0769"
APP_NAME="RNIndependent0769"
PACKAGE="com.rnindependent0769"
APK="${WORK}/android/app/build/outputs/apk/debug/app-debug.apk"
LOG="${ROOT}/.workspace/rn-independent-smoke-0769-result.txt"

export JAVA_HOME="${PREFIX}/lib/jvm/java-17-openjdk"
export PATH="${JAVA_HOME}/bin:${PATH}"

exec > >(tee "${LOG}") 2>&1

echo "=== RN INDEPENDENT SMOKE TEST ==="
date
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "Java: $(java -version 2>&1 | head -1)"
echo "JAVA_HOME: ${JAVA_HOME}"
echo "React Native target: 0.76.9"
echo

if [ ! -x "${JAVA_HOME}/bin/java" ]; then
  echo "FAIL: JDK 17 not found at ${JAVA_HOME}"
  exit 1
fi

if [ "${REBUILD:-1}" = "1" ]; then
  rm -rf "${WORK}"
  mkdir -p "${ROOT}/.workspace"
  CREATE_DIR="$(mktemp -d "${TMPDIR:-/data/data/com.termux/files/usr/tmp}/rn-independent-0769.XXXXXX")"

  echo "=== CREATE FRESH RN PROJECT ==="
  echo "CLI workspace: ${CREATE_DIR}"
  cd "${CREATE_DIR}"
  npm_config_userconfig=/dev/null npx --yes @react-native-community/cli@15.0.1 init "${APP_NAME}" --version 0.76.9 --skip-install
  mv "${CREATE_DIR}/${APP_NAME}" "${WORK}"
  rm -rf "${CREATE_DIR}"

  # Termux/mobile networks can exceed Gradle Wrapper's default 10s read timeout.
  # Keep the official RN/Gradle distribution unchanged; only extend wrapper network timeout.
  sed -i 's/^networkTimeout=.*/networkTimeout=120000/' \
    "${WORK}/android/gradle/wrapper/gradle-wrapper.properties"

  cd "${WORK}"
  echo "=== VERIFY RN VERSION ==="
  node -p "require('./node_modules/react-native/package.json').version" 2>/dev/null || true

  echo "=== INSTALL NPM DEPENDENCIES ==="
  npm_config_userconfig=/dev/null npm install --no-audit --no-fund
else
  cd "${WORK}"
fi

echo
echo "=== PROJECT CHECK ==="
node -p "require('./node_modules/react-native/package.json').version"
grep -n "newArchEnabled" android/gradle.properties || true

echo
echo "=== CLEAN BUILD ==="
cd "${WORK}/android"
./gradlew clean --no-daemon

echo
echo "=== DEBUG APK BUILD ==="
./gradlew :app:assembleDebug --no-daemon

if [ ! -f "${APK}" ]; then
  echo "FAIL: APK not found: ${APK}"
  exit 1
fi

echo
echo "=== APK ==="
ls -lh "${APK}"
sha256sum "${APK}"

if [ "${RUN_DEVICE_TEST:-1}" != "1" ]; then
  echo "BUILD PASS; device test skipped"
  exit 0
fi

if ! command -v rish >/dev/null 2>&1; then
  echo "FAIL: rish not found"
  exit 1
fi

RISH_ENV=(env RISH_APPLICATION_ID=com.termux RISH_PRESERVE_ENV=0 rish -c)

echo
echo "=== STAGE APK ==="
cp "${APK}" /sdcard/Download/rn-independent-0769.apk
"${RISH_ENV[@]}" 'cp /sdcard/Download/rn-independent-0769.apk /data/local/tmp/rn-independent-0769.apk'

echo
echo "=== INSTALL APK ==="
INSTALL_OUT=$("${RISH_ENV[@]}" 'pm install -r /data/local/tmp/rn-independent-0769.apk' 2>&1)
printf '%s\n' "${INSTALL_OUT}"
echo "${INSTALL_OUT}" | grep -q "Success" || {
  echo "FAIL: APK install"
  exit 1
}

echo
echo "=== RESOLVE ACTIVITY ==="
"${RISH_ENV[@]}" "cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER ${PACKAGE}"

echo
echo "=== LAUNCH ==="
"${RISH_ENV[@]}" "am force-stop ${PACKAGE}"
"${RISH_ENV[@]}" "am start -W -n ${PACKAGE}/.MainActivity"
sleep 4

echo
echo "=== PROCESS ==="
PID=$("${RISH_ENV[@]}" "pidof ${PACKAGE}" 2>/dev/null || true)
printf 'PID=%s\n' "${PID}"

echo
echo "=== FOREGROUND ==="
"${RISH_ENV[@]}" "dumpsys activity activities | grep -E 'mResumedActivity|mFocusedApp' | head -4"

echo
echo "=== CRASH CHECK ==="
CRASH=$("${RISH_ENV[@]}" "dumpsys activity processes | grep -A 4 -B 2 '${PACKAGE}' | grep -E 'crashed|Process ${PACKAGE}' | head -10" 2>/dev/null || true)
printf '%s\n' "${CRASH}"

echo
echo "=== RECENT RN CRASH LOG ==="
"${RISH_ENV[@]}" "logcat -b crash -d -v brief | grep -A 35 -B 3 '${PACKAGE}' | tail -80" || true

if [ -n "${PID}" ]; then
  echo
  echo "DEVICE LAUNCH: PASS"
else
  echo
  echo "DEVICE LAUNCH: FAIL (process not alive)"
  exit 2
fi
