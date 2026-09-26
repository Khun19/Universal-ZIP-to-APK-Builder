#!/usr/bin/env bash
set -Eeuo pipefail

# Compatibility entry point for Android SDK preparation.
# The canonical setup is setup-termux.sh; this keeps SDK setup under the Layer 2 boundary.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/setup-termux.sh" "$@"
