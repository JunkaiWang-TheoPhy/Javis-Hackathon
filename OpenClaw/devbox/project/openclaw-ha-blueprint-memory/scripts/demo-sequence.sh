#!/usr/bin/env bash
set -euo pipefail

AT_HOME=false ./scripts/post-heart-rate-event.sh
./scripts/post-home-arrival.sh
curl -sS http://127.0.0.1:8123/api/states/sensor.openclaw_latest_heart_rate \
  -H "Authorization: Bearer ${HA_TOKEN:-REPLACE_ME_HA_LONG_LIVED_TOKEN}" | jq .
