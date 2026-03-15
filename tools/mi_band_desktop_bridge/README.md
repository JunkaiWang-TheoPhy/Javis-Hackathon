# Mi Band Desktop Bridge

This directory contains the desktop-side bridge that reads Xiaomi Fitness data from the attached `Xiaomi 12X` over `adb`, serves local HTTP endpoints, and exposes those endpoints to the cloud `OpenClaw` runtime on `devbox`.

## Why This Exists

The Android gateway app path on this `Xiaomi 12X / HyperOS` setup can expose connection state, but it cannot reliably read non-null health metrics because Xiaomi-local providers are private and the app sandbox cannot read Xiaomi Fitness logs.

The desktop bridge avoids that limitation by reading `adb logcat` and readable external Xiaomi Fitness logs directly from the Mac.

## What It Reads

- heart rate
- SpO2
- steps
- distance
- calories
- Bluetooth and bonded-device state
- recent sync events and collector warnings

## Files

- `bridge_config.json`: local bridge defaults and stable device metadata
- `parser.py`: Xiaomi Fitness metric and event parsers
- `bridge_server.py`: local loopback HTTP service
- `client.py`: read-only desktop client for local bridge endpoints
- `wireless_adb.py`: optional wireless ADB helper, kept disabled by default
- `start_bridge.sh`: run the local bridge
- `start_tunnel.sh`: expose the local bridge through a public HTTPS tunnel
- `deploy_remote.py`: install or refresh the remote OpenClaw plugin on `devbox`
- `openclaw_band_plugin/`: remote read-only OpenClaw plugin

## Local Endpoints

Base URL:

```text
http://127.0.0.1:9782
```

- `GET /health`
- `GET /v1/band/status`
- `GET /v1/band/latest`
- `GET /v1/band/events?limit=50`
- `GET /v1/band/alerts?active=true`
- `GET /v1/band/debug/evidence`

All `/v1/...` endpoints require:

```text
Authorization: Bearer $OPENCLAW_MI_BAND_BRIDGE_TOKEN
```

## Optional Wireless ADB

Wireless ADB support now exists, but it is not enabled by default.

The bridge still stays on USB unless you do one of these later:

- export `OPENCLAW_MI_BAND_ADB_TARGET=host:port`
- or set `wireless_adb.enabled` to `true` in `bridge_config.json`

Current default config keeps:

- `wireless_adb.enabled = false`
- `wireless_adb.host = ""`
- active bridge transport on this machine = `usb`

The helper script does not switch the bridge by itself:

```bash
python3 tools/mi_band_desktop_bridge/wireless_adb.py status
python3 tools/mi_band_desktop_bridge/wireless_adb.py pair --pair-code 123456 --target 192.168.1.8:37063
python3 tools/mi_band_desktop_bridge/wireless_adb.py connect --target 192.168.1.8:5555
python3 tools/mi_band_desktop_bridge/wireless_adb.py disconnect --target 192.168.1.8:5555
python3 tools/mi_band_desktop_bridge/wireless_adb.py print-env
```

Recommended future activation flow:

1. Fill `wireless_adb.host`, `wireless_adb.port`, and `wireless_adb.pair_port`.
2. Run `wireless_adb.py pair`.
3. Run `wireless_adb.py connect`.
4. Export the target from `wireless_adb.py print-env`.
5. Restart the local bridge.

Until you do that, the bridge continues using the USB serial target only.

## Local Usage

Set a bridge token:

```bash
export OPENCLAW_MI_BAND_BRIDGE_TOKEN=test-token
```

Start the service:

```bash
zsh tools/mi_band_desktop_bridge/start_bridge.sh
```

Read the latest snapshot:

```bash
python3 tools/mi_band_desktop_bridge/client.py latest --token "$OPENCLAW_MI_BAND_BRIDGE_TOKEN"
```

One-shot collector run without starting the server:

```bash
python3 tools/mi_band_desktop_bridge/bridge_server.py --once
```

## Devbox OpenClaw Usage

Start the public tunnel:

```bash
zsh tools/mi_band_desktop_bridge/start_tunnel.sh
```

Deploy the plugin to `devbox`:

```bash
python3 tools/mi_band_desktop_bridge/deploy_remote.py
```

The deploy script:

- creates or reuses `~/.openclaw-mi-band-bridge.env`
- reads the active public tunnel URL from `~/.openclaw-mi-band-bridge-tunnel.json`
- copies the plugin into `/home/devbox/.openclaw/extensions/mi-band-bridge`
- patches `/home/devbox/.openclaw/openclaw.json`
- updates remote workspace notes

## Verified On 2026-03-15

From this Mac, the bridge returned non-null metrics from the connected phone, including:

- `heart_rate_bpm = 83`
- `spo2_percent = 97`
- `steps = 2855`
- `distance_m = 1801`
- `calories_kcal = 104`

The `devbox` host also reached the public bridge URL successfully and retrieved the same snapshot, and remote OpenClaw logs show:

```text
[mi-band-bridge] bridge target https://...trycloudflare.com
```

That confirms:

- the local `adb` collector is working
- the local HTTP bridge is serving non-null metrics
- the remote `devbox` host can reach the bridge
- the `mi-band-bridge` plugin is loaded into the running OpenClaw gateway
- optional wireless ADB support is present in code, but the verified active transport remains `usb`
