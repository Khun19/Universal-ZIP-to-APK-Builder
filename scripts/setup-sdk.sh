#!/usr/bin/env bash
set -e

ANDROID_HOME="$HOME/android-sdk"
mkdir -p "$ANDROID_HOME/cmdline-tools"

echo "=================================================="
echo "📥 Downloading Android Command-Line Tools..."
echo "=================================================="

TOOL_URL="https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"
curl -L -o cmdline-tools.zip "$TOOL_URL"

echo "📦 Extracting command-line tools..."
unzip -q cmdline-tools.zip -d "$ANDROID_HOME/cmdline-tools"

# Reorganize folder structure to match $ANDROID_HOME/cmdline-tools/latest/
if [ -d "$ANDROID_HOME/cmdline-tools/cmdline-tools" ]; then
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
fi

rm cmdline-tools.zip

# Export PATH temporarily for current script execution
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

echo "=================================================="
echo "📝 Accepting Android SDK Licenses..."
echo "=================================================="
yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses || true

echo "=================================================="
echo "⚙️ Installing Platform-Tools, Build-Tools, and API 33..."
echo "=================================================="
sdkmanager --sdk_root="$ANDROID_HOME" "platform-tools" "build-tools;33.0.2" "platforms;android-33"

echo "=================================================="
echo "✅ Android SDK Setup Successfully Completed!"
echo "=================================================="
