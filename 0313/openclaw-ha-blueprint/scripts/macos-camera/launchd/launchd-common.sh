#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${OPENCLAW_LAUNCHD_REPO_ROOT:-$(cd "$script_dir/../../.." && pwd)}"
camera_root="${OPENCLAW_MAC_CAMERA_ROOT:-$repo_root/scripts/macos-camera}"
local_macos_dir="${OPENCLAW_MAC_CAMERA_LOCAL_DIR:-$camera_root/local-macos}"
launchd_templates_dir="${OPENCLAW_MAC_CAMERA_LAUNCHD_TEMPLATES_DIR:-$camera_root/launchd/templates}"

user_launch_agents_dir="$HOME/Library/LaunchAgents"
launchd_state_dir="${OPENCLAW_MAC_CAMERA_LAUNCHD_DIR:-$HOME/.openclaw/workspace/.cache/localmac-camera/launchd}"
launchd_log_dir="$launchd_state_dir/logs"
launchd_config_dir="${OPENCLAW_MAC_CAMERA_CONFIG_DIR:-$HOME/.openclaw/workspace/.config/macos-camera-launchd}"
runtime_root_dir="$launchd_state_dir/runtime"
runtime_bin_dir="$runtime_root_dir/bin"
runtime_local_macos_dir="$runtime_bin_dir/local-macos"
runtime_devbox_tunnel_runner="$runtime_bin_dir/run-openclaw-devbox-tunnel.sh"
runtime_bridge_gateway_runner="$runtime_bin_dir/run-rokid-bridge-gateway.sh"
runtime_mac_camera_sidecar_runner="$runtime_bin_dir/run-mac-camera-sidecar.sh"
runtime_openclaw_app_runner="$runtime_bin_dir/run-openclaw-app.sh"
runtime_bridge_gateway_js="$runtime_bin_dir/rokid-bridge-gateway-runtime.mjs"
runtime_devbox_ssh_identity="$launchd_config_dir/devbox_id_ed25519"

devbox_tunnel_label="ai.javis.openclaw-devbox-tunnel"
bridge_gateway_label="ai.javis.rokid-bridge-gateway"
mac_camera_sidecar_label="ai.javis.mac-camera-sidecar"
openclaw_app_label="ai.javis.openclaw-macos-app"

devbox_tunnel_plist="$user_launch_agents_dir/$devbox_tunnel_label.plist"
bridge_gateway_plist="$user_launch_agents_dir/$bridge_gateway_label.plist"
mac_camera_sidecar_plist="$user_launch_agents_dir/$mac_camera_sidecar_label.plist"
openclaw_app_plist="$user_launch_agents_dir/$openclaw_app_label.plist"

devbox_tunnel_stdout="$launchd_log_dir/$devbox_tunnel_label.out.log"
devbox_tunnel_stderr="$launchd_log_dir/$devbox_tunnel_label.err.log"
bridge_gateway_stdout="$launchd_log_dir/$bridge_gateway_label.out.log"
bridge_gateway_stderr="$launchd_log_dir/$bridge_gateway_label.err.log"
mac_camera_sidecar_stdout="$launchd_log_dir/$mac_camera_sidecar_label.out.log"
mac_camera_sidecar_stderr="$launchd_log_dir/$mac_camera_sidecar_label.err.log"
openclaw_app_stdout="$launchd_log_dir/$openclaw_app_label.out.log"
openclaw_app_stderr="$launchd_log_dir/$openclaw_app_label.err.log"

bridge_env_file="$launchd_config_dir/rokid-bridge-gateway.env"
sidecar_env_file="$launchd_config_dir/mac-camera-sidecar.env"

ssh_bin="${SSH_BIN:-/usr/bin/ssh}"
openclaw_bin_default="${OPENCLAW_BIN:-/opt/homebrew/bin/openclaw}"
node_bin_default="${NODE_BIN:-/opt/homebrew/bin/node}"
tsx_bin_default="${TSX_BIN:-$repo_root/node_modules/.bin/tsx}"

