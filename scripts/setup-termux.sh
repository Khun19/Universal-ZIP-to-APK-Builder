#!/usr/bin/env bash
set -Eeuo pipefail

# Idempotent Termux bootstrap for local Android builds.
# This script only installs missing tools and deliberately leaves the project's
# ARM64 package overrides and lockfile policy unchanged.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ANDROID_SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
ANDROID_API_LEVEL="${ANDROID_API_LEVEL:-33}"
ANDROID_BUILD_TOOLS_VERSION="${ANDROID_BUILD_TOOLS_VERSION:-33.0.2}"
ANDROID_CMDLINE_TOOLS_VERSION="${ANDROID_CMDLINE_TOOLS_VERSION:-13114758}"
ENV_MARKER_BEGIN="# >>> universal-zip-to-apk-builder >>>"
ENV_MARKER_END="# <<< universal-zip-to-apk-builder <<<"

log() { printf '\n[%s] %s\n' "termux-setup" "$*"; }
warn() { printf '\n[termux-setup] WARNING: %s\n' "$*" >&2; }
fail() { printf '\n[termux-setup] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ "$(uname -o 2>/dev/null || true)" != "Android" && -z "${PREFIX:-}" && "$(command -v pkg 2>/dev/null || true)" == "" ]]; then
  fail "This script is intended for Termux. Run it inside Termux, not a regular Linux shell."
fi

command -v bash >/dev/null || fail "bash is required"

ensure_termux_packages() {
  command -v pkg >/dev/null || return 0
  local packages=()
  command -v git >/dev/null || packages+=(git)
  command -v curl >/dev/null || packages+=(curl)
  command -v unzip >/dev/null || packages+=(unzip)
  command -v tar >/dev/null || packages+=(tar)
  command -v make >/dev/null || packages+=(make)
  command -v clang >/dev/null || packages+=(clang)
  command -v python >/dev/null || packages+=(python)
  command -v aapt2 >/dev/null || packages+=(aapt2)
  ((${#packages[@]} == 0)) || { log "Installing missing Termux packages: ${packages[*]}"; pkg update -y; pkg install -y "${packages[@]}"; }
}

ensure_command() {
  local command_name="$1"
  shift
  command -v "$command_name" >/dev/null && return 0
  command -v pkg >/dev/null || fail "Missing $command_name and Termux pkg is unavailable"
  log "Installing missing $command_name"
  pkg install -y "$@"
  command -v "$command_name" >/dev/null || fail "$command_name is still unavailable after installation"
}

install_runtime() {
  if ! command -v node >/dev/null; then
    ensure_command node nodejs-lts || ensure_command node nodejs
  fi
  command -v npm >/dev/null || fail "npm is required with Node.js"

  if ! command -v pnpm >/dev/null; then
    if command -v corepack >/dev/null; then
      log "Enabling pnpm through the existing Corepack installation"
      corepack enable
      corepack prepare pnpm@latest --activate
    else
      log "Installing missing pnpm through npm"
      npm install --global pnpm
    fi
  fi
  command -v pnpm >/dev/null || fail "pnpm is unavailable"
}

install_java_gradle() {
  if ! command -v java >/dev/null; then
    ensure_command java openjdk-17 || ensure_command java openjdk-21
  fi
  command -v javac >/dev/null || warn "javac is unavailable; Android/Gradle builds may fail"

  if ! command -v gradle >/dev/null; then
    ensure_command gradle gradle
  fi
}

find_sdkmanager() {
  local candidate
  for candidate in \
    "$ANDROID_SDK_DIR/cmdline-tools/latest/bin/sdkmanager" \
    "$ANDROID_SDK_DIR/cmdline-tools/cmdline-tools/bin/sdkmanager"; do
    if [[ -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

install_android_sdk() {
  mkdir -p "$ANDROID_SDK_DIR/cmdline-tools"
  local sdkmanager=""
  sdkmanager="$(find_sdkmanager || true)"

  if [[ -z "$sdkmanager" ]]; then
    command -v curl >/dev/null || fail "curl is required to install Android command-line tools"
    command -v unzip >/dev/null || fail "unzip is required to install Android command-line tools"
    local archive temp_dir
    archive="$(mktemp "${TMPDIR:-/tmp}/android-cmdline-tools.XXXXXX.zip")"
    temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/android-cmdline-tools.XXXXXX")"
    trap 'rm -f "${archive:-}"; rm -rf "${temp_dir:-}"' RETURN

    log "Downloading Android command-line tools"
    curl --fail --location --retry 3 --output "$archive" \
      "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS_VERSION}_latest.zip"
    unzip -q "$archive" -d "$temp_dir"
    [[ -x "$temp_dir/cmdline-tools/bin/sdkmanager" ]] || fail "Downloaded command-line tools have an unexpected layout"
    rm -rf "$ANDROID_SDK_DIR/cmdline-tools/latest"
    mv "$temp_dir/cmdline-tools" "$ANDROID_SDK_DIR/cmdline-tools/latest"
    sdkmanager="$ANDROID_SDK_DIR/cmdline-tools/latest/bin/sdkmanager"
    rm -f "$archive"
    rm -rf "$temp_dir"
    trap - RETURN
  fi

  export ANDROID_HOME="$ANDROID_SDK_DIR"
  export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
  export PATH="$ANDROID_SDK_DIR/cmdline-tools/latest/bin:$ANDROID_SDK_DIR/platform-tools:$PATH"

  log "Accepting Android SDK licenses"
  yes | "$sdkmanager" --sdk_root="$ANDROID_SDK_DIR" --licenses >/dev/null || true
  log "Installing Android platform tools, API ${ANDROID_API_LEVEL}, and build tools ${ANDROID_BUILD_TOOLS_VERSION}"
  "$sdkmanager" --sdk_root="$ANDROID_SDK_DIR" \
    "platform-tools" \
    "platforms;android-${ANDROID_API_LEVEL}" \
    "build-tools;${ANDROID_BUILD_TOOLS_VERSION}"
}

java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
    printf '%s' "$JAVA_HOME"
    return 0
  fi
  local java_bin
  java_bin="$(readlink -f "$(command -v java)")"
  dirname "$(dirname "$java_bin")"
}

persist_environment() {
  local java_home_path
  java_home_path="$(java_home)"
  local block
  block=$(cat <<EOF
$ENV_MARKER_BEGIN
export ANDROID_HOME="$ANDROID_SDK_DIR"
export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
export JAVA_HOME="$java_home_path"
export GRADLE_USER_HOME="\${GRADLE_USER_HOME:-$HOME/.gradle}"
export PATH="\${ANDROID_HOME}/cmdline-tools/latest/bin:\${ANDROID_HOME}/platform-tools:\${ANDROID_HOME}/emulator:\${PATH}"
$ENV_MARKER_END
EOF
)
  local shell_file
  for shell_file in "$HOME/.profile" "$HOME/.bashrc"; do
    touch "$shell_file"
    awk -v begin="$ENV_MARKER_BEGIN" -v end="$ENV_MARKER_END" '
      $0 == begin { inside=1; next }
      $0 == end { inside=0; next }
      !inside { print }
    ' "$shell_file" > "$shell_file.tmp"
    printf '%s\n' "$block" >> "$shell_file.tmp"
    mv "$shell_file.tmp" "$shell_file"
  done

  export JAVA_HOME="$java_home_path"
  export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
  export PATH="$ANDROID_SDK_DIR/cmdline-tools/latest/bin:$ANDROID_SDK_DIR/platform-tools:$ANDROID_SDK_DIR/emulator:$PATH"
}

install_dependencies() {
  cd "$REPO_ROOT"
  [[ -f package.json ]] || fail "package.json was not found at $REPO_ROOT"
  if [[ -f pnpm-lock.yaml ]]; then
    log "Installing project dependencies from the frozen pnpm lockfile"
    pnpm install --frozen-lockfile
  else
    warn "pnpm-lock.yaml is missing; using a non-frozen install"
    pnpm install
  fi
}

verify_toolchain() {
  cd "$REPO_ROOT"
  log "Verifying Termux Android toolchain"
  printf 'Node: '; node --version
  printf 'pnpm: '; pnpm --version
  printf 'Java: '; java -version 2>&1 | head -n 1
  printf 'Gradle: '; gradle --version | awk '/^Gradle / { print; exit }'
  printf 'SDK: '; sdkmanager --version
  printf 'ANDROID_HOME: %s\n' "$ANDROID_HOME"
  printf 'JAVA_HOME: %s\n' "$JAVA_HOME"
}

main() {
  log "Preparing Universal ZIP-to-APK Builder for Termux"
  ensure_termux_packages
  install_runtime
  install_java_gradle
  install_android_sdk
  persist_environment
  install_dependencies
  verify_toolchain
  log "Setup complete. Run: pnpm test"
  log "Then build with: pnpm run start:cli"
  log "ARM64 native package overrides were not changed or force-installed."
}

main "$@"