#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVICE_DIR="${RELEASE_ROOT}/services/notification-router"

if [[ -f "${SCRIPT_DIR}/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env.local"
  set +a
fi

export PORT="${PORT:-3302}"
export MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH="${MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH:-${RELEASE_ROOT}/services/notification-router/config/outbound-policy.example.yaml}"

cd "${SERVICE_DIR}"

if [[ ! -d node_modules ]]; then
  echo "notification-router dependencies are missing. Run 'npm install' in ${SERVICE_DIR} first." >&2
  exit 1
fi

exec ./node_modules/.bin/tsx src/server.ts
