# Mi Band 9 Pro Desktop Bridge Design

## Summary

Build a desktop-side bridge that reads `Mi Band 9 Pro` health data from the attached `Xiaomi 12X` over `adb`, serves the latest snapshot and recent events over local HTTP, and exposes bounded tools to the cloud `OpenClaw` runtime on `devbox`.

This design replaces the blocked Android-side metrics path with a Mac-side collector that can read Xiaomi Fitness logs and `logcat` directly.

## Goals

- Read the latest heart rate, SpO2, and step metrics from the attached phone.
- Expose local bounded HTTP endpoints for status, latest data, recent events, and active alerts.
- Let the cloud `OpenClaw` instance on `devbox` query the local bridge through a constrained plugin.
- Keep first version stable with `1-5 minute` freshness and event-triggered refreshes when possible.

## Non-Goals

- Direct BLE communication from the Mac to the band.
- Root-only Android access or private app sandbox reads on the phone.
- Guaranteed second-level realtime streaming.

## Known Facts

- Phone ADB serial: `4722a997`
- Band name: `Xiaomi Smart Band 9 Pro A094`
- Band MAC: `D0:AE:05:0D:A0:94`
- Band DID: `940134049`
- Official Android gateway path currently returns `null` metrics on this ROM.
- `adb logcat` already shows structured Xiaomi Fitness metric lines, including heart rate, SpO2, and daily step totals.
- Readable phone paths include:
  - `/sdcard/Android/data/com.mi.health/files/log/`
  - `/sdcard/Download/wearablelog/`

## Architecture

Data flow:

`Mi Band 9 Pro -> Xiaomi Fitness on Xiaomi 12X -> adb collectors on this Mac -> local HTTP bridge -> devbox OpenClaw plugin`

Components:

1. `ADB snapshot collector`
   - Runs shell commands through `adb -s 4722a997`
   - Reads current `logcat` evidence for metrics and connection state
   - Reads readable external Xiaomi Fitness log files when needed

2. `ADB event watcher`
   - Streams `logcat`
   - Detects sync or metric update lines
   - Triggers snapshot refreshes
   - Emits bridge events and stale-data alerts

3. `Desktop bridge service`
   - Loopback-only HTTP server on the Mac
   - Stores latest snapshot, recent events, and active alerts in memory
   - Exposes bounded read-only endpoints

4. `OpenClaw plugin`
   - Runs on `devbox`
   - Calls the local bridge over an authenticated HTTPS tunnel
   - Exposes read-only band tools to the cloud agent

## Local HTTP API

Base URL example: `http://127.0.0.1:9772`

Endpoints:

- `GET /health`
  - Simple liveness response
- `GET /v1/band/status`
  - Collector readiness, ADB connectivity, freshness, and source state
- `GET /v1/band/latest`
  - Latest band snapshot
- `GET /v1/band/events?limit=50`
  - Recent events in reverse chronological order
- `GET /v1/band/alerts?active=true`
  - Active or recent alerts
- `GET /v1/band/debug/evidence`
  - Last raw evidence snippets used to derive the snapshot

## Snapshot Model

```json
{
  "ok": true,
  "device": {
    "name": "Xiaomi Smart Band 9 Pro A094",
    "mac": "D0:AE:05:0D:A0:94",
    "did": "940134049"
  },
  "phone": {
    "adb_serial": "4722a997",
    "model": "Xiaomi 12X"
  },
  "connection": {
    "status": "bonded",
    "last_seen_at": "2026-03-15T09:20:00+08:00"
  },
  "metrics": {
    "heart_rate_bpm": 80,
    "heart_rate_at": "2026-03-15T09:20:00+08:00",
    "spo2_percent": 97,
    "spo2_at": "2026-03-15T09:19:00+08:00",
    "steps": 2288,
    "distance_m": 1420,
    "calories_kcal": 81,
    "steps_at": "2026-03-15T09:05:00+08:00"
  },
  "timestamps": {
    "source_timestamp": "2026-03-15T09:20:00+08:00",
    "bridge_timestamp": "2026-03-15T09:20:05+08:00"
  },
  "source": {
    "kind": "adb_logcat",
    "freshness_seconds": 5
  }
}
```

## Event Model

Event types:

- `band_connected`
- `band_disconnected`
- `sync_started`
- `sync_finished`
- `metric_updated`
- `collector_warning`

Each event includes:

- `id`
- `type`
- `timestamp`
- `summary`
- `details`

## Alert Model

Alert types:

- `adb_disconnected`
- `band_offline`
- `stale_metrics`
- `collector_stopped`

First version rules:

- `stale_metrics` when no metric refresh for more than 5 minutes
- `band_offline` when connection state is not `bonded` or equivalent for more than 2 minutes
- `adb_disconnected` when `adb get-state` fails

## Parsing Strategy

Priority order:

1. `logcat` lines from Xiaomi Fitness repositories with structured metric payloads
2. Readable Xiaomi Fitness external log files under `/sdcard/Android/data/com.mi.health/files/log/`
3. Archived export logs under `/sdcard/Download/wearablelog/`

The collector should prefer the newest timestamp across all sources and keep raw evidence snippets for debugging.

## Security And Exposure

- Local desktop bridge listens on loopback only.
- Remote access goes through the same tunnel pattern used by the printer bridge.
- Remote plugin is read-only.
- Remote plugin must require a bearer token.

## Verification

Minimum success criteria:

- Local bridge returns non-null heart rate, SpO2, and step metrics from the attached phone.
- Event endpoint shows at least one metric or sync event after the watcher starts.
- Remote `OpenClaw` plugin can fetch latest snapshot from `devbox`.

## Risks

- Xiaomi Fitness log formats may drift.
- `logcat` retention may be short, so file parsing must remain available as a fallback.
- Event freshness depends on Xiaomi app behavior and ADB stability.
