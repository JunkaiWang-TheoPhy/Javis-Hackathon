#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

bootout_if_loaded "$mac_camera_sidecar_plist"
bootout_if_loaded "$bridge_gateway_plist"
bootout_if_loaded "$devbox_tunnel_plist"
bootout_if_loaded "$openclaw_app_plist"

rm -f "$mac_camera_sidecar_plist" "$bridge_gateway_plist" "$devbox_tunnel_plist" "$openclaw_app_plist"
rm -rf "$runtime_root_dir"
rm -f "$runtime_devbox_ssh_identity"

printf '%s\n' '{"ok":true,"installed":false}'
