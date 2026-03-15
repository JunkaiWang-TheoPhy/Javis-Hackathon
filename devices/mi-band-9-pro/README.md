# Mi Band 9 Pro

This directory collects the stable configuration, connection notes, gateway implementation, and desktop usage needed to work with the `Xiaomi Smart Band 9 Pro` in this repo.

## Current Device Pairing

- Band name: `Xiaomi Smart Band 9 Pro A094`
- Band MAC: `D0:AE:05:0D:A0:94`
- Band DID: `940134049`
- Band model: `miwear.watch.n67cn`
- Band firmware: `3.1.171`
- Phone model: `Xiaomi 12X`
- Phone ADB serial: `4722a997`

The band is paired to the phone, not directly to this computer. The gateway strategy is:

`Mi Band 9 Pro -> Xiaomi 12X -> Android gateway app -> HTTP/SSE -> desktop`

## Directory Map

- [device-profile.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/device-profile.json): stable device and phone identity
- [connection-notes.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/connection-notes.md): pairing facts, limits, and routing notes
- [progress-2026-03-15.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/progress-2026-03-15.md): implementation and verification progress snapshot
- [gateway/desktop/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/gateway/desktop/README.md): desktop-side tunnel and client usage
- [tmp/wearablelog/1773510602684log](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tmp/wearablelog/1773510602684log): captured Xiaomi Fitness logs

## macOS / Windows Workflow

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

The gateway app has been built, installed, and reinstalled on the `Xiaomi 12X`, and this Mac has already verified these endpoints over `adb forward`:

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

## Known Limits

- The desktop does not directly pair to the band.
- Xiaomi Fitness remains the source-of-truth pairing app.
- Health data is expected to be near-real-time, not raw BLE live telemetry.
- Xiaomi/HyperOS background restrictions can stop long-running collection unless the gateway app is allowed to run in foreground and ignore battery optimization.
- On this `Xiaomi 12X / HyperOS` setup, the gateway now prefers Xiaomi-local source probing before Health Connect, but:
  - current Xiaomi provider paths are still undiscovered
  - current Xiaomi log fallback is blocked inside the app sandbox
  - so the verified live output is still connection state plus richer source diagnostics, not non-null health metrics