devbox_ssh_host="${OPENCLAW_DEVBOX_HOST:-hzh.sealos.run}"
devbox_ssh_user="${OPENCLAW_DEVBOX_USER:-devbox}"
devbox_ssh_port="${OPENCLAW_DEVBOX_PORT:-2233}"
devbox_ssh_identity="${OPENCLAW_DEVBOX_IDENTITY:-/Users/thomasjwang/Documents/GitHub/Projects/Mira/hzh.sealos.run_ns-lijecm20_devbox}"
devbox_tunnel_local_port="${OPENCLAW_TUNNEL_LOCAL_PORT:-18789}"
devbox_tunnel_remote_host="${OPENCLAW_TUNNEL_REMOTE_HOST:-127.0.0.1}"
devbox_tunnel_remote_port="${OPENCLAW_TUNNEL_REMOTE_PORT:-18789}"
openclaw_mac_app_path="${OPENCLAW_MAC_APP_PATH:-$HOME/Applications/OpenClaw.app/Contents/MacOS/OpenClaw}"
openclaw_mac_app_bundle="${OPENCLAW_MAC_APP_BUNDLE:-$HOME/Applications/OpenClaw.app}"

ensure_launchd_dirs() {
  mkdir -p \
    "$user_launch_agents_dir" \
    "$launchd_state_dir" \
    "$launchd_log_dir" \
    "$launchd_config_dir" \
    "$runtime_root_dir" \
    "$runtime_bin_dir" \
    "$runtime_local_macos_dir"
}

write_file_if_missing() {
  local path="$1"
  local content="$2"
  if [[ -e "$path" ]]; then
    return 0
  fi
  printf '%s' "$content" >"$path"
}

write_default_env_files_if_missing() {
  write_file_if_missing "$bridge_env_file" "# Local env for rokid-bridge-gateway launchd job
PORT=3301
# HA_BASE_URL=http://homeassistant.local:8123
# HA_TOKEN=replace-me
"

  write_file_if_missing "$sidecar_env_file" "# Local env for mac camera sidecar launchd job
OPENCLAW_BIN=$openclaw_bin_default
AMBIENT_BRIDGE_URL=http://127.0.0.1:3301/v1/ambient/observe
# Optional direct OpenClaw hook escalation:
# OPENCLAW_HOOK_URL=http://127.0.0.1:18789/hooks/agent
# OPENCLAW_HOOK_TOKEN=replace-me
# OPENCLAW_HOOK_AGENT_ID=main
# OPENCLAW_HOOK_NAME=MacCamera
# OPENCLAW_HOOK_WAKE_MODE=now
# MAC_CAMERA_INTERVAL_SEC=3
# MAC_CAMERA_HEARTBEAT_SEC=60
"
}

render_plist_template() {
  local template_path="$1"
  local output_path="$2"
  local label="$3"
  local program="$4"
  local workdir="$5"
  local stdout_path="$6"
  local stderr_path="$7"
  local keepalive_network="$8"

  python3 - "$template_path" "$output_path" "$label" "$program" "$workdir" "$stdout_path" "$stderr_path" "$keepalive_network" <<'PY'
from pathlib import Path
import sys

template_path, output_path, label, program, workdir, stdout_path, stderr_path, keepalive_network = sys.argv[1:]
text = Path(template_path).read_text()
replacements = {
    "__LABEL__": label,
    "__PROGRAM__": program,
    "__WORKDIR__": workdir,
    "__STDOUT__": stdout_path,
    "__STDERR__": stderr_path,
    "__KEEPALIVE_NETWORK__": "<true/>" if keepalive_network == "true" else "<false/>",
}
for old, new in replacements.items():
    text = text.replace(old, new)
Path(output_path).write_text(text)
PY
}

launchctl_domain() {
  printf 'gui/%s' "$(id -u)"
}

bootout_if_loaded() {
  local plist_path="$1"
  launchctl bootout "$(launchctl_domain)" "$plist_path" >/dev/null 2>&1 || true
}

bootstrap_plist() {
  local plist_path="$1"
  launchctl bootstrap "$(launchctl_domain)" "$plist_path"
}

kickstart_label() {
  local label="$1"
  launchctl kickstart -k "$(launchctl_domain)/$label"
}

print_label_status() {
  local label="$1"
  launchctl print "$(launchctl_domain)/$label" 2>/dev/null || true
}
