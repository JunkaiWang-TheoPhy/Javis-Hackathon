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

default_node_id="e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116"
mac_camera_node_id="${OPENCLAW_MAC_NODE_ID:-${MAC_CAMERA_NODE_ID:-$default_node_id}}"
