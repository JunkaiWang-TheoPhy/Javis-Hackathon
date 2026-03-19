# Mira Release Core-First Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the first release-safe core files into `Mira_Released_Version/core/` and convert `core/` from a placeholder to a partially real release package.

**Architecture:** Copy stable public-safe persona and config files directly, but replace private workspace materials with sanitized templates. Update release READMEs so the new state is visible from the root release portal.

**Tech Stack:** Markdown, JSON5, repository file structure

---

## Chunk 1: Migrate first safe core files

### Task 1: Copy the direct-release-safe core files

**Files:**
- Create: `Mira_Released_Version/core/persona/SOUL.md`
- Create: `Mira_Released_Version/core/persona/IDENTITY.md`
- Create: `Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- Create: `Mira_Released_Version/core/openclaw-config/agent-defaults-snippet.json5`

- [x] Copy the stable source files into the release tree.
- [x] Keep file names stable where the source is already release-safe.

### Task 2: Add sanitized workspace templates

**Files:**
- Create: `Mira_Released_Version/core/workspace/AGENTS.md`
- Create: `Mira_Released_Version/core/workspace/MEMORY.md`
- Create: `Mira_Released_Version/core/workspace/TOOLS.md`

- [x] Replace user-specific and environment-specific details with release-safe templates.
- [x] Preserve the Mira behavior model and workspace operating intent.

## Chunk 2: Update release documentation

### Task 3: Update release readme surfaces

**Files:**
- Modify: `Mira_Released_Version/README.md`
- Modify: `Mira_Released_Version/core/README.md`
- Modify: `Mira_Released_Version/core/persona/README.md`
- Modify: `Mira_Released_Version/core/workspace/README.md`
- Modify: `Mira_Released_Version/core/openclaw-config/README.md`
- Modify: `Mira_Released_Version/readme/10-core/README.md`

- [x] Mark `core/` as partially migrated.
- [x] Point readers to the first real files now present in the release tree.

## Verification

- [x] Confirm the migrated files exist under `Mira_Released_Version/core/`.
- [x] Confirm the release README now describes `core/` as partially migrated rather than purely placeholder.
