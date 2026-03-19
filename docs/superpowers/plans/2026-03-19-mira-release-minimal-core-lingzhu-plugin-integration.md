# Mira Release Minimal Core Lingzhu Plugin Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the minimal-core release path so it explicitly includes the release-safe Lingzhu core plugin package.

**Architecture:** Reuse the existing `plugins.entries.lingzhu` config shape, add a release-safe plugin block to `openclaw.example.json`, and update the minimal-core, deploy, and core config docs to point at the migrated package.

**Tech Stack:** JSON, Markdown

---

### Task 1: Update release-safe config wiring

**Files:**
- Modify: `Mira_Released_Version/core/openclaw-config/openclaw.example.json`

- [ ] Add a `plugins.allow` entry for `lingzhu`.
- [ ] Add a release-safe `plugins.entries.lingzhu` block.
- [ ] Validate the JSON parses cleanly.

### Task 2: Update minimal-core and deploy docs

**Files:**
- Modify: `Mira_Released_Version/examples/minimal-core/README.md`
- Modify: `Mira_Released_Version/deploy/core/README.md`
- Modify: `Mira_Released_Version/core/examples/README.md`
- Modify: `Mira_Released_Version/core/openclaw-config/README.md`
- Modify: `Mira_Released_Version/core/plugins/lingzhu-bridge/README.md`

- [ ] Document that `minimal-core` now assumes a release-safe Lingzhu core plugin path.
- [ ] Explain that the config enables the plugin, but installation method is still operator-defined.
- [ ] Keep the boundary clear: core plugin package yes, live transport extension no.

### Task 3: Refresh release navigation

**Files:**
- Modify: `Mira_Released_Version/core/README.md`
- Modify: `Mira_Released_Version/readme/10-core/README.md`
- Modify: `Mira_Released_Version/README.md`

- [ ] Mention the core plugin path as part of the minimal-core story.
- [ ] Point readers to the release-safe Lingzhu package and config example together.
