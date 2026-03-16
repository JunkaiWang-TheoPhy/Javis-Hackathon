#!/usr/bin/env bash
set -euo pipefail

gateway_url="${MIRA_MEMORY_GATEWAY_URL:-http://127.0.0.1:3301}"
idle_threshold_seconds="${MIRA_MEMORY_IDLE_THRESHOLD_SECONDS:-7200}"

curl \
  --fail \
  --silent \
  --show-error \
  -X POST \
  -H "Content-Type: application/json" \
  "${gateway_url%/}/v1/memory/auto-sleep" \
  -d "{\"idleThresholdSeconds\": ${idle_threshold_seconds}}"
