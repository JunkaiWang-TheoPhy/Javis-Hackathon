# Desktop Gateway Usage

This directory contains the desktop-side helpers that talk to the Android gateway app on the `Xiaomi 12X`.

## Files

- `start_gateway_tunnel.sh`: macOS/Linux tunnel and service starter
- `start_gateway_tunnel.ps1`: Windows PowerShell tunnel and service starter
- `gateway_client.py`: shared HTTP/SSE client helpers
- `poll_gateway.py`: fetch `/status`, `/debug/source`, and `/health/latest`
- `stream_gateway.py`: stream `/events`
- `test_gateway_client.py`: standard-library `unittest` coverage for the Python helpers

## First-Run Requirements On The Phone

Do this once on the `Xiaomi 12X`:

1. Open the `Mi Band Gateway` app.
2. Tap `Grant Android Permissions` and allow `Nearby devices` and notification access if prompted.
3. Tap `Open Health Connect`.
4. Install or update the Health Connect provider if the phone is still on Android 13 and the app reports `provider_update_required`.
5. Tap `Grant Health Permissions`.
6. Tap `Start Gateway`.

After the first successful permission flow, the desktop scripts can start the gateway directly over `adb`.

## macOS / Linux

```bash
cd devices/mi-band-9-pro/gateway/desktop
./start_gateway_tunnel.sh
python3 poll_gateway.py
python3 stream_gateway.py
```

Override defaults if needed:

```bash
ADB_SERIAL=4722a997 GATEWAY_PORT=8765 ./start_gateway_tunnel.sh
```

## Windows PowerShell

```powershell
cd devices/mi-band-9-pro/gateway/desktop
.\start_gateway_tunnel.ps1
python poll_gateway.py
python stream_gateway.py
```

## Verified Endpoints

Base URL after tunneling:

```text
http://127.0.0.1:8765
```

- `GET /status`
- `GET /health/latest`
- `GET /events`
- `GET /debug/source`

## Current Verified Behavior On This Repo Setup

The gateway has been verified from this Mac over `adb forward` on `2026-03-15`.

Current phone-side state:

- `/status` responds successfully
- `/health/latest` responds successfully
- `/debug/source` currently reports:
  - `health_connect_status = provider_update_required`
  - `bluetooth_enabled = false`
  - `band_status = bluetooth_off`
- the gateway app runtime permissions are still:
  - `android.permission.BLUETOOTH_CONNECT = granted=false`
  - `android.permission.POST_NOTIFICATIONS = granted=false`
- the phone is currently blocked in Xiaomi Fitness on:
  - `com.mi.health/com.xiaomi.fitness.access.health_connect.HealthConnectPrivacyActivity`

That means the HTTP bridge works, but the phone still needs Android runtime permissions and a Health Connect provider update or install before heart rate, SpO2, steps, and live connection status can become non-null.

See [progress-2026-03-15.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro/progress-2026-03-15.md) for the latest verification snapshot.
