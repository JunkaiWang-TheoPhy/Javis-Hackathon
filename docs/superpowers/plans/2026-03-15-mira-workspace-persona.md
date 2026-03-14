# Mira Workspace Persona Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the cloud OpenClaw workspace so Mira behaves like a gentle proactive companion, then sync the same workspace files into the repo as source of truth.

**Architecture:** Edit the active runtime persona files locally after pulling them from the devbox, push them back to the remote workspace, and mirror the final versions into `Mira_v1/openclaw-workspace/`. Keep the changes scoped to persona and operating-guidance files only.

**Tech Stack:** Markdown, SSH/SCP, local patch-based editing

---

## Chunk 1: Planning Documents

### Task 1: Record the design and plan in the repo

**Files:**
- Create: `docs/superpowers/specs/2026-03-15-mira-workspace-persona-design.md`
- Create: `docs/superpowers/plans/2026-03-15-mira-workspace-persona.md`

- [ ] **Step 1: Write the design doc**
- [ ] **Step 2: Write the implementation plan**
- [ ] **Step 3: Verify both files exist**

Run: `ls docs/superpowers/specs docs/superpowers/plans`
Expected: both new files are listed

## Chunk 2: Runtime Persona Update

### Task 2: Pull the active workspace persona files from the devbox

**Files:**
- Read: `/home/devbox/.openclaw/workspace/SOUL.md`
- Read: `/home/devbox/.openclaw/workspace/AGENTS.md`
- Read: `/home/devbox/.openclaw/workspace/IDENTITY.md`
- Create: `tmp/remote-openclaw-workspace/SOUL.md`
- Create: `tmp/remote-openclaw-workspace/AGENTS.md`
- Create: `tmp/remote-openclaw-workspace/IDENTITY.md`

- [ ] **Step 1: Copy the three files locally with `scp`**
- [ ] **Step 2: Read the local copies and confirm current content**

### Task 3: Rewrite the persona files locally

**Files:**
- Modify: `tmp/remote-openclaw-workspace/SOUL.md`
- Modify: `tmp/remote-openclaw-workspace/AGENTS.md`
- Modify: `tmp/remote-openclaw-workspace/IDENTITY.md`

- [ ] **Step 1: Replace generic assistant language in `SOUL.md` with Mira-specific voice**
- [ ] **Step 2: Add Mira operating principles to `AGENTS.md` without removing safety rules**
- [ ] **Step 3: Update `IDENTITY.md` vibe and role**
- [ ] **Step 4: Review the local files for tone consistency**

## Chunk 3: Remote Sync and Repo Mirror

### Task 4: Push the updated files back to the devbox

**Files:**
- Modify: `/home/devbox/.openclaw/workspace/SOUL.md`
- Modify: `/home/devbox/.openclaw/workspace/AGENTS.md`
- Modify: `/home/devbox/.openclaw/workspace/IDENTITY.md`

- [ ] **Step 1: Upload the edited local files to the remote workspace**
- [ ] **Step 2: Read the remote files back over SSH**
- [ ] **Step 3: Confirm the remote content matches the local content**

### Task 5: Mirror the same files into the repo

**Files:**
- Create: `Mira_v1/openclaw-workspace/SOUL.md`
- Create: `Mira_v1/openclaw-workspace/AGENTS.md`
- Create: `Mira_v1/openclaw-workspace/IDENTITY.md`

- [ ] **Step 1: Copy the final local files into the repo mirror directory**
- [ ] **Step 2: Verify the mirror files exist**

### Task 6: Final verification

**Files:**
- Verify: `tmp/remote-openclaw-workspace/SOUL.md`
- Verify: `tmp/remote-openclaw-workspace/AGENTS.md`
- Verify: `tmp/remote-openclaw-workspace/IDENTITY.md`
- Verify: `Mira_v1/openclaw-workspace/SOUL.md`
- Verify: `Mira_v1/openclaw-workspace/AGENTS.md`
- Verify: `Mira_v1/openclaw-workspace/IDENTITY.md`

- [ ] **Step 1: Compare local edited files against repo mirror**

Run: `diff -u tmp/remote-openclaw-workspace/SOUL.md Mira_v1/openclaw-workspace/SOUL.md`
Expected: no output

- [ ] **Step 2: Compare the other two files**

Run: `diff -u tmp/remote-openclaw-workspace/AGENTS.md Mira_v1/openclaw-workspace/AGENTS.md && diff -u tmp/remote-openclaw-workspace/IDENTITY.md Mira_v1/openclaw-workspace/IDENTITY.md`
Expected: no output

- [ ] **Step 3: Check git status for only the intended repo changes**

Run: `git status --short`
Expected: new docs and `Mira_v1/openclaw-workspace/` changes are visible
