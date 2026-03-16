#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLIP_SCRIPT="$REPO_ROOT/scripts/macos-camera/devbox/localmac-cam-clip"

TMP_DIR="$(mktemp -d)"
FAKE_BIN_DIR="$TMP_DIR/fake-bin"
FAKE_LOG_PATH="$TMP_DIR/openclaw.log"
FAKE_STATE_PATH="$TMP_DIR/clip-count"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN_DIR"

cat > "$FAKE_BIN_DIR/openclaw" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '%s\n' "$*" >> "$FAKE_OPENCLAW_LOG"
}

if [[ "$1" == "nodes" && "$2" == "camera" && "$3" == "clip" ]]; then
  count=0
  if [[ -f "$FAKE_OPENCLAW_STATE" ]]; then
    count="$(cat "$FAKE_OPENCLAW_STATE")"
  fi
  count=$((count + 1))
  printf '%s\n' "$count" > "$FAKE_OPENCLAW_STATE"
  log "clip#$count $*"

  if [[ "$count" == "1" ]]; then
    printf '%s\n' 'gateway connect failed: Error: gateway closed (1000): ' >&2
    exit 1
  fi

  if [[ "$count" == "2" ]]; then
    printf '%s\n' 'nodes camera clip failed: Error: unknown node: e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116' >&2
    exit 1
  fi

  printf 'MEDIA:/tmp/openclaw/fake-camera-clip.mp4\n'
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

if [[ ! -f "$CLIP_SCRIPT" ]]; then
  echo "missing script: $CLIP_SCRIPT" >&2
  exit 1
fi

MAC_CAMERA_RETRY_ATTEMPTS=3 \
MAC_CAMERA_RETRY_SLEEP_SEC=0 \
"$CLIP_SCRIPT"

clip_count="$(grep -c '^clip#' "$FAKE_LOG_PATH" || true)"
list_count="$(grep -c '^list ' "$FAKE_LOG_PATH" || true)"

if [[ "$clip_count" != "3" ]]; then
  echo "expected 3 clip attempts, got $clip_count" >&2
  exit 1
fi

if [[ "$list_count" -lt "1" ]]; then
  echo "expected at least one refresh list call, got $list_count" >&2
  exit 1
fi

echo "PASS: localmac-cam-clip retries transient gateway and unknown-node failures"
