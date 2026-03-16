# Hue, HomeKit, and Google-Nest HA-First Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing ecosystem registry to cover Hue, HomeKit, and Google/Nest while preserving compatibility with future direct adapters for Hue and Google/Nest.

**Architecture:** Keep Home Assistant as the execution path for this phase, but add compatibility metadata such as connection mode, future direct-adapter hints, and external IDs. This lets the current registry grow to cover new ecosystems without forcing another breaking contract change later.

**Tech Stack:** TypeScript, OpenClaw plugins, Home Assistant integrations, `tsx --test`

---

## Chunk 1: Failing Tests

### Task 1: Extend registry tests for future-compatible metadata

**Files:**
- Modify: `plugins/openclaw-plugin-ha-control/src/__tests__/ecosystem.test.ts`
- Modify: `plugins/openclaw-plugin-ha-control/src/__tests__/plugin-tools.test.ts`

- [ ] **Step 1: Write failing tests for connection metadata and new brand examples**
- [ ] **Step 2: Run the targeted tests to confirm they fail**
- [ ] **Step 3: Implement the minimal changes**
- [ ] **Step 4: Re-run the targeted tests**

## Chunk 2: Registry and Schema

### Task 2: Add forward-compatible metadata

**Files:**
- Modify: `plugins/openclaw-plugin-ha-control/src/ecosystem.ts`
- Modify: `plugins/openclaw-plugin-ha-control/src/index.ts`
- Modify: `plugins/openclaw-plugin-ha-control/openclaw.plugin.json`

- [ ] **Step 1: Add compatibility fields to the registry contracts**
- [ ] **Step 2: Surface them through list/summary tool output**
- [ ] **Step 3: Update schema validation**

## Chunk 3: Config and Guidance

### Task 3: Add Hue, HomeKit, and Google/Nest examples

**Files:**
- Modify: `openclaw-config/openclaw.json`
- Modify: `plugins/openclaw-plugin-ha-control/skills/home-assistant-control/SKILL.md`

- [ ] **Step 1: Add HA-first examples for Hue, HomeKit, and Google/Nest**
- [ ] **Step 2: Keep the examples future-compatible with direct adapter fields**
- [ ] **Step 3: Update user-facing guidance**

## Chunk 4: Verification

### Task 4: Verify

**Files:**
- Test: `npm test`

- [ ] **Step 1: Run targeted tests**
- [ ] **Step 2: Run full tests**
- [ ] **Step 3: Report actual results**
