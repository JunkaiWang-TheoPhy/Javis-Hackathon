#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB_BIN:-}"
ADB_SERIAL="${ADB_SERIAL:-4722a997}"
GATEWAY_PORT="${GATEWAY_PORT:-8765}"
PACKAGE_NAME="com.javis.wearable.gateway"
ACTIVITY_NAME="${PACKAGE_NAME}/.MainActivity"
SERVICE_NAME="${PACKAGE_NAME}/.service.GatewayForegroundService"
ACTION_START="${PACKAGE_NAME}.action.START"

if [[ -z "${ADB_BIN}" ]]; then
    if command -v adb >/dev/null 2>&1; then
        ADB_BIN="$(command -v adb)"
    elif [[ -x "${HOME}/Library/Android/sdk/platform-tools/adb" ]]; then
        ADB_BIN="${HOME}/Library/Android/sdk/platform-tools/adb"
    else
        printf 'Unable to find adb. Set ADB_BIN or add adb to PATH.\n' >&2
        exit 1
    fi
fi

"${ADB_BIN}" -s "${ADB_SERIAL}" wait-for-device
"${ADB_BIN}" -s "${ADB_SERIAL}" shell am start -n "${ACTIVITY_NAME}" >/dev/null
"${ADB_BIN}" -s "${ADB_SERIAL}" shell am start-foreground-service -n "${SERVICE_NAME}" -a "${ACTION_START}" >/dev/null
"${ADB_BIN}" -s "${ADB_SERIAL}" forward --remove "tcp:${GATEWAY_PORT}" >/dev/null 2>&1 || true
"${ADB_BIN}" -s "${ADB_SERIAL}" forward "tcp:${GATEWAY_PORT}" "tcp:${GATEWAY_PORT}" >/dev/null

printf 'Gateway forwarded to http://127.0.0.1:%s\n' "${GATEWAY_PORT}"
