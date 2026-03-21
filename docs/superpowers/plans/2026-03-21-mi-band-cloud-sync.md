# Mi Band Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cloud OpenClaw receive refreshed Mi Band health data every 10 seconds from the local desktop bridge and persist the latest remote snapshot on `devbox`.

**Architecture:** Keep the existing `adb -> local bridge -> tunnel -> remote OpenClaw plugin` path. Tighten the local bridge poll interval to 10 seconds, add a background refresh loop inside the remote plugin, and write the latest successful cached payload into the remote workspace so cloud OpenClaw has a stable latest snapshot even between direct bridge reads.

**Tech Stack:** Python 3, Node.js ESM, OpenClaw plugin API, `node:test`, existing bridge HTTP endpoints

---

## Chunk 1: Remote Plugin Cache Loop

### Task 1: Add failing plugin tests for cache refresh and cache-backed reads

**Files:**
- Create: `tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs`
- Modify: `tools/mi_band_desktop_bridge/openclaw_band_plugin/index.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

test("service refresh writes latest snapshot cache file", async () => {
  assert.equal(typeof global.fetch, "function");
  assert.fail("refresh cache helpers not implemented");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs`
Expected: FAIL because the cache refresh helpers and cache-backed behavior do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- plugin config fields for `pollSeconds` and `cacheFilePath`
- service-local cache state
- a refresh helper that fetches bridge endpoints and stores the latest successful payload
- file persistence for the cached payload
- tool reads that prefer cache and fall back to direct bridge calls

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs`
Expected: PASS

### Task 2: Update the remote plugin config schema

**Files:**
- Modify: `tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json`

- [ ] **Step 1: Add schema fields**

Add:
- `pollSeconds`
- `cacheFilePath`

- [ ] **Step 2: Verify schema shape**

Run: `python3 -m json.tool tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json >/dev/null`
Expected: exit `0`

## Chunk 2: Local Bridge Poll Interval

### Task 3: Tighten the local bridge refresh interval

**Files:**
- Modify: `tools/mi_band_desktop_bridge/bridge_config.json`

- [ ] **Step 1: Change the default poll interval**

Set `poll_seconds` from `60` to `10`.

- [ ] **Step 2: Verify the JSON stays valid**

Run: `python3 -m json.tool tools/mi_band_desktop_bridge/bridge_config.json >/dev/null`
Expected: exit `0`

## Chunk 3: Remote Deploy Defaults and Docs

### Task 4: Teach remote deploy to write the new plugin defaults

**Files:**
- Modify: `tools/mi_band_desktop_bridge/deploy_remote.py`

- [ ] **Step 1: Write the failing test surrogate**

Use a focused code-reading assertion:
- the script currently writes only `bridgeBaseUrl` and `bridgeToken`
- the updated deploy must also write `pollSeconds` and `cacheFilePath`

- [ ] **Step 2: Implement the deploy config patch**

Patch the generated remote config so the plugin entry contains:
- `pollSeconds: 10`
- `cacheFilePath: /home/devbox/.openclaw/workspace/MI_BAND_LATEST.json`

- [ ] **Step 3: Verify the script still parses**

Run: `python3 -m py_compile tools/mi_band_desktop_bridge/deploy_remote.py`
Expected: exit `0`

### Task 5: Document the new sync behavior

**Files:**
- Modify: `tools/mi_band_desktop_bridge/README.md`

- [ ] **Step 1: Update the usage notes**

Document:
- local bridge now polls every 10 seconds
- remote plugin now refreshes every 10 seconds
- latest snapshot is mirrored into remote workspace JSON

- [ ] **Step 2: Review for consistency**

Run: `rg -n "10 seconds|MI_BAND_LATEST.json|poll_seconds" tools/mi_band_desktop_bridge/README.md`
Expected: the new behavior appears in the README.

## Chunk 4: End-to-End Verification

### Task 6: Re-run local and plugin verification

**Files:**
- Test: `tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs`

- [ ] **Step 1: Run plugin tests**

Run: `node --test tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs`
Expected: PASS

- [ ] **Step 2: Run the local bridge collector**

Run: `python3 tools/mi_band_desktop_bridge/bridge_server.py --once`
Expected: non-null `heart_rate_bpm`, `spo2_percent`, and `steps`

- [ ] **Step 3: If available, deploy and verify remote plugin**

Run:
- `zsh tools/mi_band_desktop_bridge/start_tunnel.sh`
- `python3 tools/mi_band_desktop_bridge/deploy_remote.py`

Expected:
- remote plugin deploy succeeds
- remote workspace gets `MI_BAND_LATEST.json`

- [ ] **Step 4: Commit**

```bash
git add docs/plans/2026-03-21-mi-band-cloud-sync-design.md \
  docs/superpowers/plans/2026-03-21-mi-band-cloud-sync.md \
  tools/mi_band_desktop_bridge/bridge_config.json \
  tools/mi_band_desktop_bridge/deploy_remote.py \
  tools/mi_band_desktop_bridge/openclaw_band_plugin/index.mjs \
  tools/mi_band_desktop_bridge/openclaw_band_plugin/index.test.mjs \
  tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json \
  tools/mi_band_desktop_bridge/README.md
git commit -m "feat: add 10s mi band cloud sync cache"
```
