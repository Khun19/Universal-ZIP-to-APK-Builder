#!/bin/sh
set -eu

termux_prefix=${PREFIX:-/data/data/com.termux/files/usr}
hermesc="$(dirname "$0")/node_modules/react-native/sdks/hermesc/linux64-bin/hermesc"

exec "$termux_prefix/bin/qemu-x86_64" "$hermesc" "$@"
