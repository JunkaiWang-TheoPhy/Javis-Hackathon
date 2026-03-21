# Mi Band Cloud Sync Design

## Goal

Make cloud OpenClaw see the latest non-empty local Mi Band metrics by keeping the desktop bridge fresh every 10 seconds and having the remote `mi-band-bridge` plugin maintain a cached snapshot on `devbox`.

## Current State

- The local desktop bridge already reads non-empty Xiaomi Fitness data from the attached `Xiaomi 12X` over `adb`.
- The remote OpenClaw plugin can already make on-demand bridge calls with `band_get_status`, `band_get_latest`, `band_get_events`, and `band_get_alerts`.
- The local bridge default poll interval is still `60` seconds.
- The remote plugin does not yet perform background refresh or persist a cached latest snapshot into the remote workspace.

## Recommended Approach

Keep the existing architecture and add one polling layer on each side:

1. Lower the local desktop bridge polling interval from `60` to `10` seconds.
2. Extend the remote OpenClaw plugin service so it polls the local bridge every `10` seconds.
3. Cache the last successful remote snapshot in memory and mirror it into a workspace JSON file on `devbox`.
4. Make the read tools prefer the cache when it exists, while still falling back to direct bridge calls.

This is the smallest change set that gives cloud OpenClaw an always-fresh view of local band data without adding SSE or changing the bridge HTTP contract.

## Data Flow

1. `bridge_server.py` polls the attached phone every `10` seconds and updates the local bridge snapshot.
2. `start_tunnel.sh` exposes the local bridge through the existing HTTPS tunnel.
3. The remote `mi-band-bridge` plugin service polls `/v1/band/status`, `/v1/band/latest`, and `/v1/band/alerts`.
4. The plugin stores the last successful payload in memory and writes a workspace cache file such as `MI_BAND_LATEST.json`.
5. Cloud OpenClaw tools read the cached payload immediately, and fall back to direct bridge calls if no cache exists yet.

## Files To Change

- `tools/mi_band_desktop_bridge/bridge_config.json`
  - reduce `poll_seconds` to `10`
- `tools/mi_band_desktop_bridge/openclaw_band_plugin/index.mjs`
  - add cache state, periodic refresh, workspace snapshot persistence, and cache-aware tool behavior
- `tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json`
  - add config schema for remote poll interval and cache file path
- `tools/mi_band_desktop_bridge/deploy_remote.py`
  - write the new remote plugin config defaults into `openclaw.json`
- `tools/mi_band_desktop_bridge/README.md`
  - document the 10-second sync and remote cache behavior

## Testing

- Add plugin unit tests with `node:test` to cover:
  - config resolution
  - cache refresh writing the workspace JSON
  - tools returning cached data when available
- Re-run the one-shot local collector:
  - `python3 tools/mi_band_desktop_bridge/bridge_server.py --once`
- Re-run the plugin unit tests:
  - `node --test tools/mi_band_desktop_bridge/openclaw_band_plugin/*.test.mjs`
- If deployment succeeds, verify from `devbox` that the workspace JSON updates and the plugin still answers tool calls.

## Non-Goals

- No SSE or websocket streaming in this change.
- No new Android-side collection path.
- No rewrite of the Xiaomi log parser.
