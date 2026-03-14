# Direct Adapter Routing, Lutron, and SmartThings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route supported Hue intents through the direct-adapter path from `ha-control`, then add HA-first and direct-compatible Lutron and SmartThings plugin skeletons.

**Architecture:** `ha-control` becomes the policy and dispatch layer with an explicit routing mode. It uses direct execution only when an adapter is implemented and enabled. Hue gets the first real direct executor. Lutron and SmartThings remain HA-first by default while gaining registry entries, plugin boundaries, and readiness tooling for future direct integrations.

**Tech Stack:** TypeScript, OpenClaw plugins, fetch-based HTTP helpers, JSON config, `tsx --test`

---

## Chunk 1: Direct Adapter Routing Tests

### Task 1: Add failing tests for Hue direct routing

**Files:**
- Modify: `plugins/openclaw-plugin-ha-control/src/__tests__/plugin-tools.test.ts`
- Modify: `plugins/openclaw-plugin-ha-control/src/__tests__/ecosystem.test.ts`

- [ ] **Step 1: Add a failing test for `home_execute_intent` routing a Hue light through the direct adapter in `auto` mode**
- [ ] **Step 2: Add a failing test for HA fallback when direct Hue config is disabled or incomplete**
- [ ] **Step 3: Add a failing test for `direct_adapter` mode rejecting unsupported adapters**
- [ ] **Step 4: Run the targeted `ha-control` tests and verify they fail for the missing routing logic**

## Chunk 2: Hue Routing Implementation

### Task 2: Implement direct Hue dispatch in `ha-control`

**Files:**
- Modify: `plugins/openclaw-plugin-ha-control/src/ecosystem.ts`
- Modify: `plugins/openclaw-plugin-ha-control/src/index.ts`

- [ ] **Step 1: Add a dispatch-plan helper that carries adapter metadata without breaking existing execution resolution**
- [ ] **Step 2: Add routing preference parsing to `home_execute_intent`**
- [ ] **Step 3: Implement the minimal direct Hue executor and fallback behavior**
- [ ] **Step 4: Re-run the targeted `ha-control` tests and verify they pass**

## Chunk 3: Lutron and SmartThings Skeleton Tests

### Task 3: Add failing tests for the new plugin skeletons

**Files:**
- Create: `plugins/openclaw-plugin-lutron/src/__tests__/lutron.test.ts`
- Create: `plugins/openclaw-plugin-smartthings/src/__tests__/smartthings.test.ts`

- [ ] **Step 1: Add failing tests for Lutron readiness tool registration and validation output**
- [ ] **Step 2: Add failing tests for SmartThings readiness tool registration and validation output**
- [ ] **Step 3: Run the targeted tests and verify they fail for the missing plugins**

## Chunk 4: Lutron and SmartThings Skeletons

### Task 4: Implement the new plugin skeletons

**Files:**
- Create: `plugins/openclaw-plugin-lutron/*`
- Create: `plugins/openclaw-plugin-smartthings/*`
- Modify: `openclaw-config/openclaw.json`
- Modify: `scripts/bootstrap-openclaw-plugin.sh`

- [ ] **Step 1: Add the Lutron plugin package, schema, skill, index, and tests**
- [ ] **Step 2: Add the SmartThings plugin package, schema, skill, index, and tests**
- [ ] **Step 3: Extend sample ecosystem and plugin config entries**
- [ ] **Step 4: Update bootstrap installation script**
- [ ] **Step 5: Re-run the targeted plugin tests and verify they pass**

## Chunk 5: Verification

### Task 5: Verify the full repo

**Files:**
- Test: `npm test -- plugins/openclaw-plugin-ha-control/src/__tests__/plugin-tools.test.ts plugins/openclaw-plugin-ha-control/src/__tests__/ecosystem.test.ts plugins/openclaw-plugin-lutron/src/__tests__/lutron.test.ts plugins/openclaw-plugin-smartthings/src/__tests__/smartthings.test.ts scripts/__tests__/bootstrap-openclaw-plugin.test.ts`
- Test: `npm test`

- [ ] **Step 1: Run the targeted test set**
- [ ] **Step 2: Run the full test suite**
- [ ] **Step 3: Report exact results and any remaining gaps**
