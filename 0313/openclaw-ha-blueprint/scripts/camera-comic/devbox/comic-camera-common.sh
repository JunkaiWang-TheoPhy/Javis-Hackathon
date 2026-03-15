#!/usr/bin/env bash
set -euo pipefail

workspace_dir="${OPENCLAW_WORKSPACE_DIR:-$HOME/.openclaw/workspace}"
comic_output_dir="${OPENCLAW_COMIC_OUTPUT_DIR:-$workspace_dir/comic}"
comic_tools_dir="${OPENCLAW_COMIC_TOOLS_DIR:-$workspace_dir/comic-tools}"
renderer_script="${OPENCLAW_COMIC_RENDERER:-$comic_tools_dir/generate_camera_comic.py}"
localpc_cache_dir="${OPENCLAW_LOCALPC_CAMERA_CACHE_DIR:-$workspace_dir/.cache/localpc-camera}"
localmac_cache_dir="${OPENCLAW_LOCALMAC_CAMERA_CACHE_DIR:-$workspace_dir/.cache/localmac-camera}"
comic_python_bin_default="python3"
if [[ -x "$comic_tools_dir/.venv/bin/python3" ]]; then
  comic_python_bin_default="$comic_tools_dir/.venv/bin/python3"
fi
comic_python_bin="${OPENCLAW_COMIC_PYTHON_BIN:-$comic_python_bin_default}"

ensure_comic_dirs() {
  mkdir -p "$comic_output_dir" "$comic_tools_dir" "$localpc_cache_dir" "$localmac_cache_dir"
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "missing file: $path" >&2
    exit 1
  fi
}

extract_media_path() {
  local command_output="$1"
  printf '%s\n' "$command_output" \
    | perl -pe 's/\e\[[0-9;?]*[[:alpha:]]//g; s/\r//g' \
    | sed -n 's/^MEDIA://p' \
    | tail -n1
}

write_capture_metadata() {
  local metadata_path="$1"
  local source="$2"
  local original_path="$3"

  "$comic_python_bin" - "$metadata_path" "$source" "$original_path" <<'PY'
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import sys


metadata_path = Path(sys.argv[1])
source = sys.argv[2]
original_path = sys.argv[3]

payload = {
    "source": source,
    "originalPath": original_path,
    "capturedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
}

metadata_path.parent.mkdir(parents=True, exist_ok=True)
metadata_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
PY
}

run_comic_renderer() {
  local source="$1"
  local input_path="$2"
  local metadata_path="$3"

  require_file "$renderer_script"
  require_file "$input_path"
  require_file "$metadata_path"
  ensure_comic_dirs

  "$comic_python_bin" "$renderer_script" \
    --source "$source" \
    --input "$input_path" \
    --metadata "$metadata_path" \
    --output-dir "$comic_output_dir"
}
