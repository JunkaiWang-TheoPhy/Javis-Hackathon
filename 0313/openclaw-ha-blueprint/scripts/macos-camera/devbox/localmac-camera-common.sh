#!/usr/bin/env bash
set -euo pipefail

openclaw_bin="${OPENCLAW_BIN:-$(command -v openclaw || true)}"
if [[ -z "$openclaw_bin" ]]; then
  echo "openclaw CLI not found in PATH; set OPENCLAW_BIN." >&2
  exit 1
fi

if [[ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
  openclaw_config_path="${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
  if [[ -f "$openclaw_config_path" ]]; then
    gateway_token="$(
      node - "$openclaw_config_path" <<'NODE'
const fs = require("node:fs");

const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const token = config.gateway?.remote?.token ?? config.gateway?.auth?.token ?? "";
if (token) {
  process.stdout.write(String(token));
}
NODE
    )"
    if [[ -n "$gateway_token" ]]; then
      export OPENCLAW_GATEWAY_TOKEN="$gateway_token"
    fi
  fi
fi

run_openclaw() {
  if [[ -n "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
    env OPENCLAW_GATEWAY_TOKEN="$OPENCLAW_GATEWAY_TOKEN" "$openclaw_bin" "$@"
    return
  fi
  "$openclaw_bin" "$@"
}

default_node_id="e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116"
mac_camera_node_id="${OPENCLAW_MAC_NODE_ID:-${MAC_CAMERA_NODE_ID:-$default_node_id}}"
mac_camera_retry_attempts="${MAC_CAMERA_RETRY_ATTEMPTS:-4}"
mac_camera_retry_sleep_sec="${MAC_CAMERA_RETRY_SLEEP_SEC:-5}"

is_transient_mac_camera_node_error() {
  local output="${1:-}"
  [[ "$output" == *"gateway closed"* ]] && return 0
  [[ "$output" == *"unknown node:"* ]] && return 0
  [[ "$output" == *"TIMEOUT"* ]] && return 0
  return 1
}

refresh_mac_camera_node() {
  run_openclaw nodes camera list --node "$mac_camera_node_id" >/dev/null 2>&1 || true
}

run_mac_camera_command_with_retry() {
  local description="$1"
  shift

  local attempt=1
  local output=""
  local rc=1

  while (( attempt <= mac_camera_retry_attempts )); do
    if output="$(run_openclaw "$@" 2>&1)"; then
      printf '%s\n' "$output"
      return 0
    fi

    rc=$?
    if ! is_transient_mac_camera_node_error "$output" || (( attempt == mac_camera_retry_attempts )); then
      printf '%s\n' "$output" >&2
      return "$rc"
    fi

    printf 'transient %s failure on attempt %s/%s; retrying\n' "$description" "$attempt" "$mac_camera_retry_attempts" >&2
    refresh_mac_camera_node
    if [[ "$mac_camera_retry_sleep_sec" != "0" ]]; then
      sleep "$mac_camera_retry_sleep_sec"
    fi
    attempt=$((attempt + 1))
  done

  printf '%s\n' "$output" >&2
  return "$rc"
}
