# Mi Band 9 Pro Desktop Bridge Implementation Plan

## Goal

Implement a desktop-side `adb` collector and loopback HTTP bridge that exposes `Mi Band 9 Pro` health data to the cloud `OpenClaw` runtime on `devbox`.

## Task 1: Add parsers and tests

- Create parser module for Xiaomi Fitness metric lines and connection/sync evidence.
- Add tests for heart rate, SpO2, steps, connection state, event extraction, and stale-data handling.

Verification:

```bash
cd /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/.worktrees/feature-mi-band-desktop-bridge
python3 -m unittest discover -s tests/mi_band_desktop_bridge -p 'test_*.py'
```

## Task 2: Add local desktop bridge service

- Create a Python service that:
  - runs `adb` commands for snapshot refreshes
  - tails `logcat` for events
  - stores latest snapshot, recent events, active alerts, and debug evidence
  - serves read-only HTTP endpoints on loopback
- Reuse the current band profile data already recorded in the repo.

Verification:

```bash
cd /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/.worktrees/feature-mi-band-desktop-bridge
python3 -m unittest discover -s tests/mi_band_desktop_bridge -p 'test_*.py'
python3 tools/mi_band_desktop_bridge/bridge_server.py --once
```

## Task 3: Add desktop scripts and docs

- Add start scripts for the local bridge.
- Add client helpers for polling latest snapshot and events.
- Document local operator steps and troubleshooting.

Verification:

```bash
cd /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/.worktrees/feature-mi-band-desktop-bridge
python3 tools/mi_band_desktop_bridge/bridge_server.py --once
python3 tools/mi_band_desktop_bridge/client.py latest
```

## Task 4: Add devbox OpenClaw plugin and deployment assets

- Add a read-only OpenClaw plugin that calls the local bridge.
- Add deploy and bring-up scripts based on the printer bridge pattern.
- Record remote workspace notes for the band bridge.

Verification:

```bash
cd /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/.worktrees/feature-mi-band-desktop-bridge
python3 -m unittest discover -s tests/mi_band_desktop_bridge -p 'test_*.py'
node --test tests/mi_band_desktop_bridge/test_openclaw_plugin.mjs
```

## Task 5: End-to-end validation

- Start the local bridge against the attached `Xiaomi 12X`.
- Confirm local endpoints return non-null metrics.
- Bring up the remote plugin on `devbox`.
- Confirm the remote plugin can fetch the latest snapshot.

Verification:

```bash
cd /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/.worktrees/feature-mi-band-desktop-bridge
python3 tools/mi_band_desktop_bridge/bridge_server.py --port 9772
curl http://127.0.0.1:9772/v1/band/latest
```
