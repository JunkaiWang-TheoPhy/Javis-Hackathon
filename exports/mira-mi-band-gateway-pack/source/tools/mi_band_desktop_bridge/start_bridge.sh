#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${OPENCLAW_MI_BAND_BRIDGE_PORT:-9782}"

exec python3 "$SCRIPT_DIR/bridge_server.py" --port "$PORT"
