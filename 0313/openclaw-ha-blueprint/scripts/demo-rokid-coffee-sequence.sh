#!/usr/bin/env bash
set -euo pipefail

ROKID_BRIDGE_URL="${ROKID_BRIDGE_URL:-http://127.0.0.1:3301}"
OBSERVATION_FILE="${OBSERVATION_FILE:-./scripts/rokid-observation.sample.json}"
SESSION_ID="${SESSION_ID:-sess-rokid-001}"
OBSERVATION_ID="${OBSERVATION_ID:-obs-0001}"
PANEL_ID="${PANEL_ID:-panel-1}"
BUTTON_ID="${BUTTON_ID:-start_scene}"

echo "==> POST /v1/observe"
jq -n --slurpfile observation "${OBSERVATION_FILE}" '{observation: $observation[0]}' \
  | curl -sS -X POST "${ROKID_BRIDGE_URL}/v1/observe" \
    -H "Content-Type: application/json" \
    --data-binary @- | jq .

echo
echo "==> POST /v1/confirm"
jq -n \
  --arg sessionId "${SESSION_ID}" \
  --arg observationId "${OBSERVATION_ID}" \
  --arg panelId "${PANEL_ID}" \
  --arg buttonId "${BUTTON_ID}" \
  '{
    sessionId: $sessionId,
    observationId: $observationId,
    panelId: $panelId,
    buttonId: $buttonId
  }' \
  | curl -sS -X POST "${ROKID_BRIDGE_URL}/v1/confirm" \
    -H "Content-Type: application/json" \
    --data-binary @- | jq .
