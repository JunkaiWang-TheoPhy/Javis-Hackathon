#!/usr/bin/env bash
set -euo pipefail

openclaw_bin="${OPENCLAW_BIN:-$(command -v openclaw || true)}"
if [[ -z "$openclaw_bin" ]]; then
  echo "openclaw CLI not found in PATH; set OPENCLAW_BIN." >&2
  exit 1
fi

default_node_id="e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116"
mac_camera_node_id="${OPENCLAW_MAC_NODE_ID:-${MAC_CAMERA_NODE_ID:-$default_node_id}}"
