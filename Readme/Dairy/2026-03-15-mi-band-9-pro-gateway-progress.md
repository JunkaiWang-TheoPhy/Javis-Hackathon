# Mi Band 9 Pro Gateway Progress - 2026-03-15

## Overview

This note records the progress made in this session for the `Xiaomi 12X -> Mi Band 9 Pro -> Android gateway -> desktop` workflow.

## What We Completed

### 1. Phone access and ADB

- Verified the connected phone is `Xiaomi 12X`
- Resolved the initial `adb unauthorized` state
- Confirmed the authorized device serial is `4722a997`

### 2. Wearable log extraction

- Inspected `/sdcard/Download/wearablelog`
- Confirmed the log bundle `1773510602684log`
- Synced the extracted logs into the repo at:
  - `tmp/wearablelog/1773510602684log/`

### 3. Mi Band 9 Pro pairing analysis

- Verified from Xiaomi Fitness logs that the band had already completed bind flow successfully
- Confirmed the band identity used in this setup:
  - Band name: `Xiaomi Smart Band 9 Pro A094`
  - MAC: `D0:AE:05:0D:A0:94`
  - DID: `940134049`
  - Model: `miwear.watch.n67cn`
  - Firmware: `3.1.171`

### 4. Repo documentation and stable device metadata

- Added stable device notes under:
  - `devices/mi-band-9-pro/README.md`
  - `devices/mi-band-9-pro/device-profile.json`
  - `devices/mi-band-9-pro/connection-notes.md`
  - `devices/mi-band-9-pro/progress-2026-03-15.md`

### 5. Android gateway implementation

- Implemented the Android gateway app under:
  - `devices/mi-band-9-pro/gateway/android-app/`
- Implemented:
  - snapshot/status models
  - embedded HTTP server
  - SSE event stream
  - Bluetooth state reader
  - Health Connect reader
  - foreground service
  - minimal activity for permission and gateway control

### 6. Desktop gateway tooling

- Added desktop helper scripts under:
  - `devices/mi-band-9-pro/gateway/desktop/`
- Implemented:
  - `start_gateway_tunnel.sh`
  - `start_gateway_tunnel.ps1`
  - `poll_gateway.py`
  - `stream_gateway.py`
  - `gateway_client.py`

### 7. Tests and verification

- Added Android JVM tests for:
  - snapshot serialization
  - SSE formatting
  - Bluetooth connection-state mapping
- Added Python `unittest` coverage for the desktop gateway client
- Verified:
  - `gradle app:testDebugUnitTest`
  - `python3 -m unittest discover -s devices/mi-band-9-pro/gateway/desktop -p 'test_*.py'`

### 8. APK build, install, and gateway validation

- Built the debug APK
- Installed the APK on the `Xiaomi 12X`
- Started the gateway service
- Verified desktop access over `adb forward tcp:8765 tcp:8765`
- Verified these endpoints successfully responded from this Mac:
  - `GET /status`
  - `GET /health/latest`
  - `GET /debug/source`
  - `GET /events`

## Current Observed State

The implementation exists and the transport path works, but live health data is still blocked by unfinished phone-side permissions and consent.

Latest observed values:

- `health_connect_ready = false`
- `bluetooth_ready = false`
- `health_connect_status = provider_update_required`
- `band_status = bluetooth_off`
- `android.permission.BLUETOOTH_CONNECT = granted=false`
- `android.permission.POST_NOTIFICATIONS = granted=false`

Latest foreground activity observed on phone:

- `com.mi.health/com.xiaomi.fitness.access.health_connect.HealthConnectPrivacyActivity`

This means the phone is still blocked in the Xiaomi Fitness / Health Connect consent flow.

## What Still Needs To Be Done On The Phone

1. Finish the Xiaomi Fitness privacy and Health Connect consent flow.
2. Return to the `Mi Band Gateway` app.
3. Tap `Grant Android Permissions`.
4. Allow:
   - `Nearby devices`
   - notification permission
5. Tap `Grant Health Permissions`.
6. Tap `Start Gateway`.

## Expected Next-State Signal

Once the phone-side flow is completed, the expected signals are:

- `health_connect_ready = true`
- `bluetooth_ready = true`
- `band_status = bonded` or `connected`
- `/health/latest` starts returning non-null:
  - `heart_rate_bpm`
  - `spo2_percent`
  - `steps`

## Related Repo Paths

- `devices/mi-band-9-pro/`
- `devices/mi-band-9-pro/gateway/android-app/`
- `devices/mi-band-9-pro/gateway/desktop/`
- `tmp/wearablelog/1773510602684log/`
