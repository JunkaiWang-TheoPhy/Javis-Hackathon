# Hue and Google-Nest Direct Skeleton Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal usable Hue direct plugin and a future-compatible Google Home/Nest plugin skeleton.

**Architecture:** Hue gets a small live client with read-only bridge and light discovery tools. Google/Nest gets a plugin boundary with config, status, and summary tools, but no fake live-control promise.

**Tech Stack:** TypeScript, OpenClaw plugins, fetch-based HTTP clients, `tsx --test`

---

## Chunk 1: Hue Tests and Helpers

### Task 1: Add failing Hue tests

**Files:**
- Create: `plugins/openclaw-plugin-hue/src/__tests__/hue.test.ts`
- Create: `plugins/openclaw-plugin-hue/src/client.ts`

- [ ] **Step 1: Write failing tests for Hue bridge URL normalization and resource extraction**
- [ ] **Step 2: Run the tests to verify they fail**
- [ ] **Step 3: Implement the minimal helper code**
- [ ] **Step 4: Re-run the tests**

## Chunk 2: Plugin Skeletons

### Task 2: Add Hue and Google plugin registration

**Files:**
- Create: `plugins/openclaw-plugin-hue/*`
- Create: `plugins/openclaw-plugin-google-home/*`

- [ ] **Step 1: Add failing tests for tool registration**
- [ ] **Step 2: Run the tests to verify they fail**
- [ ] **Step 3: Implement the minimal plugin registration**
- [ ] **Step 4: Re-run the tests**

## Chunk 3: Sample Config and Guidance

### Task 3: Add disabled sample plugin config entries

**Files:**
- Modify: `openclaw-config/openclaw.json`

- [ ] **Step 1: Add disabled Hue and Google plugin entries**
- [ ] **Step 2: Keep them out of the allowlist until enabled**

## Chunk 4: Verification

### Task 4: Verify

**Files:**
- Test: `npm test`

- [ ] **Step 1: Run targeted plugin tests**
- [ ] **Step 2: Run full tests**
- [ ] **Step 3: Report actual results**
