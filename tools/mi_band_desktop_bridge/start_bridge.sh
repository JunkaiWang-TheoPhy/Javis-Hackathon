#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${OPENCLAW_MI_BAND_BRIDGE_PORT:-9782}"
ENV_FILE="${OPENCLAW_MI_BAND_BRIDGE_ENV_FILE:-$HOME/.openclaw-mi-band-bridge.env}"

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
fi

exec python3 "$SCRIPT_DIR/bridge_server.py" --port "$PORT"
