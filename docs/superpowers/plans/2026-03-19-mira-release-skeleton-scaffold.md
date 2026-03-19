# Mira Release Skeleton Scaffold Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first public-repo skeleton for `Mira_Released_Version` so the release tree has stable documentation and core boundaries before larger migration work continues.

**Architecture:** Keep the work limited to structure and documentation. Create the release-side `readme/`, `core/`, `services/`, and `deploy/` scaffolds first, then update the top-level release README so the new tree is navigable as a standalone repository shell.

**Tech Stack:** Markdown documentation, repository directory structure

---

## Chunk 1: Release Portal And Core Skeleton

### Task 1: Create the release documentation portal

**Files:**
- Create: `Mira_Released_Version/readme/README.md`
- Create: `Mira_Released_Version/readme/00-overview/README.md`
- Create: `Mira_Released_Version/readme/10-core/README.md`
- Create: `Mira_Released_Version/readme/20-modules/README.md`
- Create: `Mira_Released_Version/readme/30-hardware/README.md`
- Create: `Mira_Released_Version/readme/40-deploy/README.md`
- Create: `Mira_Released_Version/readme/50-development/README.md`

- [x] Write the release portal README files with public-facing ownership and reading-path guidance.
- [x] Keep each file focused on scope, purpose, and next migration step.

### Task 2: Create the release core skeleton

**Files:**
- Create: `Mira_Released_Version/core/README.md`
- Create: `Mira_Released_Version/core/persona/README.md`
- Create: `Mira_Released_Version/core/workspace/README.md`
- Create: `Mira_Released_Version/core/openclaw-config/README.md`
- Create: `Mira_Released_Version/core/skills/README.md`
- Create: `Mira_Released_Version/core/plugins/README.md`
- Create: `Mira_Released_Version/core/examples/README.md`

- [x] Write one README per core boundary.
- [x] State what each directory owns and what it must not own.

## Chunk 2: Service And Deploy Placeholders

### Task 3: Create service-side release placeholders

**Files:**
- Create: `Mira_Released_Version/services/README.md`
- Create: `Mira_Released_Version/services/notification-router/README.md`

- [x] Reserve `notification-router` as the first release-side service entry.
- [x] Make the README explicit that this is a release-facing shell, not a runtime mirror.

### Task 4: Create deploy placeholders

**Files:**
- Create: `Mira_Released_Version/deploy/README.md`
- Create: `Mira_Released_Version/deploy/minimal/README.md`
- Create: `Mira_Released_Version/hardware/README.md`
- Create: `Mira_Released_Version/examples/README.md`
- Create: `Mira_Released_Version/docs/README.md`

- [x] Reserve a minimal deploy recipe location.
- [x] Add top-level placeholders for hardware, examples, and docs.

## Chunk 3: Wire Top-Level README

### Task 5: Update release root navigation

**Files:**
- Modify: `Mira_Released_Version/README.md`

- [x] Update the release root README so it links to the new portal and skeleton directories.
- [x] Keep the release README readable as a standalone public repo entrypoint.

## Verification

- [x] Confirm the expected README files exist under `Mira_Released_Version/`.
- [x] Confirm the top-level release README links to the new sections.
