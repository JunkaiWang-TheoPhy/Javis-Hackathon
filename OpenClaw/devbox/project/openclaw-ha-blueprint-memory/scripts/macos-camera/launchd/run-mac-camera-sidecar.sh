#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

ensure_launchd_dirs
write_default_env_files_if_missing

if [[ -f "$sidecar_env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$sidecar_env_file"
  set +a
fi

cd "$repo_root"
exec "$local_macos_dir/mac-camera-loop"
