#!/usr/bin/env bash
set -euo pipefail

HA_URL="${HA_URL:-http://127.0.0.1:8123}"
HA_TOKEN="${HA_TOKEN:-REPLACE_ME_HA_LONG_LIVED_TOKEN}"
PRESENCE_ENTITY_ID="${PRESENCE_ENTITY_ID:-device_tracker.demo_user}"

curl -sS -X POST "${HA_URL}/api/states/${PRESENCE_ENTITY_ID}" \
  -H "Authorization: Bearer ${HA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"state":"home","attributes":{"friendly_name":"Demo User","source":"demo-script"}}' | jq .
