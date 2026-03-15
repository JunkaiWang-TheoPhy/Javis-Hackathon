#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SHOT_SCRIPT="$REPO_ROOT/scripts/macos-camera/local-macos/mac-camera-shot"

TMP_DIR="$(mktemp -d)"
FAKE_BIN_DIR="$TMP_DIR/fake-bin"
FAKE_CACHE_DIR="$TMP_DIR/cache"
FAKE_LOG_PATH="$TMP_DIR/openclaw.log"
FAKE_STATE_PATH="$TMP_DIR/snap-count"
FAKE_MEDIA_PATH="$TMP_DIR/fake-camera.jpg"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN_DIR" "$FAKE_CACHE_DIR"
printf 'fake-jpg\n' > "$FAKE_MEDIA_PATH"

cat > "$FAKE_BIN_DIR/openclaw" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '%s\n' "$*" >> "$FAKE_OPENCLAW_LOG"
}

if [[ "$1" == "nodes" && "$2" == "camera" && "$3" == "snap" ]]; then
  count=0
  if [[ -f "$FAKE_OPENCLAW_STATE" ]]; then
    count="$(cat "$FAKE_OPENCLAW_STATE")"
  fi
  count=$((count + 1))
  printf '%s\n' "$count" > "$FAKE_OPENCLAW_STATE"
  log "snap#$count $*"

  if [[ "$count" == "1" ]]; then
    printf '%s\n' 'nodes camera snap failed: Error: gateway closed (1006 abnormal closure (no close frame)): no close reason' >&2
    exit 1
  fi

  if [[ "$count" == "2" ]]; then
    printf '%s\n' 'nodes camera snap failed: Error: unknown node: e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116' >&2
    exit 1
  fi

  printf '{"files":[{"path":"%s"}]}\n' "$FAKE_OPENCLAW_MEDIA"
  exit 0
fi

if [[ "$1" == "nodes" && "$2" == "camera" && "$3" == "list" ]]; then
  log "list $*"
  printf 'MacBook Air相机\n'
  exit 0
fi

log "unexpected $*"
printf 'unexpected command: %s\n' "$*" >&2
exit 1
EOF

chmod +x "$FAKE_BIN_DIR/openclaw"

export PATH="$FAKE_BIN_DIR:$PATH"
export FAKE_OPENCLAW_LOG="$FAKE_LOG_PATH"
export FAKE_OPENCLAW_STATE="$FAKE_STATE_PATH"
export FAKE_OPENCLAW_MEDIA="$FAKE_MEDIA_PATH"

if [[ ! -f "$SHOT_SCRIPT" ]]; then
  echo "missing script: $SHOT_SCRIPT" >&2
  exit 1
fi

OPENCLAW_MAC_CAMERA_CACHE_DIR="$FAKE_CACHE_DIR" \
MAC_CAMERA_RETRY_ATTEMPTS=3 \
MAC_CAMERA_RETRY_SLEEP_SEC=0 \
"$SHOT_SCRIPT"

[[ -f "$FAKE_CACHE_DIR/latest.jpg" ]] || {
  echo "expected latest.jpg to be written" >&2
  exit 1
}

snap_count="$(grep -c '^snap#' "$FAKE_LOG_PATH" || true)"
list_count="$(grep -c '^list ' "$FAKE_LOG_PATH" || true)"

if [[ "$snap_count" != "3" ]]; then
  echo "expected 3 snap attempts, got $snap_count" >&2
  exit 1
fi

if [[ "$list_count" -lt "1" ]]; then
  echo "expected at least one refresh list call, got $list_count" >&2
  exit 1
fi

echo "PASS: mac-camera-shot retries transient gateway and unknown-node failures"
