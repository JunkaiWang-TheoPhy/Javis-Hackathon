#!/usr/bin/env bash
set -euo pipefail

BASE="${HOME}/.openclaw/lingzhu-public"
BIN_DIR="${BASE}/bin"
LOG_DIR="${BASE}/logs"
PROXY_JS="${BASE}/lingzhu_path_proxy.js"
PROXY_PID_FILE="${BASE}/proxy.pid"
TUNNEL_PID_FILE="${BASE}/tunnel.pid"
URL_FILE="${BASE}/current_url.txt"
PROXY_LOG="${LOG_DIR}/proxy.log"
TUNNEL_LOG="${LOG_DIR}/tunnel.log"
CLOUDFLARED_BIN="${BIN_DIR}/cloudflared"
PROXY_PORT="${PROXY_PORT:-19190}"
ORIGIN_PORT="${ORIGIN_PORT:-18789}"

mkdir -p "${BIN_DIR}" "${LOG_DIR}"

if ! curl -fsS "http://127.0.0.1:${ORIGIN_PORT}/metis/agent/api/health" >/dev/null; then
  echo "OpenClaw Lingzhu health endpoint is not reachable on 127.0.0.1:${ORIGIN_PORT}" >&2
  exit 1
fi

if [ ! -x "${CLOUDFLARED_BIN}" ]; then
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" \
    -o "${CLOUDFLARED_BIN}"
  chmod 755 "${CLOUDFLARED_BIN}"
fi

if [ -f "${PROXY_PID_FILE}" ] && kill -0 "$(cat "${PROXY_PID_FILE}")" 2>/dev/null; then
  kill "$(cat "${PROXY_PID_FILE}")" 2>/dev/null || true
  sleep 1
fi

if [ -f "${TUNNEL_PID_FILE}" ] && kill -0 "$(cat "${TUNNEL_PID_FILE}")" 2>/dev/null; then
  kill "$(cat "${TUNNEL_PID_FILE}")" 2>/dev/null || true
  sleep 1
fi

rm -f "${PROXY_PID_FILE}" "${TUNNEL_PID_FILE}" "${URL_FILE}"

nohup env \
  LISTEN_HOST=127.0.0.1 \
  LISTEN_PORT="${PROXY_PORT}" \
  ORIGIN_HOST=127.0.0.1 \
  ORIGIN_PORT="${ORIGIN_PORT}" \
  node "${PROXY_JS}" >>"${PROXY_LOG}" 2>&1 &
echo $! >"${PROXY_PID_FILE}"

for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PROXY_PORT}/metis/agent/api/health" >/dev/null; then
    break
  fi
  sleep 0.5
done

curl -fsS "http://127.0.0.1:${PROXY_PORT}/metis/agent/api/health" >/dev/null

nohup "${CLOUDFLARED_BIN}" tunnel --url "http://127.0.0.1:${PROXY_PORT}" --no-autoupdate >>"${TUNNEL_LOG}" 2>&1 &
echo $! >"${TUNNEL_PID_FILE}"

for _ in $(seq 1 40); do
  if grep -q "https://.*trycloudflare.com" "${TUNNEL_LOG}" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

URL="$(grep -o 'https://[^ ]*trycloudflare.com' "${TUNNEL_LOG}" | tail -n 1 || true)"
if [ -z "${URL}" ]; then
  echo "Cloudflare quick tunnel URL was not produced" >&2
  exit 1
fi

printf '%s\n' "${URL}" >"${URL_FILE}"
printf '%s\n' "${URL}"
