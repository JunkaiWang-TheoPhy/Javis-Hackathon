#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_PATH="$REPO_ROOT/scripts/rokid-wired-photo-capture.sh"

TMP_DIR="$(mktemp -d)"
FAKE_BIN_DIR="$TMP_DIR/fake-bin"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN_DIR"

cat > "$FAKE_BIN_DIR/adb" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

SERIAL=""
if [[ "${1:-}" == "-s" ]]; then
  SERIAL="${2:-}"
  shift 2
fi

COMMAND="${1:-}"
shift || true

log() {
  printf '%s\n' "$*" >> "$FAKE_ADB_LOG"
}

case "$COMMAND" in
  devices)
    log "devices $SERIAL"
    printf 'List of devices attached\n'
    printf '1901092534014036\tdevice usb:1-1.1 product:glasses model:RG_glasses device:glasses transport_id:1\n'
    ;;
  shell)
    SUBCOMMAND="${1:-}"
    shift || true
    case "$SUBCOMMAND" in
      ls)
        FLAG="${1:-}"
        TARGET_DIR="${2:-}"
        log "shell ls $FLAG $TARGET_DIR"
        if [[ "$FLAG" != "-1t" ]]; then
          echo "unexpected ls flag: $FLAG" >&2
          exit 1
        fi
        find "$FAKE_REMOTE_DIR" -maxdepth 1 -type f -print0 \
          | xargs -0 stat -f '%m %N' \
          | sort -rn \
          | cut -d' ' -f2- \
          | xargs -n1 basename
        ;;
      input)
        ACTION="${1:-}"
        ARG1="${2:-}"
        ARG2="${3:-}"
        log "shell input $ACTION $ARG1 $ARG2"
        if [[ "$ACTION" != "keyevent" && "$ACTION" != "tap" ]]; then
          echo "unexpected input action: $ACTION" >&2
          exit 1
        fi
        NEXT_INDEX=$(printf '%s\n' "$FAKE_REMOTE_DIR"/IMG_*.webp | wc -w | tr -d ' ')
        printf 'capture-%s\n' "$NEXT_INDEX" > "$FAKE_REMOTE_DIR/IMG_$(printf '%04d' "$NEXT_INDEX").webp"
        ;;
      *)
        echo "unexpected shell subcommand: $SUBCOMMAND" >&2
        exit 1
        ;;
    esac
    ;;
  pull)
    SOURCE_PATH="${1:-}"
    DESTINATION_DIR="${2:-}"
    log "pull $SOURCE_PATH $DESTINATION_DIR"
    cp "$FAKE_REMOTE_DIR/$(basename "$SOURCE_PATH")" "$DESTINATION_DIR/"
    printf '1 file pulled\n'
    ;;
  *)
    echo "unexpected adb command: $COMMAND" >&2
    exit 1
    ;;
esac
EOF

chmod +x "$FAKE_BIN_DIR/adb"

export PATH="$FAKE_BIN_DIR:$PATH"

if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "missing script: $SCRIPT_PATH" >&2
  exit 1
fi

run_case() {
  local case_name="$1"
  local trigger_mode="$2"
  local expected_log_pattern="$3"
  local remote_dir="$TMP_DIR/$case_name-remote"
  local output_dir="$TMP_DIR/$case_name-output"
  local log_path="$TMP_DIR/$case_name-adb.log"
  local downloaded_count trigger_count pull_count

  mkdir -p "$remote_dir" "$output_dir"
  printf 'seed\n' > "$remote_dir/IMG_0000.webp"

  export FAKE_REMOTE_DIR="$remote_dir"
  export FAKE_ADB_LOG="$log_path"

  ROKID_CAPTURE_OUTPUT_DIR="$output_dir" \
  ROKID_CAPTURE_COUNT=3 \
  ROKID_CAPTURE_INTERVAL_SECONDS=0 \
  ROKID_CAPTURE_READY_TIMEOUT_SECONDS=2 \
  ROKID_CAPTURE_POLL_SECONDS=0 \
  ROKID_CAPTURE_SERIAL=1901092534014036 \
  ROKID_CAPTURE_TRIGGER="$trigger_mode" \
  ROKID_CAPTURE_TAP_X=240 \
  ROKID_CAPTURE_TAP_Y=560 \
  "$SCRIPT_PATH"

  downloaded_count=$(find "$output_dir" -maxdepth 1 -type f -name 'IMG_*.webp' | wc -l | tr -d ' ')
  trigger_count=$(grep -c "$expected_log_pattern" "$log_path")
  pull_count=$(grep -c '^pull ' "$log_path")

  if [[ "$downloaded_count" != "3" ]]; then
    echo "[$case_name] expected 3 downloaded files, got $downloaded_count" >&2
    exit 1
  fi

  if [[ "$trigger_count" != "3" ]]; then
    echo "[$case_name] expected 3 trigger commands, got $trigger_count" >&2
    exit 1
  fi

  if [[ "$pull_count" != "3" ]]; then
    echo "[$case_name] expected 3 pulls, got $pull_count" >&2
    exit 1
  fi
}

run_case "keyevent" "keyevent" 'shell input keyevent 27'
run_case "tap" "tap" 'shell input tap 240 560'

echo "PASS: wired photo capture supports keyevent and tap triggers"
