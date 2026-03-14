# Multi-Ecosystem Home Control Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a vendor-aware, config-backed Home Assistant execution layer that supports Xiaomi-first multi-ecosystem control through constrained intents.

**Architecture:** The `ha-control` plugin will keep Home Assistant as the execution backend while adding an ecosystem registry that describes vendor devices and maps allowed intents to HA service calls. New tools will expose registry inspection and execute config-approved intents without opening arbitrary service access.

**Tech Stack:** TypeScript, OpenClaw plugins, Home Assistant REST API, `tsx --test`

---

## Chunk 1: Contracts and Tests

### Task 1: Add failing tests for ecosystem registry behavior

**Files:**
- Create: `plugins/openclaw-plugin-ha-control/src/__tests__/ecosystem.test.ts`
- Create: `plugins/openclaw-plugin-ha-control/src/ecosystem.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Implement the minimal registry helpers**
- [ ] **Step 4: Re-run the test to verify it passes**

## Chunk 2: Plugin Wiring

### Task 2: Register new capability and intent tools

**Files:**
- Modify: `plugins/openclaw-plugin-ha-control/src/index.ts`
- Modify: `plugins/openclaw-plugin-ha-control/openclaw.plugin.json`

- [ ] **Step 1: Add failing tests for tool-facing helper behavior**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Wire the plugin to use the registry helpers**
- [ ] **Step 4: Re-run the relevant tests**

## Chunk 3: Sample Configuration

### Task 3: Add Xiaomi and multi-ecosystem config skeletons

**Files:**
- Modify: `openclaw-config/openclaw.json`

- [ ] **Step 1: Add example ecosystem entries for Xiaomi, Matter, Aqara, Tuya, and SwitchBot**
- [ ] **Step 2: Validate JSON formatting through test or parse checks**

## Chunk 4: Verification

### Task 4: Run verification

**Files:**
- Test: `npm test`

- [ ] **Step 1: Run targeted ecosystem tests**
- [ ] **Step 2: Run the full project test command**
- [ ] **Step 3: Review output and report actual status**
