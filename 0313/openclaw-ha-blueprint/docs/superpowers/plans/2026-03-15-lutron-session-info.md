# Lutron Session Info Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `lutron_list_session_info` tool that summarizes the configured local Lutron bridge TLS session.

**Architecture:** Reuse the existing `session.ts` handshake path as the single source of truth for local bridge diagnostics. Register a new plugin tool in `index.ts` that converts the handshake result into a stable summary payload suitable for operators and future higher-level tooling.

**Tech Stack:** TypeScript, OpenClaw plugins, Node TLS, `tsx --test`

---

## Chunk 1: Red Test Coverage

### Task 1: Add failing tests for the new tool

**Files:**
- Modify: `plugins/openclaw-plugin-lutron/src/__tests__/lutron.test.ts`

- [ ] **Step 1: Add a failing registration test that expects `lutron_list_session_info` to exist**
- [ ] **Step 2: Add a failing execution test that expects a summarized session payload**
- [ ] **Step 3: Run the targeted Lutron tests and verify they fail for the missing tool**

## Chunk 2: Tool Implementation

### Task 2: Implement the session-info helper and tool registration

**Files:**
- Modify: `plugins/openclaw-plugin-lutron/src/session.ts`
- Modify: `plugins/openclaw-plugin-lutron/src/index.ts`

- [ ] **Step 1: Add a helper that converts the handshake result into a sanitized session summary**
- [ ] **Step 2: Register `lutron_list_session_info` in the plugin**
- [ ] **Step 3: Keep `lutron_test_session` behavior unchanged**
- [ ] **Step 4: Re-run the targeted Lutron tests and verify they pass**

## Chunk 3: Documentation and Verification

### Task 3: Update docs and verify the repo

**Files:**
- Modify: `plugins/openclaw-plugin-lutron/skills/lutron-direct/SKILL.md`
- Modify: `0313/openclaw-ha-blueprint/README.md`
- Modify: `docs/openclaw-ha-ecosystem-progress-2026-03-15.md`

- [ ] **Step 1: Document the new tool and its diagnostic-only boundary**
- [ ] **Step 2: Run `npm test -- plugins/openclaw-plugin-lutron/src/__tests__/lutron.test.ts`**
- [ ] **Step 3: Run `npm test`**
- [ ] **Step 4: Report exact verification results**
