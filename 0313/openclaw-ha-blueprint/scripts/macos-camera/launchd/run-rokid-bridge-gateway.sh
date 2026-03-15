#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

ensure_launchd_dirs
write_default_env_files_if_missing

if [[ -f "$bridge_env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$bridge_env_file"
  set +a
fi

if [[ ! -x "$node_bin_default" ]]; then
  echo "missing node binary: $node_bin_default" >&2
  exit 1
fi

if [[ ! -x "$tsx_bin_default" ]]; then
  echo "missing tsx binary: $tsx_bin_default" >&2
  exit 1
fi

cd "$repo_root"
exec "$node_bin_default" "$tsx_bin_default" "$repo_root/services/rokid-bridge-gateway/src/server.ts"
