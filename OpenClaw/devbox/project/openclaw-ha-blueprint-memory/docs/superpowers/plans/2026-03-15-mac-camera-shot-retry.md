# Mac Camera Shot Retry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `mac-camera-shot` tolerate transient websocket and node flaps instead of failing immediately.

**Architecture:** Keep the fix inside the `scripts/macos-camera/local-macos/` shell layer. Add a shell regression test that simulates transient `gateway closed` and `unknown node` failures, then implement bounded retry with a small node-refresh probe between attempts.

**Tech Stack:** Bash, Node.js CLI helpers already used by the scripts, shell test harness

---

### Task 1: Add the failing shell regression test

**Files:**
- Create: `scripts/tests/mac-camera-shot-retry.test.sh`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the test and confirm it fails against the current script**

### Task 2: Implement bounded retry in the local macOS camera scripts

**Files:**
- Modify: `scripts/macos-camera/local-macos/mac-camera-common.sh`
- Modify: `scripts/macos-camera/local-macos/mac-camera-shot`

- [ ] **Step 1: Add helpers to classify transient failures and refresh node state**
- [ ] **Step 2: Retry `nodes camera snap` on transient websocket and `unknown node` failures**
- [ ] **Step 3: Keep the success path unchanged once a snap succeeds**

### Task 3: Verify the fix

**Files:**
- Verify: `scripts/tests/mac-camera-shot-retry.test.sh`
- Verify: `scripts/macos-camera/local-macos/mac-camera-shot`

- [ ] **Step 1: Run shell syntax checks**
- [ ] **Step 2: Run the regression test and confirm it passes**
- [ ] **Step 3: Run one fresh manual `mac-camera-shot` against the live local gateway and report the result exactly**
