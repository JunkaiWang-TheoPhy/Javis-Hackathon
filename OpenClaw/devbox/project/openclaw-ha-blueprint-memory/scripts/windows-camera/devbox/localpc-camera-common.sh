#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
localpc_pwsh="$script_dir/localpc-pwsh"

localpc_script_dir='C:\Users\14245\.local\bin'
localpc_camera_dir='C:\Users\14245\AppData\Local\Temp\openclaw-camera'
remote_cache_dir_default="$HOME/.openclaw/workspace/.cache/localpc-camera"

ensure_remote_cache_dir() {
  local cache_dir="${1:-$remote_cache_dir_default}"
  mkdir -p "$cache_dir"
}

ps_quote() {
  local value="${1//\'/''}"
  printf "'%s'" "$value"
}
