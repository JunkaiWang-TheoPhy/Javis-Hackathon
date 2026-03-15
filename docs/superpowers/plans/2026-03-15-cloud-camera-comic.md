# Cloud Camera Comic Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support explicit one-shot Windows and Mac camera captures on the cloud devbox, convert each captured image into a comic-style render with a prominent lobster overlay, and save the result in the cloud `comic/` folder.

**Architecture:** Add a shared Python comic renderer plus two cloud-side wrapper commands. The Windows wrapper will trigger the existing one-shot PowerShell camera path and pull the result into the devbox cache. The Mac wrapper will call OpenClaw node camera capture, normalize the result into the devbox cache, and then invoke the same renderer. Both flows will write outputs under `~/.openclaw/workspace/comic/`.

**Tech Stack:** Python 3, Pillow, shell scripts, OpenClaw CLI, SSH

---

## Chunk 1: Planning Documents

### Task 1: Record the design and plan in the repo

**Files:**
- Create: `docs/superpowers/specs/2026-03-15-cloud-camera-comic-design.md`
- Create: `docs/superpowers/plans/2026-03-15-cloud-camera-comic.md`

- [ ] **Step 1: Write the design doc**
- [ ] **Step 2: Write the implementation plan**
- [ ] **Step 3: Verify both files exist**

Run: `ls docs/superpowers/specs docs/superpowers/plans`
Expected: the new cloud camera comic design and plan files are listed

## Chunk 2: Shared Comic Renderer

### Task 2: Write a failing test for the renderer contract

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/tests/test_generate_camera_comic.py`
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/__init__.py`

- [ ] **Step 1: Write a test for the comic prompt/theme builder**
- [ ] **Step 2: Write a test for output naming and sidecar path generation**
- [ ] **Step 3: Run the test file and verify it fails because the renderer module does not exist yet**

Run: `python3 -m unittest discover -s 0313/openclaw-ha-blueprint/scripts/camera-comic/tests -p 'test_*.py'`
Expected: FAIL with import or missing function errors

### Task 3: Implement the shared renderer

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/generate_camera_comic.py`

- [ ] **Step 1: Implement path and metadata helpers**
- [ ] **Step 2: Implement the comic-style local image transform**
- [ ] **Step 3: Implement the lobster overlay**
- [ ] **Step 4: Implement CLI arguments for source, input, metadata, and output dir**
- [ ] **Step 5: Re-run the test file**

Run: `python3 -m unittest discover -s 0313/openclaw-ha-blueprint/scripts/camera-comic/tests -p 'test_*.py'`
Expected: PASS

## Chunk 3: Cloud Wrapper Commands

### Task 4: Add a shared shell helper for comic commands

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/comic-camera-common.sh`

- [ ] **Step 1: Define cloud workspace, cache, and comic output paths**
- [ ] **Step 2: Add helpers for ensuring directories and writing metadata JSON**
- [ ] **Step 3: Add a helper to invoke the Python renderer**

### Task 5: Add the Windows one-shot comic wrapper

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/localpc-cam-comic-shot`

- [ ] **Step 1: Trigger the existing Windows one-shot PowerShell capture**
- [ ] **Step 2: Pull the fresh image into the devbox cache**
- [ ] **Step 3: Invoke the shared renderer with source `localpc`**

### Task 6: Add the Mac one-shot comic wrapper

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/localmac-cam-comic-snap`

- [ ] **Step 1: Run OpenClaw node camera snap**
- [ ] **Step 2: Parse the `MEDIA:` path and copy it into the local Mac cache**
- [ ] **Step 3: Write minimal capture metadata**
- [ ] **Step 4: Invoke the shared renderer with source `localmac`**

## Chunk 4: Remote Deployment and Runtime Verification

### Task 7: Install cloud dependencies and create the output folder

**Files:**
- Modify: `/home/devbox/.openclaw/workspace/comic/`

- [ ] **Step 1: Ensure Pillow is installed on the devbox**
- [ ] **Step 2: Create the cloud comic output directory**

Run: `ssh devbox 'python3 - <<'"'"'PY'"'"'\nimport importlib.util\nprint(bool(importlib.util.find_spec("PIL")))\nPY'`
Expected: `True`

### Task 8: Copy the commands to the devbox

**Files:**
- Modify: `/home/devbox/bin/localpc-cam-comic-shot`
- Modify: `/home/devbox/bin/localmac-cam-comic-snap`
- Modify: `/home/devbox/.openclaw/workspace/comic-tools/`

- [ ] **Step 1: Upload the shell wrappers**
- [ ] **Step 2: Upload the Python renderer**
- [ ] **Step 3: Mark the remote shell wrappers executable**

### Task 9: Real camera verification

**Files:**
- Verify: `/home/devbox/.openclaw/workspace/.cache/localmac-camera/latest.jpg`
- Verify: `/home/devbox/.openclaw/workspace/comic/`

- [ ] **Step 1: Run the Mac one-shot comic wrapper**
- [ ] **Step 2: Confirm the latest Mac cache image exists**
- [ ] **Step 3: Confirm at least one comic image and JSON sidecar were written**

Run: `ssh devbox 'ls -la ~/.openclaw/workspace/comic | sed -n "1,80p"'`
Expected: a new `*-localmac-comic.png` and matching `.json` are listed

### Task 10: Final repo verification

**Files:**
- Verify: `0313/openclaw-ha-blueprint/scripts/camera-comic/generate_camera_comic.py`
- Verify: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/comic-camera-common.sh`
- Verify: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/localpc-cam-comic-shot`
- Verify: `0313/openclaw-ha-blueprint/scripts/camera-comic/devbox/localmac-cam-comic-snap`

- [ ] **Step 1: Check git status**

Run: `git status --short`
Expected: the new cloud camera comic docs and scripts are visible without unrelated reverts
