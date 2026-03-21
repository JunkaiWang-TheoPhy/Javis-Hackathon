#!/bin/zsh
set -euo pipefail

STATE_FILE="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-printer-bridge-tunnel.json}"

pkill -f "connector_loop.py" || true
pkill -f "bridge_connector.py" || true
pkill -f "cloudflared tunnel .*--url http://127.0.0.1:9771" || true
rm -f "$STATE_FILE"
