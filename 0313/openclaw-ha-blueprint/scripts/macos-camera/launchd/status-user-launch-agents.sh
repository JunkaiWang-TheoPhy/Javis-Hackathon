#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

ensure_launchd_dirs

node - "$devbox_tunnel_label" "$bridge_gateway_label" "$mac_camera_sidecar_label" "$openclaw_app_label" "$devbox_tunnel_plist" "$bridge_gateway_plist" "$mac_camera_sidecar_plist" "$openclaw_app_plist" <<'NODE'
const [tunnelLabel, bridgeLabel, sidecarLabel, appLabel, tunnelPlist, bridgePlist, sidecarPlist, appPlist] = process.argv.slice(2);
const payload = {
  ok: true,
  launchAgentsDir: process.env.HOME + "/Library/LaunchAgents",
  jobs: [
    { label: tunnelLabel, plist: tunnelPlist },
    { label: bridgeLabel, plist: bridgePlist },
    { label: sidecarLabel, plist: sidecarPlist },
    { label: appLabel, plist: appPlist },
  ],
  health: {
    devboxTunnel: "http://127.0.0.1:18789/health",
    bridgeGateway: "http://127.0.0.1:3301/v1/health",
  },
};
process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
NODE

echo
print_label_status "$devbox_tunnel_label"
echo
print_label_status "$bridge_gateway_label"
echo
print_label_status "$mac_camera_sidecar_label"
echo
print_label_status "$openclaw_app_label"
