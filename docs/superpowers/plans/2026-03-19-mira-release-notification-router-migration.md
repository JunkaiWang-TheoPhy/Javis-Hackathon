# Mira Release Notification Router Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the first release-safe notification-router materials into `Mira_Released_Version/services/notification-router/` so the service package has real extractable content.

**Architecture:** Keep this pass documentation- and template-focused. Migrate configuration as examples, add environment and contract docs, and update release navigation so the service reads like a real package without mirroring all active runtime code.

**Tech Stack:** Markdown, YAML, dotenv-style env templates, repository file structure

---

## Chunk 1: Add Release-Safe Notification Router Files

### Task 1: Create config and contract files

**Files:**
- Create: `Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml`
- Create: `Mira_Released_Version/services/notification-router/config/env.example`
- Create: `Mira_Released_Version/services/notification-router/src/README.md`
- Create: `Mira_Released_Version/services/notification-router/docs/README.md`
- Create: `Mira_Released_Version/services/notification-router/docs/runtime-contract.md`

- [x] Add a release-safe outbound policy example derived from the active router config.
- [x] Add an environment template covering DM and email channel configuration.
- [x] Add source-tree and runtime-contract READMEs.

## Chunk 2: Update Release Navigation

### Task 2: Update release service docs

**Files:**
- Modify: `Mira_Released_Version/services/notification-router/README.md`
- Modify: `Mira_Released_Version/services/README.md`
- Modify: `Mira_Released_Version/README.md`

- [x] Update the service READMEs so they point to the new config, docs, and source-boundary files.
- [x] Describe this pass as the first release-safe service-content migration.

## Verification

- [x] Confirm the new files exist under `Mira_Released_Version/services/notification-router/`.
- [x] Confirm release README surfaces link to the new notification-router files.
