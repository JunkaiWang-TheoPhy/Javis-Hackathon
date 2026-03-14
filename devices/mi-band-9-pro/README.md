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

The gateway app has been built, installed, and started on the `Xiaomi 12X`, and this Mac has already verified:

- `GET /status`
- `GET /health/latest`
- `GET /debug/source`

Current observed values on `2026-03-15`:

- `health_connect_ready = false`
- `bluetooth_ready = false`
- `health_connect_status = provider_update_required`
- `band_status = bluetooth_off`

So the bridge itself is running and reachable, but the phone still needs:

- Android runtime permission approval inside the app
- Health Connect provider installation or update on Android 13
- Health Connect data permission approval

## Known Limits

- The desktop does not directly pair to the band.
- Xiaomi Fitness remains the source-of-truth pairing app.
- Health data is expected to be near-real-time, not raw BLE live telemetry.
- Xiaomi/HyperOS background restrictions can stop long-running collection unless the gateway app is allowed to run in foreground and ignore battery optimization.
