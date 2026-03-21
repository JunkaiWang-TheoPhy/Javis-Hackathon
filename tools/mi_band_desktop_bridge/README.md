# Mi Band Desktop Bridge

This directory contains the desktop-side bridge that reads Xiaomi Fitness data from the attached `Xiaomi 12X` over `adb`, serves local HTTP endpoints, and exposes those endpoints to a remote `OpenClaw` runtime.

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
- `start_tunnel.sh`: expose the local bridge through either Cloudflare quick tunnels or an SSH reverse tunnel
- `deploy_remote.py`: install or refresh the remote OpenClaw plugin on a reachable SSH host
- `install_launchd.py`: install persistent user LaunchAgents for the local bridge and SSH reverse tunnel
- `openclaw_band_plugin/`: remote read-only OpenClaw plugin

## Local Endpoints

Base URL:

```text
http://127.0.0.1:9782
```

- `GET /health`
- `GET /v1/band/status`
- `GET /v1/band/latest`
- `POST /v1/band/fresh-read`
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

Current defaults:

- local bridge poll interval: `10` seconds
- local bridge cache source: Xiaomi external logs first, `adb logcat` only as fallback
- fresh-read timeout: `60` seconds
- fresh-read success rule: return a heart-rate sample that is newer than the previous one and at most `60` seconds old
- fresh-read trigger: open the exported router entry via `adb shell am start -W -n com.mi.health/.router.framework.RouterActivity -a android.intent.action.VIEW -d wearable://region.hlth.io.mi.com/applinks/heart_rate_detail_page`
- reason for the router trigger: on this Xiaomi 12X, `adb shell input` is blocked by the system, so the bridge cannot rely on simulated taps to press `开始体验`

Start the service:

```bash
zsh tools/mi_band_desktop_bridge/start_bridge.sh
```

Read the latest snapshot:

```bash
python3 tools/mi_band_desktop_bridge/client.py latest --token "$OPENCLAW_MI_BAND_BRIDGE_TOKEN"
```

Request a fresh heart-rate read with a 60-second budget:

```bash
python3 tools/mi_band_desktop_bridge/client.py fresh \
  --token "$OPENCLAW_MI_BAND_BRIDGE_TOKEN" \
  --max-wait-seconds 60
```

The local CLI timeout for `fresh` is intentionally longer than the wait budget because the bridge still needs extra time for the trigger command and repeated `adb` collection passes.

One-shot collector run without starting the server:

```bash
python3 tools/mi_band_desktop_bridge/bridge_server.py --once
```

Install persistent launchd agents on this Mac:

```bash
python3 tools/mi_band_desktop_bridge/install_launchd.py
```

This installs two user LaunchAgents under `~/Library/LaunchAgents`:

- `com.javis.openclaw.mi-band-bridge`
- `com.javis.openclaw.mi-band-tunnel`

## Remote OpenClaw Usage

The deploy script now auto-detects the remote `HOME` and `openclaw` binary over SSH, so it no longer assumes `/home/devbox`.

### Option A: SSH Reverse Tunnel

Recommended for `root@43.165.168.66` because it avoids third-party public tunnels and keeps the bridge reachable on the remote loopback only.

Start the reverse tunnel:

```bash
OPENCLAW_MI_BAND_BRIDGE_TUNNEL_PROVIDER=ssh-reverse \
OPENCLAW_MI_BAND_BRIDGE_REMOTE=root@43.165.168.66 \
OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT=19782 \
zsh tools/mi_band_desktop_bridge/start_tunnel.sh
```

This writes `http://127.0.0.1:19782` into `~/.openclaw-mi-band-bridge-tunnel.json`, and the remote host can call that loopback URL directly.

Deploy the plugin to the server:

```bash
python3 tools/mi_band_desktop_bridge/deploy_remote.py --remote root@43.165.168.66
```

### Option B: Cloudflare Quick Tunnel

If a public HTTPS tunnel is preferred and your network allows Cloudflare quick tunnels, start it with:

```bash
zsh tools/mi_band_desktop_bridge/start_tunnel.sh
```

Then deploy to the chosen remote host:

```bash
python3 tools/mi_band_desktop_bridge/deploy_remote.py --remote <user@host>
```

Current remote plugin defaults:

- refresh interval: `10` seconds
- active Mira runtime cache file: `/root/mira/.mira-runtime/mira-openclaw/openclaw-state/MI_BAND_LATEST.json`
- tool reads prefer the cached snapshot when it exists, then fall back to live bridge calls
- `band_get_fresh_latest` bypasses the cache and calls `POST /v1/band/fresh-read`

The deploy script:

- creates or reuses `~/.openclaw-mi-band-bridge.env`
- reads the active bridge URL from `~/.openclaw-mi-band-bridge-tunnel.json`
- copies the plugin into `<remote-home>/.openclaw/extensions/mi-band-bridge`
- patches `<remote-home>/.openclaw/openclaw.json`
- updates remote workspace notes
- configures remote cache sync into `MI_BAND_LATEST.json`

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
