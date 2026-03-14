# Mi Band 9 Pro Gateway Design

## Summary

Build a first-pass gateway that runs on the connected `Xiaomi 12X` and exposes `Mi Band 9 Pro` data to a Mac or Windows computer over `HTTP + SSE`.

The band stays paired with Xiaomi's official stack on the phone. The phone acts as the bridge. The computer does not talk to the band directly.

## Goals

- Expose the latest available `heart_rate`, `spo2`, `steps`, and `connection_status` to a desktop client.
- Make the gateway usable from both macOS and Windows through `adb reverse` or `adb forward`.
- Keep the first version easy to inspect and debug with `curl`.
- Preserve device-specific information already discovered in this repo:
  - Band MAC: `D0:AE:05:0D:A0:94`
  - Band DID: `940134049`
  - Band model: `miwear.watch.n67cn`
  - Band firmware: `3.1.171`
  - Phone ADB serial: `4722a997`
  - Phone model: `Xiaomi 12X`

## Non-Goals

- Direct BLE control of the band from the computer.
- Replacing Xiaomi Fitness pairing or authentication.
- Sub-second telemetry guarantees.
- Reverse engineering Xiaomi private protocols in v1.

## Architecture

The system has three layers:

1. `Mi Band 9 Pro -> Xiaomi 12X`
   The band remains paired to the phone and Xiaomi Fitness.

2. `Xiaomi 12X -> Android gateway app`
   The app reads health metrics from `Health Connect` and reads connection state from Android Bluetooth state plus the known band identity.

3. `Android gateway app -> desktop`
   The app serves local `HTTP + SSE` on the phone. Desktop tools reach it through `adb reverse` or `adb forward`.

## Directory Layout

```text
devices/
  mi-band-9-pro/
    README.md
    device-profile.json
    connection-notes.md
    gateway/
      android-app/
      desktop/
```

## Components

### 1. Android Gateway App

Location: `devices/mi-band-9-pro/gateway/android-app/`

Responsibilities:

- Request and validate required permissions.
- Read latest `heart_rate`, `spo2`, and `steps` from `Health Connect`.
- Read `connection_status` from Android Bluetooth state using the known device MAC.
- Maintain an in-memory cached snapshot.
- Expose `HTTP` and `SSE` endpoints on `127.0.0.1:8765`.
- Run as a foreground service to reduce Xiaomi/HyperOS background kills.

### 2. Desktop Helper Scripts

Location: `devices/mi-band-9-pro/gateway/desktop/`

Responsibilities:

- Start `adb reverse` or `adb forward`.
- Verify gateway availability from the desktop.
- Provide a minimal client for both snapshot and stream testing.

### 3. Documentation

Location: `devices/mi-band-9-pro/`

Responsibilities:

- Explain setup on macOS and Windows.
- Explain permission prompts on the phone.
- Explain expected latency and failure modes.
- Explain why the computer does not directly pair to the band.

## Data Sources

### Health Metrics

Primary source: `Health Connect`

Metrics for v1:

- `heart_rate_bpm`
- `spo2_percent`
- `steps`

Reasoning:

- The current phone has Xiaomi health packages with `Health Connect` components and health write permissions.
- This avoids direct protocol work against the band.
- It is the most realistic cross-machine bridge path in the current environment.

### Connection Status

Primary source: Android Bluetooth manager state filtered by the known MAC.

Status model:

- `connected`
- `disconnected`
- `bonded`
- `unknown`

## Transport

### HTTP Endpoints

- `GET /status`
- `GET /health/latest`
- `GET /events`
- `GET /debug/source`

### Endpoint Semantics

#### `GET /status`

Returns gateway status:

- app version
- phone identity
- gateway port
- last poll time
- permission state
- Health Connect availability

#### `GET /health/latest`

Returns the last cached snapshot. This endpoint never blocks waiting for fresh data.

#### `GET /events`

Server-Sent Events stream.

Event types:

- `health_update`
- `connection_update`
- `gateway_warning`
- `keepalive`

#### `GET /debug/source`

Returns raw source availability and last-read details so failures can be diagnosed without reading app logs.

## Snapshot Schema

```json
{
  "device": {
    "name": "Xiaomi Smart Band 9 Pro A094",
    "mac": "D0:AE:05:0D:A0:94",
    "did": "940134049",
    "model": "miwear.watch.n67cn",
    "firmware": "3.1.171"
  },
  "phone": {
    "adb_serial": "4722a997",
    "model": "Xiaomi 12X"
  },
  "connection": {
    "status": "connected",
    "last_seen_at": "2026-03-15T06:20:00+08:00"
  },
  "metrics": {
    "heart_rate_bpm": 72,
    "spo2_percent": 98,
    "steps": 5312
  },
  "timestamps": {
    "source_timestamp": "2026-03-15T06:19:52+08:00",
    "gateway_timestamp": "2026-03-15T06:20:00+08:00"
  },
  "source": {
    "heart_rate": "health_connect",
    "spo2": "health_connect",
    "steps": "health_connect",
    "connection": "bluetooth_manager"
  }
}
```

## SSE Format

Example:

```text
event: health_update
data: {"metric":"heart_rate_bpm","value":72,"source_timestamp":"2026-03-15T06:19:52+08:00"}
```

## Polling and Freshness

V1 target is near-real-time, not raw live telemetry.

Polling cadence:

- health metrics: every `3s`
- connection state: every `2s`
- SSE keepalive: every `15s`

Expected freshness:

- typically `2-5s`
- depends on whether Xiaomi Fitness has already written fresh values into `Health Connect`

## Permission Model

Required on the phone:

- Health Connect read permissions for the metrics used
- notification permission
- foreground service permission flow
- ignore battery optimization

Operational note:

On Xiaomi/HyperOS, battery optimization and background restrictions are likely to break long-lived collection unless explicitly disabled for the gateway app.

## Desktop Usage

### macOS / Windows with ADB

Preferred command:

```bash
adb reverse tcp:8765 tcp:8765
```

Fallback:

```bash
adb forward tcp:8765 tcp:8765
```

Verification commands:

```bash
curl http://127.0.0.1:8765/status
curl http://127.0.0.1:8765/health/latest
curl -N http://127.0.0.1:8765/events
```

## Failure Modes

### No health data

Possible causes:

- Health Connect not installed or not enabled
- gateway permissions not granted
- Xiaomi Fitness not writing the target metrics yet

Behavior:

- fields return `null`
- `/status` and `/debug/source` report the missing source or permission state

### Band disconnected

Behavior:

- `connection.status = "disconnected"`
- health metrics remain cached until refreshed
- SSE emits `connection_update`

### Gateway killed in background

Behavior:

- desktop requests fail
- README will instruct the user to re-open the app, re-enable foreground service, and disable battery optimization

## Validation Plan

Success criteria for v1:

1. Phone app installs and launches on the current `Xiaomi 12X`.
2. Desktop can reach the gateway over `adb reverse` or `adb forward`.
3. `/status` returns a valid JSON response.
4. `/health/latest` returns the expected schema.
5. `/events` streams at least:
   - one `keepalive`
   - one `connection_update`
   - one `health_update` when data changes
6. README documents both macOS and Windows usage.

## Risks

- `Health Connect` may not update quickly enough for truly live heart-rate streaming.
- Xiaomi Fitness may expose some metrics later than expected or not at all in the chosen region/app build.
- HyperOS process management may require extra manual allow-listing.

## Recommendation

Proceed with the `HTTP + SSE` gateway using `Health Connect` for metrics and Bluetooth manager state for connectivity.

This provides the fastest path to a usable desktop bridge without destabilizing the existing phone-to-band pairing.
