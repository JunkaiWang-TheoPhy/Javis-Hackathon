# Mi Band 9 Pro

This directory collects the stable configuration, connection notes, and implementation notes needed to work with the `Xiaomi Smart Band 9 Pro` in this repo.

## Current Device Pairing

- Band name: `Xiaomi Smart Band 9 Pro A094`
- Band MAC: `D0:AE:05:0D:A0:94`
- Band DID: `940134049`
- Band model: `miwear.watch.n67cn`
- Band firmware: `3.1.171`
- Phone model: `Xiaomi 12X`
- Phone ADB serial: `4722a997`

The band is paired to the phone, not directly to this computer. The current recommended strategy is:

`Mi Band 9 Pro -> Xiaomi 12X -> adb collector on this Mac -> local HTTP bridge -> devbox OpenClaw`

The older Android gateway app path still exists in this repo, but on this `Xiaomi 12X / HyperOS` setup it remains limited to connection-state diagnostics.

## Directory Map

- [device-profile.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/device-profile.json): stable device and phone identity
- [connection-notes.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/connection-notes.md): pairing facts, limits, and routing notes
- [progress-2026-03-15.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/progress-2026-03-15.md): implementation and verification progress snapshot
- [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/mi_band_desktop_bridge/README.md): desktop `adb` collector, local HTTP bridge, and devbox plugin flow
- [gateway/desktop/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/gateway/desktop/README.md): desktop-side tunnel and client usage
- [tmp/wearablelog/1773510602684log](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tmp/wearablelog/1773510602684log): captured Xiaomi Fitness logs

## Recommended Workflow

1. Connect the `Xiaomi 12X` over USB with `adb` authorized.
2. Export a bridge token:

```bash
export OPENCLAW_MI_BAND_BRIDGE_TOKEN=test-token
```

3. Start the desktop bridge:

```bash
zsh tools/mi_band_desktop_bridge/start_bridge.sh
```

4. Read the latest snapshot locally:

```bash
python3 tools/mi_band_desktop_bridge/client.py latest --token "$OPENCLAW_MI_BAND_BRIDGE_TOKEN"
```

5. If cloud `OpenClaw` on `devbox` should consume the bridge:

```bash
zsh tools/mi_band_desktop_bridge/start_tunnel.sh
python3 tools/mi_band_desktop_bridge/deploy_remote.py
```

Optional future wireless mode exists now, but it is not active by default. The current verified bridge still uses the USB serial target. When you want to switch later, use [wireless_adb.py](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/mi_band_desktop_bridge/wireless_adb.py) and keep `wireless_adb.enabled = false` until pairing and connectivity are confirmed.

## Older Android Gateway Workflow

1. Connect the `Xiaomi 12X` over USB with `adb` authorized.
2. Install and open the Android gateway app in `gateway/android-app/`.
3. On first run, tap:
   - `Grant Android Permissions`
   - `Open Health Connect`
   - `Grant Health Permissions`
   - `Start Gateway`
4. Expose the phone-local gateway port to the desktop:

```bash
cd devices/mi-band-9-pro/gateway/desktop
./start_gateway_tunnel.sh
```

Windows PowerShell:

```powershell
cd devices/mi-band-9-pro/gateway/desktop
.\start_gateway_tunnel.ps1
```

5. Read snapshot data:

```bash
python3 devices/mi-band-9-pro/gateway/desktop/poll_gateway.py
python3 devices/mi-band-9-pro/gateway/desktop/stream_gateway.py
```

Fallback tunnel only:

```bash
adb forward tcp:8765 tcp:8765
```

## Verified Runtime Status

The Android gateway app has been built, installed, and reinstalled on the `Xiaomi 12X`, and this Mac has already verified these endpoints over `adb forward`:

- `GET /status`
- `GET /health/latest`
- `GET /debug/source`
- `GET /events`

The current progress is tracked in [progress-2026-03-15.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/progress-2026-03-15.md). The latest observed blocker state on `2026-03-15` is:

- `android.permission.BLUETOOTH_CONNECT = granted=true`
- `android.permission.POST_NOTIFICATIONS = granted=true`
- `/status` reports `bluetooth_ready = true`
- `/status` reports `local_source_ready = false` and `metrics_ready = false`
- `/debug/source` reports `health_connect_status = missing_permissions`
- `/debug/source` reports `xiaomi_provider_status = no_provider_deploy`
- `/debug/source` reports `xiaomi_log_status = inaccessible:IllegalStateException`
- `/health/latest` reports the band as `bonded`, but `heart_rate_bpm`, `spo2_percent`, and `steps` are still `null`
- the phone now does expose official Google Health Connect package `com.google.android.apps.healthdata`, but permissions are still not granted on the current phone state

So the bridge implementation exists, Bluetooth status polling works, and desktop transport has been validated. The remaining blocker is now split in two:

- Xiaomi Fitness local provider probing now runs inside the gateway app, but current guessed provider paths return `no provider deploy`
- Xiaomi Fitness external logs are ADB-readable from the desktop, but the Android gateway app cannot currently read `com.mi.health` log files from its own sandbox on this HyperOS setup
- the official Google Health Connect provider is installed, but the gateway still lacks granted Health Connect read permissions on the current phone state

The newer desktop `adb` bridge has already bypassed this blocker and returned non-null metrics on the same day:

- `heart_rate_bpm = 83`
- `spo2_percent = 97`
- `steps = 2855`
- `distance_m = 1801`
- `calories_kcal = 104`

It has also been exposed to `devbox` over a public tunnel and loaded into the running `OpenClaw` gateway through the `mi-band-bridge` plugin.

As of the latest verification, the bridge also supports an optional wireless ADB target, but:

- it is disabled in config
- the active target is still the USB serial `4722a997`
- the active transport is still `usb`

## Known Limits

- The desktop does not directly pair to the band.
- Xiaomi Fitness remains the source-of-truth pairing app.
- Health data is expected to be near-real-time, not raw BLE live telemetry.
- Xiaomi/HyperOS background restrictions can stop long-running collection unless the gateway app is allowed to run in foreground and ignore battery optimization.
- On this `Xiaomi 12X / HyperOS` setup, the gateway now prefers Xiaomi-local source probing before Health Connect, but:
  - current Xiaomi provider paths are still undiscovered
  - current Xiaomi log fallback is blocked inside the app sandbox
  - so the verified live output is still connection state plus richer source diagnostics, not non-null health metrics
- The desktop `adb` bridge is the recommended path for actual metric delivery on this hardware and ROM combination.
