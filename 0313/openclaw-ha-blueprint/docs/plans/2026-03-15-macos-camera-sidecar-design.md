# macOS Camera Sidecar Design

## Goal

Add a macOS-first ambient camera path for the blueprint so the local Mac webcam can run as a silent background sensor while cloud OpenClaw only reacts to meaningful changes. The default path is event-driven and low-frequency; forced snapshots and clips remain optional side channels.

## Why This Exists

The repo already has two adjacent patterns:

- `scripts/windows-camera/` proves a local-camera-to-cloud bridge is useful and practical.
- `services/rokid-bridge-gateway/` already normalizes structured visual observations into deterministic OpenClaw behavior.

What is missing is a macOS-native version that:

- does not pretend Mac webcam events are Rokid events
- does not stream raw video into the gateway
- can silently observe in the background and only escalate when change is worth attention

## Chosen Approach

Use a dedicated `macOS sidecar + ambient route + node media escalation` design.

### Architecture

```text
Mac webcam
  -> local macOS sidecar
  -> cheap gate (scene change / person presence / activity state)
  -> ambient observation event
  -> cloud bridge route
  -> optional OpenClaw node camera.snap / camera.clip
  -> agent / automation workflow
```

### Default Behavior

- The sidecar runs continuously and silently on the local Mac.
- It samples at low frequency, default `3s`.
- It emits a structured ambient event only when:
  - person presence changes
  - person count changes
  - activity state changes
  - scene change exceeds threshold
  - the heartbeat window expires
- Cloud OpenClaw does not receive every frame.
- `camera.snap` and `camera.clip` are escalation tools, not the default transport.

## Components

### 1. macOS sidecar scripts

New directory:

```text
scripts/macos-camera/
  README.macos.md
  local-macos/
    mac-camera-common.sh
    mac-camera-list
    mac-camera-shot
    mac-camera-loop
    mac-camera-start
    mac-camera-stop
    mac-camera-status
    mac-camera-emit-event
  devbox/
    localmac-camera-common.sh
    localmac-cam-pull
    localmac-cam-snap
    localmac-cam-clip
```

Responsibilities:

- local scripts own local capture and state files
- devbox scripts provide a stable wrapper for cloud workflows and operators

The first version will use OpenClaw node capture for media acquisition instead of introducing a second macOS media stack. This keeps camera permission and capture behavior aligned with the already working `OpenClaw.app`.

### 2. Ambient observation contract

Add a new contract file under `packages/contracts/src/`.

This is intentionally separate from `visual-observation.ts` because the current schema is explicitly bound to `rokid_glasses`.

The new event schema will carry:

- source metadata
- capture metadata
- event metadata
- privacy flags

Initial fields:

- `schemaVersion`
- `sessionId`
- `observationId`
- `observedAt`
- `source.deviceFamily = "mac_webcam"`
- `source.deviceName`
- `source.appVersion`
- `capture.mode = "snapshot" | "clip"`
- `capture.frameRef`
- `event.changeScore`
- `event.personPresent`
- `event.personCount`
- `event.activityState = "idle" | "person_present" | "active_motion"`
- `event.reasons[]`
- `privacy.retainFrame`

### 3. Ambient route in the bridge service

Add a dedicated route, likely `POST /v1/ambient/observe`.

Responsibilities:

- validate the new ambient schema
- perform minimal dedupe / cooldown
- return a deterministic envelope that explains whether cloud escalation is needed

The route must not change existing Rokid behavior.

### 4. Escalation policy

The cloud side decides if an ambient event is worth media capture.

Rules for v1:

- small change: acknowledge and no-op
- significant change: request `camera.snap`
- repeated activity or large change: request `camera.clip`

`camera.clip` is explicitly allowed on the remote gateway, but still constrained to the trusted Mac node.

### 5. Side-channel triggers

Two non-default triggers remain supported:

- scheduled forced capture
- webhook-triggered forced capture

These exist for:

- health checks
- demos
- manual debugging
- audits

But they do not replace the default background event-driven path.

## Trigger Rules

### Local loop

- default interval: `3s`
- local retained state:
  - last summary
  - last emitted summary
  - timestamps

### Cheap gate

Version 1 is deliberately simple and explainable:

- scene change score from downscaled image difference
- coarse person presence
- coarse person count bucket: `0`, `1`, `many`
- coarse activity state:
  - `idle`
  - `person_present`
  - `active_motion`

### Emit conditions

Emit ambient event when any of these change:

- `personPresent`
- `personCount`
- `activityState`
- `changeScore > threshold`
- `heartbeat age > 60s`

## Failure Handling

### Local sidecar failures

- camera unavailable: write status and retry with backoff
- change detector failure: degrade to frame-diff only
- event post failure: keep only the latest pending event for retry

### Cloud failures

- ambient route validation failure: return explicit `400`
- snap failure: surface and stop, no infinite retries
- clip failure: downgrade to `snap`
- node disconnected: keep event result as no-op and log reason

## Security Boundaries

- The sidecar is not a raw video uplink.
- The cloud route accepts typed ambient events, not unrestricted shell-like requests.
- `camera.snap` and `camera.clip` remain guarded by remote gateway node allowlists.
- webhook tokens stay separate from gateway auth.
- no long-term continuous video retention in v1

## Testing Strategy

### Contracts

- schema accepts valid `mac_webcam` events
- schema rejects invalid device families and malformed event payloads

### Bridge route

- `POST /v1/ambient/observe` accepts valid payloads
- invalid payload returns `400`
- low-change payload returns no-op
- high-change payload returns an escalation envelope

### Sidecar

- unit-level tests for state transitions and trigger decisions
- no requirement for a real camera in most tests

### Smoke verification

- local sidecar writes `latest.jpg` and `latest.json`
- devbox can consume the newest event
- node `camera.snap` still works
- node `camera.clip` works after allowlist expansion

## Non-Goals For v1

- raw continuous stream upload
- face recognition
- fine-grained emotion classification
- multi-camera orchestration
- long-term archival video system

## Decision Summary

The system will treat the local Mac webcam as a persistent ambient sensor, not as a chat attachment source and not as a streaming endpoint. Cloud OpenClaw will only react when the local sidecar has evidence that something meaningfully changed.
