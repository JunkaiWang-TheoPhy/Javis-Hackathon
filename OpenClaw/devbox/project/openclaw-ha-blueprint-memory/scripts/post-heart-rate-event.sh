#!/usr/bin/env bash
set -euo pipefail

OPENCLAW_URL="${OPENCLAW_URL:-http://127.0.0.1:18789}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-change-me-ha-control-secret}"
HEART_RATE_BPM="${HEART_RATE_BPM:-118}"
SUSTAINED_SEC="${SUSTAINED_SEC:-420}"
AT_HOME="${AT_HOME:-false}"
POST_WORKOUT="${POST_WORKOUT:-true}"
SOURCE="${SOURCE:-apple_watch}"

curl -sS -X POST "${OPENCLAW_URL}/ha-control/webhooks/wearable" \
  -H "Content-Type: application/json" \
  -H "x-ha-control-secret: ${WEBHOOK_SECRET}" \
  -d "{\"userId\":\"demo\",\"source\":\"${SOURCE}\",\"heartRateBpm\":${HEART_RATE_BPM},\"sustainedSec\":${SUSTAINED_SEC},\"atHome\":${AT_HOME},\"postWorkout\":${POST_WORKOUT}}" | jq .
