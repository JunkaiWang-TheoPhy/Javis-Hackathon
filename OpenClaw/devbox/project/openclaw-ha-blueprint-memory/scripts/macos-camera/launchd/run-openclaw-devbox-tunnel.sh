#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

ensure_launchd_dirs

if [[ ! -f "$devbox_ssh_identity" ]]; then
  echo "missing SSH identity: $devbox_ssh_identity" >&2
  exit 1
fi

exec "$ssh_bin" \
  -N \
  -L "${devbox_tunnel_local_port}:${devbox_tunnel_remote_host}:${devbox_tunnel_remote_port}" \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o TCPKeepAlive=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=accept-new \
  -i "$devbox_ssh_identity" \
  -p "$devbox_ssh_port" \
  "${devbox_ssh_user}@${devbox_ssh_host}"
