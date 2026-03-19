# Mira Release Skeleton Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the second public-facing layer of release-shell README files so `Mira_Released_Version/` reads more like a standalone repository.

**Architecture:** Keep the work documentation-only. Add missing top-level and second-level README entrypoints for modules, apps, examples, deploy, and docs, then update root release navigation to expose those new paths.

**Tech Stack:** Markdown documentation, repository directory structure

---

## Chunk 1: Module And App Entry Points

### Task 1: Add release-side module entrypoints

**Files:**
- Create: `Mira_Released_Version/modules/README.md`
- Create: `Mira_Released_Version/modules/home-assistant/README.md`
- Create: `Mira_Released_Version/modules/home-assistant/plugin/README.md`
- Create: `Mira_Released_Version/modules/home-assistant/docs/README.md`
- Create: `Mira_Released_Version/modules/home-assistant/registry/README.md`
- Create: `Mira_Released_Version/apps/README.md`

- [ ] Write module-level README files that explain ownership and current migration status.
- [ ] Add an `apps/` entrypoint so the release tree exposes future application surfaces explicitly.
- [x] Write module-level README files that explain ownership and current migration status.
- [x] Add an `apps/` entrypoint so the release tree exposes future application surfaces explicitly.

## Chunk 2: Example, Deploy, And Docs Entry Points

### Task 2: Add second-level release navigation for examples, deploy, and docs

**Files:**
- Create: `Mira_Released_Version/examples/minimal-core/README.md`
- Create: `Mira_Released_Version/examples/home-stack/README.md`
- Create: `Mira_Released_Version/examples/service-notification-router/README.md`
- Create: `Mira_Released_Version/deploy/core/README.md`
- Create: `Mira_Released_Version/deploy/module-home-assistant/README.md`
- Create: `Mira_Released_Version/deploy/service-notification-router/README.md`
- Create: `Mira_Released_Version/docs/architecture/README.md`
- Create: `Mira_Released_Version/docs/migration/README.md`

- [ ] Add one README per release-side sub-area.
- [ ] Keep each file explicit about scope and non-ownership.
- [x] Add one README per release-side sub-area.
- [x] Keep each file explicit about scope and non-ownership.

## Chunk 3: Wire Release Navigation

### Task 3: Update root release docs

**Files:**
- Modify: `Mira_Released_Version/README.md`
- Modify: `Mira_Released_Version/readme/README.md`
- Modify: `Mira_Released_Version/readme/20-modules/README.md`
- Modify: `Mira_Released_Version/readme/40-deploy/README.md`
- Modify: `Mira_Released_Version/readme/50-development/README.md`

- [ ] Link the new module, app, example, deploy, and docs entrypoints.
- [ ] Describe this scaffold pass as the second public-facing navigation layer.
- [x] Link the new module, app, example, deploy, and docs entrypoints.
- [x] Describe this scaffold pass as the second public-facing navigation layer.

## Verification

- [ ] Confirm the new README files exist in the expected locations.
- [ ] Confirm the root release README links to the new release-shell entrypoints.
- [x] Confirm the new README files exist in the expected locations.
- [x] Confirm the root release README links to the new release-shell entrypoints.
