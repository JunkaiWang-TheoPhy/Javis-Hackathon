# Rokid Wired Auto Capture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a wired ADB-based Rokid photo capture script that shoots every 30 seconds for 10 rounds and saves each new photo locally.

**Architecture:** Add one standalone bash script under `scripts/` and one shell-based fake-adb test under `scripts/tests/`. The script will compare the newest remote camera file before and after each trigger, then pull only the newly created file into a local output directory.

**Tech Stack:** Bash, ADB, shell test harness

---

### Task 1: Add a failing fake-adb test

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/tests/rokid-wired-photo-capture.test.sh`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run it to verify the script is missing or behavior fails**
- [ ] **Step 3: Implement the minimal script**
- [ ] **Step 4: Run the test again and make it pass**

### Task 2: Implement the capture script

**Files:**
- Create: `0313/openclaw-ha-blueprint/scripts/rokid-wired-photo-capture.sh`

- [ ] **Step 1: Add device and adb validation**
- [ ] **Step 2: Add remote latest-photo detection**
- [ ] **Step 3: Add 10-round capture loop with 30-second sleeps**
- [ ] **Step 4: Add local pull of only the newly created photo**

### Task 3: Document usage

**Files:**
- Modify: `0313/openclaw-ha-blueprint/README.md`

- [ ] **Step 1: Add prerequisites and run command**
- [ ] **Step 2: Add note that camera app must stay foreground and screen awake**

Plan complete and saved to `docs/superpowers/plans/2026-03-14-rokid-wired-auto-capture.md`. Ready to execute?
