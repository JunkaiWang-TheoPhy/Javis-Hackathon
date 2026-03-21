#!/bin/zsh
set -euo pipefail

LOCAL_PORT="${OPENCLAW_MI_BAND_BRIDGE_PORT:-9782}"
LOCAL_HOST="${OPENCLAW_MI_BAND_BRIDGE_LOCAL_HOST:-127.0.0.1}"
STATE_FILE="${OPENCLAW_MI_BAND_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-mi-band-bridge-tunnel.json}"
TUNNEL_PROVIDER="${OPENCLAW_MI_BAND_BRIDGE_TUNNEL_PROVIDER:-}"
CLOUDFLARED_BIN="${OPENCLAW_MI_BAND_BRIDGE_CLOUDFLARED_BIN:-cloudflared}"
TUNNEL_PROTOCOL="${OPENCLAW_MI_BAND_BRIDGE_TUNNEL_PROTOCOL:-http2}"
MANUAL_BRIDGE_URL="${OPENCLAW_MI_BAND_BRIDGE_URL:-}"
SSH_BIN="${OPENCLAW_MI_BAND_BRIDGE_SSH_BIN:-ssh}"
REMOTE_TARGET="${OPENCLAW_MI_BAND_BRIDGE_REMOTE:-}"
REMOTE_BIND_HOST="${OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_HOST:-127.0.0.1}"
REMOTE_BIND_PORT="${OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT:-19782}"
SSH_OPTS="${OPENCLAW_MI_BAND_BRIDGE_SSH_OPTS:-}"

write_state() {
  python3 - "$STATE_FILE" "$1" "$2" "$LOCAL_PORT" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

state_path = Path(sys.argv[1]).expanduser()
payload = {
    "provider": sys.argv[2],
    "public_url": sys.argv[3],
    "bridge_url": sys.argv[3],
    "local_port": int(sys.argv[4]),
    "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
}
state_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

extract_cloudflared_url() {
  python3 - "$1" <<'PY'
import re
import sys

line = sys.argv[1]
match = re.search(r"https://(?!api\.)[A-Za-z0-9.-]+trycloudflare\.com", line)
if match:
    print(match.group(0))
PY
}

if [[ -n "$MANUAL_BRIDGE_URL" ]]; then
  write_state "manual" "$MANUAL_BRIDGE_URL"
  echo "using preconfigured bridge URL: $MANUAL_BRIDGE_URL"
  exit 0
fi

if [[ -z "$TUNNEL_PROVIDER" ]]; then
  if command -v "$CLOUDFLARED_BIN" >/dev/null 2>&1; then
    TUNNEL_PROVIDER="cloudflared"
  else
    echo "cloudflared is required to launch the Mi Band bridge tunnel" >&2
    exit 1
  fi
elif [[ "$TUNNEL_PROVIDER" == "ssh-reverse" ]]; then
  if [[ -z "$REMOTE_TARGET" ]]; then
    echo "OPENCLAW_MI_BAND_BRIDGE_REMOTE is required for ssh-reverse tunnels" >&2
    exit 1
  fi
  if ! command -v "$SSH_BIN" >/dev/null 2>&1; then
    echo "ssh is required to launch the Mi Band bridge reverse tunnel" >&2
    exit 1
  fi
  rm -f "$STATE_FILE"
  bridge_url="http://${REMOTE_BIND_HOST}:${REMOTE_BIND_PORT}"
  write_state "ssh-reverse" "$bridge_url"
  ssh_extra_opts=()
  if [[ -n "$SSH_OPTS" ]]; then
    ssh_extra_opts=(${=SSH_OPTS})
  fi
  exec "$SSH_BIN" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    "${ssh_extra_opts[@]}" \
    -N -T \
    -R "${REMOTE_BIND_HOST}:${REMOTE_BIND_PORT}:${LOCAL_HOST}:${LOCAL_PORT}" \
    "$REMOTE_TARGET"
fi

if [[ "$TUNNEL_PROVIDER" != "cloudflared" ]]; then
  echo "unsupported tunnel provider: $TUNNEL_PROVIDER" >&2
  exit 1
fi

rm -f "$STATE_FILE"

"$CLOUDFLARED_BIN" tunnel --protocol "$TUNNEL_PROTOCOL" --url "http://${LOCAL_HOST}:${LOCAL_PORT}" 2>&1 | while IFS= read -r line; do
  print -- "$line"
  url="$(extract_cloudflared_url "$line")"
  if [[ -n "$url" ]]; then
    write_state "cloudflared" "$url"
  fi
done
