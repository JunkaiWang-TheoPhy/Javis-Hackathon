# OpenClaw Devbox Mira Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Download the Mira/OpenClaw-related assets from the devbox into the local `openclaw/` folder while excluding the OpenClaw core runtime, dependency caches, and temporary files.

**Architecture:** Inspect the live devbox layout first, classify source directories into keep vs exclude, then sync only the relevant trees into a mirrored local structure under `openclaw/`. Preserve runtime state that matters to Mira such as workspace files, skills, plugins, device pairings, memory databases, and session history, but omit build artifacts, logs, caches, backups, and bundled dependency directories.

**Tech Stack:** SSH, rsync, Markdown, shell utilities

---

## Chunk 1: Source Classification

### Task 1: Identify the remote trees that belong to Mira/OpenClaw

**Files:**
- Read: `/home/devbox/.openclaw/workspace/**`
- Read: `/home/devbox/.openclaw/extensions/**`
- Read: `/home/devbox/.openclaw/agents/main/**`
- Read: `/home/devbox/.openclaw/memory/**`
- Read: `/home/devbox/.openclaw/devices/**`
- Read: `/home/devbox/.openclaw/identity/**`
- Read: `/home/devbox/.openclaw/cron/jobs.json`
- Read: `/home/devbox/.openclaw/openclaw.json`
- Read: `/home/devbox/.openclaw/lingzhu-public/**`
- Read: `/home/devbox/project/openclaw-ha-blueprint-memory/**`
- Read: `/home/devbox/project/Openclaw-With-Apple/**`

- [ ] **Step 1: List the remote directory trees and sizes**
- [ ] **Step 2: Mark runtime source-of-truth content to keep**
- [ ] **Step 3: Mark OpenClaw core, dependency installs, logs, caches, and backups to exclude**

Run: `ssh devbox 'find /home/devbox/.openclaw -maxdepth 2 -mindepth 1 | sort'`
Expected: remote OpenClaw structure is visible for classification

## Chunk 2: Local Mirror Setup

### Task 2: Create the local target and write the sync manifest

**Files:**
- Create: `openclaw/`
- Create: `openclaw/SYNC_MANIFEST.md`

- [ ] **Step 1: Create the local `openclaw/` directory if needed**
- [ ] **Step 2: Record included source trees and exclusion rules in `openclaw/SYNC_MANIFEST.md`**

Run: `find openclaw -maxdepth 2 -mindepth 1 | sort`
Expected: manifest file exists before file sync starts

## Chunk 3: Remote Sync

### Task 3: Sync the OpenClaw runtime assets

**Files:**
- Create: `openclaw/devbox/.openclaw/workspace/**`
- Create: `openclaw/devbox/.openclaw/extensions/**`
- Create: `openclaw/devbox/.openclaw/agents/main/**`
- Create: `openclaw/devbox/.openclaw/memory/**`
- Create: `openclaw/devbox/.openclaw/devices/**`
- Create: `openclaw/devbox/.openclaw/identity/**`
- Create: `openclaw/devbox/.openclaw/cron/jobs.json`
- Create: `openclaw/devbox/.openclaw/openclaw.json`
- Create: `openclaw/devbox/.openclaw/lingzhu-public/**`

- [ ] **Step 1: Sync workspace files and skills**
- [ ] **Step 2: Sync plugin/extension source without node_modules or caches**
- [ ] **Step 3: Sync agent sessions, memory DBs, devices, and identity/config state**
- [ ] **Step 4: Sync Lingzhu public bridge scripts without binaries, logs, or pid files**

### Task 4: Sync the project-side design and support repositories

**Files:**
- Create: `openclaw/devbox/project/openclaw-ha-blueprint-memory/**`
- Create: `openclaw/devbox/project/Openclaw-With-Apple/**`

- [ ] **Step 1: Sync blueprint repo content without node_modules or VCS metadata**
- [ ] **Step 2: Sync Apple integration repo content without VCS metadata**

Run: `du -sh openclaw/devbox`
Expected: local mirror contains the selected remote source trees

## Chunk 4: Verification

### Task 5: Verify the mirror and summarize exclusions

**Files:**
- Verify: `openclaw/SYNC_MANIFEST.md`
- Verify: `openclaw/devbox/.openclaw/workspace/**`
- Verify: `openclaw/devbox/.openclaw/extensions/**`
- Verify: `openclaw/devbox/.openclaw/memory/**`
- Verify: `openclaw/devbox/.openclaw/agents/main/**`
- Verify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/**`
- Verify: `openclaw/devbox/project/Openclaw-With-Apple/**`

- [ ] **Step 1: Count synced files and total size**
- [ ] **Step 2: Check representative paths for workspace, skills, plugins, sessions, memory, and blueprint docs**
- [ ] **Step 3: Confirm excluded paths such as `node_modules`, `.next`, `.cache`, logs, pids, and `.bak` were not mirrored**

Run: `find openclaw/devbox -type f | wc -l`
Expected: non-zero file count across all synced domains
