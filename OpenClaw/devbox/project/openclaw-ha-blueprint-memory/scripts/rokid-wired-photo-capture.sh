#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB_BIN:-adb}"
REMOTE_CAMERA_DIR="${ROKID_CAPTURE_REMOTE_DIR:-/sdcard/DCIM/Camera}"
CAPTURE_COUNT="${ROKID_CAPTURE_COUNT:-10}"
INTERVAL_SECONDS="${ROKID_CAPTURE_INTERVAL_SECONDS:-30}"
READY_TIMEOUT_SECONDS="${ROKID_CAPTURE_READY_TIMEOUT_SECONDS:-20}"
POLL_SECONDS="${ROKID_CAPTURE_POLL_SECONDS:-1}"
KEYEVENT_CODE="${ROKID_CAPTURE_KEYEVENT:-27}"
TRIGGER_MODE="${ROKID_CAPTURE_TRIGGER:-keyevent}"
TAP_X="${ROKID_CAPTURE_TAP_X:-}"
TAP_Y="${ROKID_CAPTURE_TAP_Y:-}"
OUTPUT_DIR="${ROKID_CAPTURE_OUTPUT_DIR:-$HOME/Pictures/RokidCaptures/$(date +%Y%m%d-%H%M%S)}"
DEVICE_SERIAL="${ROKID_CAPTURE_SERIAL:-}"

ensure_adb_exists() {
  if [[ "$ADB_BIN" == */* ]]; then
    if [[ ! -x "$ADB_BIN" ]]; then
      echo "adb binary is not executable: $ADB_BIN" >&2
      exit 1
    fi
    return
  fi

  if ! command -v "$ADB_BIN" >/dev/null 2>&1; then
    echo "adb not found. Install Android Platform-Tools or set ADB_BIN." >&2
    exit 1
  fi
}

adb_cmd() {
  if [[ -n "$DEVICE_SERIAL" ]]; then
    "$ADB_BIN" -s "$DEVICE_SERIAL" "$@"
  else
    "$ADB_BIN" "$@"
  fi
}

ensure_device_online() {
  local devices_output matched_line
  devices_output="$("$ADB_BIN" devices)"

  if [[ -n "$DEVICE_SERIAL" ]]; then
    matched_line="$(printf '%s\n' "$devices_output" | awk -v serial="$DEVICE_SERIAL" '$1 == serial { print $0 }')"
    if [[ -z "$matched_line" || "$matched_line" != *$'\tdevice'* ]]; then
      echo "device $DEVICE_SERIAL is not online" >&2
      exit 1
    fi
    return
  fi

  if ! printf '%s\n' "$devices_output" | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit(found ? 0 : 1) }'; then
    echo "no online adb device found" >&2
    exit 1
  fi
}

validate_trigger_config() {
  case "$TRIGGER_MODE" in
    keyevent)
      ;;
    tap)
      if [[ -z "$TAP_X" || -z "$TAP_Y" ]]; then
        echo "tap trigger requires ROKID_CAPTURE_TAP_X and ROKID_CAPTURE_TAP_Y" >&2
        exit 1
      fi
      ;;
    *)
      echo "unsupported trigger mode: $TRIGGER_MODE" >&2
      exit 1
      ;;
  esac
}

latest_remote_file() {
  adb_cmd shell ls -1t "$REMOTE_CAMERA_DIR" 2>/dev/null \
    | tr -d '\r' \
    | awk 'NF { print $0; exit }'
}

wait_for_new_remote_file() {
  local previous_file="$1"
  local start_time now
  local latest_file=""
  start_time="$(date +%s)"

  while true; do
    latest_file="$(latest_remote_file || true)"
    if [[ -n "$latest_file" && "$latest_file" != "$previous_file" ]]; then
      printf '%s\n' "$latest_file"
      return 0
    fi

    now="$(date +%s)"
    if (( now - start_time > READY_TIMEOUT_SECONDS )); then
      break
    fi

    sleep "$POLL_SECONDS"
  done

  return 1
}

download_remote_file() {
  local remote_name="$1"
  adb_cmd pull "$REMOTE_CAMERA_DIR/$remote_name" "$OUTPUT_DIR" >/dev/null
}

trigger_capture() {
  case "$TRIGGER_MODE" in
    keyevent)
      adb_cmd shell input keyevent "$KEYEVENT_CODE" >/dev/null
      ;;
    tap)
      adb_cmd shell input tap "$TAP_X" "$TAP_Y" >/dev/null
      ;;
  esac
}

trigger_description() {
  case "$TRIGGER_MODE" in
    keyevent)
      printf 'keyevent %s' "$KEYEVENT_CODE"
      ;;
    tap)
      printf 'tap %s %s' "$TAP_X" "$TAP_Y"
      ;;
  esac
}

main() {
  local round previous_file new_file

  ensure_adb_exists
  ensure_device_online
  validate_trigger_config
  mkdir -p "$OUTPUT_DIR"

  printf 'Rokid wired auto capture started\n'
  printf 'Output directory: %s\n' "$OUTPUT_DIR"
  printf 'Capture count: %s\n' "$CAPTURE_COUNT"
  printf 'Interval seconds: %s\n' "$INTERVAL_SECONDS"
  printf 'Trigger: %s\n' "$(trigger_description)"
  printf 'Camera app must stay foreground and screen must stay awake.\n'

  for (( round = 1; round <= CAPTURE_COUNT; round++ )); do
    previous_file="$(latest_remote_file || true)"
    printf '[%s/%s] Triggering shutter with %s\n' "$round" "$CAPTURE_COUNT" "$(trigger_description)"
    trigger_capture

    if ! new_file="$(wait_for_new_remote_file "$previous_file")"; then
      echo "timed out waiting for a new photo after round $round" >&2
      exit 1
    fi

    download_remote_file "$new_file"
    printf '[%s/%s] Saved %s to %s\n' "$round" "$CAPTURE_COUNT" "$new_file" "$OUTPUT_DIR"

    if (( round < CAPTURE_COUNT )); then
      sleep "$INTERVAL_SECONDS"
    fi
  done

  printf 'Capture complete. Downloaded %s photos to %s\n' "$CAPTURE_COUNT" "$OUTPUT_DIR"
}

main "$@"
