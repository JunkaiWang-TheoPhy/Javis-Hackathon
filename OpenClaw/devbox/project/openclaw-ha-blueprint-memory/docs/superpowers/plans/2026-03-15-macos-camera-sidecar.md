# macOS Camera Sidecar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a silent macOS webcam sidecar that emits typed ambient events, add a cloud ambient route, and enable controlled `camera.clip` escalation for the paired Mac OpenClaw node.

**Architecture:** The Mac sidecar samples locally, performs cheap gating, and emits typed ambient events only on meaningful change. The bridge service validates and interprets these events, while remote OpenClaw node media capture remains an explicit escalation path using `camera.snap` and `camera.clip`.

**Tech Stack:** TypeScript, Node test runner, OpenClaw CLI/node capture, shell scripts, JSON state files

---

## File Map

- Create: `packages/contracts/src/ambient-vision.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/__tests__/contracts.test.ts`
- Create: `services/rokid-bridge-gateway/src/routes/ambientObserve.ts`
- Modify: `services/rokid-bridge-gateway/src/server.ts`
- Modify: `services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`
- Create: `scripts/macos-camera/README.macos.md`
- Create: `scripts/macos-camera/local-macos/mac-camera-common.sh`
- Create: `scripts/macos-camera/local-macos/mac-camera-list`
- Create: `scripts/macos-camera/local-macos/mac-camera-shot`
- Create: `scripts/macos-camera/local-macos/mac-camera-loop`
- Create: `scripts/macos-camera/local-macos/mac-camera-start`
- Create: `scripts/macos-camera/local-macos/mac-camera-stop`
- Create: `scripts/macos-camera/local-macos/mac-camera-status`
- Create: `scripts/macos-camera/local-macos/mac-camera-emit-event`
- Create: `scripts/macos-camera/devbox/localmac-camera-common.sh`
- Create: `scripts/macos-camera/devbox/localmac-cam-snap`
- Create: `scripts/macos-camera/devbox/localmac-cam-clip`
- Modify: `README.md`
- Modify: `Readme/Dairy/2026-03-15-openclaw-macos-camera-access-progress.md`

## Chunk 1: Ambient contract and route

### Task 1: Add ambient vision contract

**Files:**
- Create: `packages/contracts/src/ambient-vision.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/__tests__/contracts.test.ts`

- [ ] **Step 1: Write the failing contract tests**

Add tests for:

```ts
test("accepts a valid ambient vision event", () => {
  const event = {
    schemaVersion: "0.1.0",
    sessionId: "sess-mac-001",
    observationId: "amb-0001",
    observedAt: "2026-03-15T08:00:00.000Z",
    source: {
      deviceFamily: "mac_webcam",
      deviceName: "Thomas的MacBook Air",
      appVersion: "0.1.0",
    },
    capture: {
      mode: "snapshot",
      frameRef: "cache://localmac/latest.jpg",
    },
    event: {
      changeScore: 0.32,
      personPresent: true,
      personCount: 1,
      activityState: "person_present",
      reasons: ["person_appeared"],
    },
    privacy: {
      retainFrame: false,
    },
  };
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/packages/contracts/src/__tests__/contracts.test.ts`

Expected: FAIL because ambient schema is missing

- [ ] **Step 3: Write minimal schema implementation**

Define the ambient event schema in `ambient-vision.ts` and export it via `index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/packages/contracts/src/__tests__/contracts.test.ts`

Expected: PASS

### Task 2: Add ambient observe route

