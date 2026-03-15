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
- `/debug/source` reports `health_connect_status = xiaomi_provider_incompatible_interface`
- `/health/latest` reports the band as `bonded`, but `heart_rate_bpm`, `spo2_percent`, and `steps` are still `null`
- the phone still does not expose the official Google Health Connect package `com.google.android.apps.healthdata`

So the bridge implementation exists, Bluetooth status polling works, and desktop transport has been validated. The remaining blocker is provider compatibility:

- Xiaomi Fitness exposes its own health permission pages on this ROM
- but the Xiaomi health binder interface does not match the interface expected by Jetpack `androidx.health.connect:connect-client`
- to make the current reader path return metrics, the phone still needs a compatible official Health Connect provider plus Xiaomi Fitness sync into that provider

## Known Limits

- The desktop does not directly pair to the band.
- Xiaomi Fitness remains the source-of-truth pairing app.
- Health data is expected to be near-real-time, not raw BLE live telemetry.
- Xiaomi/HyperOS background restrictions can stop long-running collection unless the gateway app is allowed to run in foreground and ignore battery optimization.
- On this `Xiaomi 12X / HyperOS` setup, Xiaomi's built-in health service is not wire-compatible with Jetpack `HealthConnectClient`, so the current gateway only guarantees band connection state unless a compatible Google Health Connect provider is installed.
