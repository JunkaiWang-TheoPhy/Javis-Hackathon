#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-3302}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT}}"

curl --fail --silent --show-error \
  -X POST \
  -H "Content-Type: application/json" \
  "${BASE_URL}/v1/dispatch" \
  -d '{
    "intent": {
      "intent_id": "release-local-checkin-001",
      "created_at": "2026-03-19T20:00:00.000Z",
      "source": "manual",
      "message_kind": "checkin",
      "recipient_scope": "self",
      "risk_tier": "low",
      "privacy_level": "private",
      "content": "Local release deploy-pack self check-in.",
      "preferred_channels": ["openclaw_channel_dm"],
      "recipient": {
        "id": "user-self"
      },
      "tags": ["project"]
    }
  }'
echo
