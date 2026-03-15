#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
mac_camera_cache_dir="${OPENCLAW_MAC_CAMERA_CACHE_DIR:-$HOME/.openclaw/workspace/.cache/localmac-camera}"
mac_camera_interval_sec="${MAC_CAMERA_INTERVAL_SEC:-3}"
mac_camera_change_threshold="${MAC_CAMERA_CHANGE_THRESHOLD:-0.18}"
mac_camera_heartbeat_sec="${MAC_CAMERA_HEARTBEAT_SEC:-60}"
mac_camera_delay_ms="${MAC_CAMERA_DELAY_MS:-1000}"
ambient_bridge_url="${AMBIENT_BRIDGE_URL:-http://127.0.0.1:3301/v1/ambient/observe}"

latest_image_path="$mac_camera_cache_dir/latest.jpg"
latest_json_path="$mac_camera_cache_dir/latest.json"
state_json_path="$mac_camera_cache_dir/state.json"
loop_pid_path="$mac_camera_cache_dir/loop.pid"
loop_log_path="$mac_camera_cache_dir/loop.log"

ensure_cache_dir() {
  mkdir -p "$mac_camera_cache_dir"
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "missing file: $path" >&2
    exit 1
  fi
}

copy_media_output() {
  local command_output="$1"
  local media_path
  media_path="$(
    printf '%s\n' "$command_output" \
      | perl -pe 's/\e\[[0-9;?]*[[:alpha:]]//g; s/\r//g' \
      | sed -n 's/^MEDIA://p' \
      | tail -n1
  )"
  if [[ -z "$media_path" ]]; then
    echo "camera command did not return a MEDIA path" >&2
    printf '%s\n' "$command_output" >&2
    exit 1
  fi
  require_file "$media_path"
  cp "$media_path" "$latest_image_path"
}

read_state_field() {
  local field="$1"
  if [[ ! -f "$state_json_path" ]]; then
    return 0
  fi

  node - "$state_json_path" "$field" <<'NODE'
const fs = require("node:fs");
const [statePath, field] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const value = state[field];
if (value === undefined || value === null) {
  process.exit(0);
}
process.stdout.write(String(value));
NODE
}

write_json_file() {
  local path="$1"
  local content="$2"
  printf '%s\n' "$content" > "$path"
}
