# Mira Release Source To Release Mapping Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real migration mapping page and align the release-side boundary docs with it.

**Architecture:** Create one mapping document under `Mira_Released_Version/docs/migration/`, then update the migration, contributor, core plugin, and notification-router entrypoints to reference the same ownership and exclusion rules.

**Tech Stack:** Markdown

---

### Task 1: Add the source-to-release mapping page

**Files:**
- Create: `Mira_Released_Version/docs/migration/source-to-release-mapping.md`

- [ ] Document the current mapping for workspace, config, Lingzhu bridge, Home Assistant, and notification-router.
- [ ] Mark each row as migrated, partially migrated, or intentionally excluded.

### Task 2: Align boundary docs

**Files:**
- Modify: `Mira_Released_Version/docs/migration/README.md`
- Modify: `Mira_Released_Version/readme/50-development/contributing-and-migration.md`
- Modify: `Mira_Released_Version/core/plugins/README.md`
- Modify: `Mira_Released_Version/services/notification-router/README.md`

- [ ] Link the new mapping page from migration and contributor docs.
- [ ] Make `core/plugins` and `notification-router` explicitly describe their current migrated and excluded source boundaries.
