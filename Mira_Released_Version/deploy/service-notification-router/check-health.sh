#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-3302}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT}}"

curl --fail --silent --show-error "${BASE_URL}/v1/health"
echo
