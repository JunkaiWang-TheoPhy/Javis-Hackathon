# Hue Runtime Controls and Google Readiness Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Hue plugin directly useful for common light and scene actions, add concrete Google Home / Nest readiness tooling, and wire bootstrap installation for the new plugins.

**Architecture:** Keep the repo HA-first, but allow the brand plugins to expose narrow, honest surfaces. Hue gets typed bridge actions over the local API. Google Home / Nest gets config validation and setup guidance only, because direct runtime control still depends on an app-auth flow. The bootstrap script installs the new plugin directories so local runtime setup stays aligned with the repo.

**Tech Stack:** TypeScript, OpenClaw plugins, fetch-based HTTP helpers, shell scripting, `tsx --test`

---

## Chunk 1: Failing Tests

### Task 1: Add failing Hue and Google tests

**Files:**
- Modify: `plugins/openclaw-plugin-hue/src/__tests__/hue.test.ts`
- Modify: `plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts`

- [ ] **Step 1: Add a failing Hue client test for scene listing and light state payloads**
- [ ] **Step 2: Run `npm test -- plugins/openclaw-plugin-hue/src/__tests__/hue.test.ts` and verify the new tests fail for missing helpers or tools**
- [ ] **Step 3: Add a failing Google test for config validation and OAuth checklist output**
- [ ] **Step 4: Run `npm test -- plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts` and verify the new tests fail for missing helpers or tools**

## Chunk 2: Hue Runtime Controls

### Task 2: Implement Hue client and tools

**Files:**
- Modify: `plugins/openclaw-plugin-hue/src/client.ts`
- Modify: `plugins/openclaw-plugin-hue/src/index.ts`
- Modify: `plugins/openclaw-plugin-hue/openclaw.plugin.json`

- [ ] **Step 1: Implement client helpers for scene listing and light updates**
- [ ] **Step 2: Add `hue_list_scenes`, `hue_control_light`, and `hue_activate_scene`**
- [ ] **Step 3: Re-run `npm test -- plugins/openclaw-plugin-hue/src/__tests__/hue.test.ts` and verify it passes**

## Chunk 3: Google Readiness Tooling

### Task 3: Implement Google readiness helpers and tools

**Files:**
- Modify: `plugins/openclaw-plugin-google-home/src/index.ts`
- Modify: `plugins/openclaw-plugin-google-home/openclaw.plugin.json`

- [ ] **Step 1: Implement readiness evaluation from the configured project and OAuth fields**
- [ ] **Step 2: Add `google_home_validate_config` and `google_home_oauth_checklist`**
- [ ] **Step 3: Re-run `npm test -- plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts` and verify it passes**

## Chunk 4: Bootstrap and Config Wiring

### Task 4: Wire runtime installation

**Files:**
- Modify: `scripts/bootstrap-openclaw-plugin.sh`
- Modify: `openclaw-config/openclaw.json`

- [ ] **Step 1: Add new plugin install lines to the bootstrap script**
- [ ] **Step 2: Extend sample plugin configs only as needed by the new tooling**
- [ ] **Step 3: Parse-check the updated JSON config**

## Chunk 5: Verification

### Task 5: Verify the repo state

**Files:**
- Test: `npm test -- plugins/openclaw-plugin-hue/src/__tests__/hue.test.ts plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts`
- Test: `npm test`

- [ ] **Step 1: Run the targeted plugin tests**
- [ ] **Step 2: Run the full test suite**
- [ ] **Step 3: Report exact results and any remaining gaps**
