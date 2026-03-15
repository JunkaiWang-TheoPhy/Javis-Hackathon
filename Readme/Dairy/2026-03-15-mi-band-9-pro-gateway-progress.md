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

## New Desktop ADB Bridge Path

The blocked Android-side metric path is no longer the only route.

Today we also implemented a desktop-side bridge under:

- `tools/mi_band_desktop_bridge/`

This bridge:

- reads Xiaomi Fitness health data from the attached `Xiaomi 12X` over `adb`
- parses `logcat` and readable Xiaomi Fitness external logs
- serves a local HTTP API on the Mac
- exposes read-only endpoints for snapshot, events, alerts, and debug evidence
- can be consumed by the cloud `OpenClaw` runtime on `devbox`

### Verified Results

The desktop bridge was verified locally and through the remote bridge path on `2026-03-15`.

Verified local endpoints:

- `GET /health`
- `GET /v1/band/status`
- `GET /v1/band/latest`
- `GET /v1/band/events`
- `GET /v1/band/alerts`

Verified non-null metrics from the local bridge:

- `heart_rate_bpm = 83`
- `spo2_percent = 97`
- `steps = 2855`
- `distance_m = 1801`
- `calories_kcal = 104`
- `connection.status = connected`

Verified remote reachability:

- the local bridge was exposed through a public Cloudflare tunnel
- `devbox` fetched the same `/v1/band/latest` snapshot successfully
- the remote OpenClaw gateway loaded the `mi-band-bridge` plugin
- remote logs now include:
  - `[mi-band-bridge] bridge target https://...trycloudflare.com`

### Optional Wireless ADB Capability

We also added optional wireless ADB support into the desktop bridge codebase, but intentionally left it inactive.

What was added:

- bridge-side ADB target resolution:
  - env override via `OPENCLAW_MI_BAND_ADB_TARGET`
  - config fallback via `wireless_adb.enabled + host:port`
  - final fallback to USB serial `4722a997`
- a helper script:
  - `tools/mi_band_desktop_bridge/wireless_adb.py`

Verified current inactive state:

- `wireless_adb.enabled = false`
- `active_target = 4722a997`
- `active_transport = usb`

So the repo is ready for a later wireless switch, but nothing in the current runtime path was changed away from USB.

### Practical Outcome

For this hardware and ROM, the recommended path is now:

`Mi Band 9 Pro -> Xiaomi 12X -> adb collector on this Mac -> local HTTP bridge -> devbox OpenClaw`

The Android gateway app remains useful for connection-state diagnostics and Xiaomi-local probing, but the desktop `adb` bridge is the first verified path in this repo that actually returns non-null heart rate, SpO2, and step data to the computer.

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
