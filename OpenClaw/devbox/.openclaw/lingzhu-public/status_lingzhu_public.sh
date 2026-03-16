#!/usr/bin/env bash
set -euo pipefail

BASE="${HOME}/.openclaw/lingzhu-public"
PROXY_PID_FILE="${BASE}/proxy.pid"
TUNNEL_PID_FILE="${BASE}/tunnel.pid"
URL_FILE="${BASE}/current_url.txt"
PROXY_PORT="${PROXY_PORT:-19190}"

echo "proxy_pid=$(cat "${PROXY_PID_FILE}" 2>/dev/null || echo missing)"
echo "tunnel_pid=$(cat "${TUNNEL_PID_FILE}" 2>/dev/null || echo missing)"
echo "url=$(cat "${URL_FILE}" 2>/dev/null || echo missing)"
echo
curl -fsS "http://127.0.0.1:${PROXY_PORT}/metis/agent/api/health" || true
echo
