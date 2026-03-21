#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-printer-bridge-tunnel.json}"

rm -f "$STATE_FILE"
exec python3 "$SCRIPT_DIR/connector_loop.py"
