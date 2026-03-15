#!/bin/zsh
set -euo pipefail

LOCAL_PORT="${OPENCLAW_PRINTER_BRIDGE_PORT:-9771}"
LOCAL_HOST="${OPENCLAW_PRINTER_BRIDGE_LOCAL_HOST:-127.0.0.1}"
STATE_FILE="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_STATE:-$HOME/.openclaw-printer-bridge-tunnel.json}"
TUNNEL_HOST="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_HOST:-https://localtunnel.me}"
SUBDOMAIN="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_SUBDOMAIN:-}"
TUNNEL_PROVIDER="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_PROVIDER:-}"
CLOUDFLARED_BIN="${OPENCLAW_PRINTER_BRIDGE_CLOUDFLARED_BIN:-cloudflared}"
TUNNEL_PROTOCOL="${OPENCLAW_PRINTER_BRIDGE_TUNNEL_PROTOCOL:-http2}"
MANUAL_BRIDGE_URL="${OPENCLAW_PRINTER_BRIDGE_URL:-}"

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
    "local_port": int(sys.argv[4]),
    "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
}
state_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
}

extract_url_from_line() {
  python3 - "$1" "$2" <<'PY'
import re
import sys

provider = sys.argv[1]
line = sys.argv[2]

if provider == "localtunnel":
    marker = "your url is: "
    if marker in line:
        print(line.split(marker, 1)[1].strip())
    raise SystemExit(0)

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
  elif command -v npx >/dev/null 2>&1; then
    TUNNEL_PROVIDER="localtunnel"
  else
    echo "cloudflared or npx is required to launch an HTTPS tunnel" >&2
    exit 1
  fi
fi

rm -f "$STATE_FILE"

case "$TUNNEL_PROVIDER" in
  cloudflared)
    cmd=("$CLOUDFLARED_BIN" tunnel --protocol "$TUNNEL_PROTOCOL" --url "http://${LOCAL_HOST}:${LOCAL_PORT}")
    ;;
  localtunnel)
    cmd=(npx --yes localtunnel --port "$LOCAL_PORT" --local-host "$LOCAL_HOST" --host "$TUNNEL_HOST")
    if [[ -n "$SUBDOMAIN" ]]; then
      cmd+=(--subdomain "$SUBDOMAIN")
    fi
    ;;
  *)
    echo "unsupported tunnel provider: $TUNNEL_PROVIDER" >&2
    exit 1
    ;;
esac

"${cmd[@]}" 2>&1 | while IFS= read -r line; do
  print -- "$line"
  url="$(extract_url_from_line "$TUNNEL_PROVIDER" "$line")"
  if [[ -n "$url" ]]; then
    write_state "$TUNNEL_PROVIDER" "$url"
  fi
done
