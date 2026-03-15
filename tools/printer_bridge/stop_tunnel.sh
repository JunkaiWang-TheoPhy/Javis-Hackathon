#!/bin/zsh
set -euo pipefail

LOCAL_PORT="${OPENCLAW_PRINTER_BRIDGE_PORT:-9771}"
LOCAL_HOST="${OPENCLAW_PRINTER_BRIDGE_LOCAL_HOST:-127.0.0.1}"
STATE_FILE="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-printer-bridge-tunnel.json}"

rm -f "$STATE_FILE"
pkill -f "cloudflared tunnel --url http://${LOCAL_HOST}:${LOCAL_PORT}" >/dev/null 2>&1 || true
pkill -f "localtunnel --port ${LOCAL_PORT}" >/dev/null 2>&1 || true
