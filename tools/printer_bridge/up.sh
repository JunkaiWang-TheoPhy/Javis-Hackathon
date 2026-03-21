#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${OPENCLAW_PRINTER_BRIDGE_ENV:-$HOME/.openclaw-printer-bridge.env}"

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
fi

exec python3 "$SCRIPT_DIR/bootstrap_stack.py" "$@"
