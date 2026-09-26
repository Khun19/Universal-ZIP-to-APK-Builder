#!/usr/bin/env bash
set -Eeuo pipefail

PASS=0
FAIL=0
SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"

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

resolve_sdk_tool() {
  local tool="$1"
  local explicit=""
  case "$tool" in
    aapt2) explicit="${AAPT2_PATH:-}" ;;
    zipalign) explicit="${ZIPALIGN_PATH:-}" ;;
    apksigner) explicit="${APKSIGNER_PATH:-}" ;;
  esac

  if [[ -n "$explicit" && -x "$explicit" ]]; then
    printf '%s' "$explicit"
    return 0
  fi

  if command -v "$tool" >/dev/null 2>&1; then
    command -v "$tool"
    return 0
  fi

  local dir candidate
  if [[ -d "$SDK_ROOT/build-tools" ]]; then
    while IFS= read -r dir; do
      candidate="$dir/$tool"
      if [[ -x "$candidate" ]]; then
        printf '%s' "$candidate"
        return 0
      fi
    done < <(find "$SDK_ROOT/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -Vr)
  fi
  return 1
}

check_sdk_tool() {
  local label="$1" tool="$2" resolved
  if resolved="$(resolve_sdk_tool "$tool")"; then
    printf '✓ %-18s %s\n' "$label" "$resolved"
    PASS=$((PASS+1))
    printf '  %s executable: yes\n' "$label"
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
check_sdk_tool "aapt2" aapt2
check_sdk_tool "zipalign" zipalign
check_sdk_tool "apksigner" apksigner

if resolved="$(resolve_sdk_tool aapt2)"; then
  printf '  AAPT2 version: '
  "$resolved" version 2>&1 | head -n 1 || true
  if command -v file >/dev/null 2>&1; then
    printf '  AAPT2 binary:  '
    file "$resolved"
  fi
fi

if resolved="$(resolve_sdk_tool apksigner)"; then
  printf '  apksigner version: '
  "$resolved" version 2>&1 | head -n 1 || true
fi

printf '\nEnvironment paths\n'
printf '  ANDROID_HOME=%s\n' "${ANDROID_HOME:-<unset>}"
printf '  ANDROID_SDK_ROOT=%s\n' "${ANDROID_SDK_ROOT:-<unset>}"
printf '  JAVA_HOME=%s\n' "${JAVA_HOME:-<unset>}"
printf '  PREFIX=%s\n' "${PREFIX:-<unset>}"
printf '  CPU=%s\n' "$(uname -m 2>/dev/null || echo unknown)"
printf '  SDK Build Tools=%s\n' "${SDK_ROOT}/build-tools"

printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
(( FAIL == 0 )) || exit 1
