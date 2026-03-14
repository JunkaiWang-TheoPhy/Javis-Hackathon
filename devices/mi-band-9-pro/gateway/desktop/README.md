# Desktop Gateway Usage

This directory is for desktop-side helpers that talk to the Android gateway running on the `Xiaomi 12X`.

## Expected Local Endpoints

- `GET /status`
- `GET /health/latest`
- `GET /events`
- `GET /debug/source`

Base URL after tunneling:

```text
http://127.0.0.1:8765
```

## Tunnel Commands

Preferred:

```bash
adb reverse tcp:8765 tcp:8765
```

Fallback:

```bash
adb forward tcp:8765 tcp:8765
```

## Quick Checks

```bash
curl http://127.0.0.1:8765/status
curl http://127.0.0.1:8765/health/latest
curl -N http://127.0.0.1:8765/events
```

## Intended Helper Scripts

- `start_gateway_tunnel.sh`
- `start_gateway_tunnel.ps1`
- `poll_gateway.py`
- `stream_gateway.py`

The helper scripts will assume the current configured phone serial is `4722a997` unless overridden.
