#!/usr/bin/env bash
set -Eeuo pipefail

PASS=0
FAIL=0

check_cmd() {
  local label="$1" cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    printf '✓ %-18s %s\n' "$label" "$(command -v "$cmd")"
    PASS=$((PASS+1))
  else
    printf '✗ %-18s MISSING\n' "$label"
    FAIL=$((FAIL+1))
  fi
}

check_cmd "bash" bash
check_cmd "git" git
check_cmd "curl" curl
check_cmd "unzip" unzip
check_cmd "Node" node
check_cmd "pnpm" pnpm
check_cmd "Java" java
check_cmd "javac" javac
check_cmd "Gradle" gradle
check_cmd "sdkmanager" sdkmanager
check_cmd "aapt2" aapt2
check_cmd "zipalign" zipalign
check_cmd "apksigner" apksigner

if command -v aapt2 >/dev/null 2>&1; then
  printf '  AAPT2 version: '
  aapt2 version 2>&1 | head -n 1 || true
  if command -v file >/dev/null 2>&1; then
    printf '  AAPT2 binary:  '
    file "$(command -v aapt2)"
  fi
fi

printf '\nEnvironment paths\n'
printf '  ANDROID_HOME=%s\n' "${ANDROID_HOME:-<unset>}"
printf '  ANDROID_SDK_ROOT=%s\n' "${ANDROID_SDK_ROOT:-<unset>}"
printf '  JAVA_HOME=%s\n' "${JAVA_HOME:-<unset>}"
printf '  PREFIX=%s\n' "${PREFIX:-<unset>}"
printf '  CPU=%s\n' "$(uname -m 2>/dev/null || echo unknown)"

printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
(( FAIL == 0 )) || exit 1
