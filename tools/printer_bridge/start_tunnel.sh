#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${OPENCLAW_PRINTER_BRIDGE_ENV:-$HOME/.openclaw-printer-bridge.env}"
STATE_FILE="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-printer-bridge-tunnel.json}"

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
fi

rm -f "$STATE_FILE"
exec python3 "$SCRIPT_DIR/connector_loop.py"