**Files:**
- Create: `services/rokid-bridge-gateway/src/routes/ambientObserve.ts`
- Modify: `services/rokid-bridge-gateway/src/server.ts`
- Modify: `services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Write the failing route tests**

Add tests for:

- valid ambient event returns `200`
- low-change event returns no-op envelope
- high-change event returns an escalation envelope
- invalid ambient event returns `400`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

Expected: FAIL because route is missing

- [ ] **Step 3: Write minimal route implementation**

Implement:

- schema validation
- simple branch:
  - `changeScore < threshold` => no-op
  - otherwise => escalation envelope with `camera_snap` or `camera_clip` recommendation text

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

Expected: PASS

## Chunk 2: macOS sidecar scripts

### Task 3: Add sidecar command layout

**Files:**
- Create: `scripts/macos-camera/local-macos/mac-camera-common.sh`
- Create: `scripts/macos-camera/local-macos/mac-camera-list`
- Create: `scripts/macos-camera/local-macos/mac-camera-shot`
- Create: `scripts/macos-camera/local-macos/mac-camera-loop`
- Create: `scripts/macos-camera/local-macos/mac-camera-start`
- Create: `scripts/macos-camera/local-macos/mac-camera-stop`
- Create: `scripts/macos-camera/local-macos/mac-camera-status`
- Create: `scripts/macos-camera/local-macos/mac-camera-emit-event`

- [ ] **Step 1: Write a script-level smoke test target**

Define expected behavior:

- loop writes `latest.jpg`
- loop writes `latest.json`
- status returns loop metadata

- [ ] **Step 2: Run the smoke target and confirm it fails because scripts do not exist**

Run: `bash /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/scripts/macos-camera/local-macos/mac-camera-status`

Expected: file not found

- [ ] **Step 3: Implement minimal scripts**

Write scripts that:

- use the working OpenClaw node `camera.snap` path for one-shot capture
- maintain local cache directory
- compute a simple change score from previous and current file metadata or checksum
- emit a JSON summary file

- [ ] **Step 4: Run smoke verification**

Run:

```bash
bash /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/scripts/macos-camera/local-macos/mac-camera-shot
bash /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/scripts/macos-camera/local-macos/mac-camera-status
```

Expected: local cache and status file exist

### Task 4: Add event emitter

**Files:**
- Modify: `scripts/macos-camera/local-macos/mac-camera-emit-event`

- [ ] **Step 1: Write a failing manual test**

Run emitter without a summary file and ensure it fails clearly.

- [ ] **Step 2: Implement minimal POST logic**

POST the latest event to the bridge route with `curl`.

- [ ] **Step 3: Verify success against local bridge**

Expected: route returns `200` JSON response

## Chunk 3: Devbox wrappers and media escalation

### Task 5: Add devbox helper scripts

**Files:**
- Create: `scripts/macos-camera/devbox/localmac-camera-common.sh`
- Create: `scripts/macos-camera/devbox/localmac-cam-snap`
- Create: `scripts/macos-camera/devbox/localmac-cam-clip`

- [ ] **Step 1: Write the expected wrapper commands in docs**

Define stable operator commands for forced snap and forced clip.

- [ ] **Step 2: Implement minimal wrappers**

Wrap:

- `openclaw nodes camera snap --node <id>`
- `openclaw nodes camera clip --node <id> --duration 5000`

- [ ] **Step 3: Verify wrappers work**

Run each wrapper once and check it returns media paths or JSON status.

### Task 6: Enable `camera.clip`

**Files:**
- Modify: remote devbox `~/.openclaw/openclaw.json` outside repo
- Modify: `README.md`
- Modify: `Readme/Dairy/2026-03-15-openclaw-macos-camera-access-progress.md`

- [ ] **Step 1: Back up remote config**

Run: `ssh devbox 'cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak-$(date +%Y%m%d-%H%M%S)-camera-clip'`

- [ ] **Step 2: Expand remote allowlist**

Change node allowlist from:

```json
["camera.snap"]
```

to:

```json
["camera.snap", "camera.clip"]
```

- [ ] **Step 3: Verify clip capability**

Run a smoke clip command and confirm a media artifact is returned.

## Chunk 4: Docs and verification

### Task 7: Document runtime flow

**Files:**
- Create: `scripts/macos-camera/README.macos.md`
- Modify: `README.md`
- Modify: `Readme/Dairy/2026-03-15-openclaw-macos-camera-access-progress.md`

- [ ] **Step 1: Document local setup**

Include:

- app prerequisites
- node id
- local cache path
- start/stop/status commands

- [ ] **Step 2: Document cloud flow**

Include:

- ambient event route
- forced snap/clip wrappers
- default thresholds and intervals

- [ ] **Step 3: Document verification commands**

Include exact smoke commands and expected outputs.

### Task 8: Final verification

**Files:**
- Test: existing and new tests

- [ ] **Step 1: Run contracts tests**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/packages/contracts/src/__tests__/contracts.test.ts`

- [ ] **Step 2: Run bridge tests**

Run: `npm test -- /Users/thomasjwang/Documents/GitHub/Javis-Hackathon/0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 3: Run local sidecar smoke**

Run shot/start/status/emit commands locally.

- [ ] **Step 4: Run remote snap/clip smoke**

Run `localmac-cam-snap` and `localmac-cam-clip`.

- [ ] **Step 5: Confirm default flow**

Start sidecar, cause a scene change, and verify:

- new summary written locally
- ambient route accepts event
- cloud returns deterministic result

---

Plan complete and saved to `docs/superpowers/plans/2026-03-15-macos-camera-sidecar.md`. Ready to execute.
