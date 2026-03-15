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
- Verified the gateway activity stays stable in foreground
- Fixed a device-specific Bluetooth crash caused by unsupported profile queries on this Xiaomi stack
- Verified desktop access over `adb forward tcp:8765 tcp:8765`
- Verified these endpoints successfully responded from this Mac:
  - `GET /status`
  - `GET /health/latest`
  - `GET /debug/source`
  - `GET /events`

### 9. Xiaomi-local source implementation

- Added a Xiaomi-local source layer ahead of Health Connect
- Added a structured Xiaomi log parser for:
  - `DailyStepReport`
  - `DailySpo2Report`
- Added a Xiaomi provider probe for `com.mi.health.provider.main`
- Added a composite source that prefers Xiaomi-local reads and then fills missing metrics from Health Connect
- Added Android JVM tests for:
  - Xiaomi log parsing
  - local-source status handling
  - composite source fallback behavior

## Current Observed State

The implementation exists and the transport path works. The gateway now reports live Bluetooth/bonding status correctly and exposes local-source diagnostics, but health metrics are still blocked on this ROM.

Latest observed values:

- `health_connect_ready = false`
- `local_source_ready = false`
- `metrics_ready = false`
- `bluetooth_ready = true`
- `health_connect_status = missing_permissions`
- `xiaomi_provider_status = no_provider_deploy`
- `xiaomi_log_status = inaccessible:IllegalStateException`
- `band_status = bonded`
- `android.permission.BLUETOOTH_CONNECT = granted=true`
- `android.permission.POST_NOTIFICATIONS = granted=true`

This means:

- the desktop bridge is live
- the phone can expose band connection state through the gateway today
- the gateway now probes Xiaomi-local data first
- current guessed Xiaomi provider paths still fail with `no_provider_deploy`
- the Xiaomi log parser exists, but the Android app cannot currently read `com.mi.health` log files from its own sandbox
- the official Google Health Connect package is installed, but permissions are still missing
- so `heart_rate_bpm`, `spo2_percent`, and `steps` remain `null` on the current reader path

## What Still Needs To Be Done On The Phone

1. Keep `Mi Band Gateway` in foreground when starting the gateway.
2. In `Mi Band Gateway`, tap:
   - `Grant Android Permissions`
   - `Open Health Connect`
   - `Grant Health Permissions`
   - `Start Gateway`
3. In `Health Connect`, grant the gateway read access for heart rate, SpO2, and steps.
4. In Xiaomi Fitness, allow sync/write into Health Connect if the option appears.

## Expected Next-State Signal

If either Xiaomi-local provider access starts working or Xiaomi Fitness syncs into granted Health Connect, the expected signals are:

- `health_connect_ready = true`
- `local_source_ready = true` or remains `false` while `health_connect_ready = true`
- `metrics_ready = true`
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
