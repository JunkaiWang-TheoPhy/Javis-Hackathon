#!/usr/bin/env bash
set -euo pipefail

BASE="${HOME}/.openclaw/lingzhu-public"
PROXY_PID_FILE="${BASE}/proxy.pid"
TUNNEL_PID_FILE="${BASE}/tunnel.pid"

for pid_file in "${TUNNEL_PID_FILE}" "${PROXY_PID_FILE}"; do
  if [ -f "${pid_file}" ]; then
    pid="$(cat "${pid_file}")"
    if kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" 2>/dev/null || true
    fi
    rm -f "${pid_file}"
  fi
done

echo "stopped"
