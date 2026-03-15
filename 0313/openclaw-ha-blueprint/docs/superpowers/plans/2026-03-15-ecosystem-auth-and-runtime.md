# Ecosystem Auth and Runtime Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared ecosystem auth gateway, real Google auth flow support, minimal SmartThings live control, Rokid capability-registry routing, a unified support matrix, and an Alexa readiness-only plugin.

**Architecture:** A new shared auth service owns callback handling and token persistence. `google-home` becomes token-aware and auth-flow-aware. `smartthings` gains a narrow live API surface. `rokid-bridge-gateway` reuses the existing ecosystem registry model instead of hard-coded demo logic. Documentation is consolidated into a single support matrix page and a new Alexa readiness plugin.

**Tech Stack:** TypeScript, Node built-in HTTP server, JSON token store, fetch, OpenClaw plugins, `tsx --test`

---

## Chunk 1: Red Tests for Google and SmartThings

### Task 1: Add failing tests for Google auth flow and SmartThings live control

**Files:**
- Modify: `plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts`
- Modify: `plugins/openclaw-plugin-smartthings/src/__tests__/smartthings.test.ts`

- [ ] **Step 1: Add a failing Google test that expects auth URL generation and token-aware status**
- [ ] **Step 2: Add a failing SmartThings test that expects list, status, and execute tools**
- [ ] **Step 3: Run the targeted tests and verify they fail for missing functionality**

## Chunk 2: Red Tests for Auth Gateway and Rokid Routing

### Task 2: Add failing tests for the new auth gateway and registry-backed Rokid flow

**Files:**
- Create: `services/ecosystem-auth-gateway/src/__tests__/gateway.test.ts`
- Modify: `services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Add a failing auth-gateway test for Google start and callback routes**
- [ ] **Step 2: Add a failing Rokid test that expects capability-registry-backed routing**
- [ ] **Step 3: Run the targeted tests and verify they fail for the missing service and routing logic**

## Chunk 3: Google Auth Gateway and Plugin

### Task 3: Implement the shared auth gateway and Google plugin changes

**Files:**
- Create: `services/ecosystem-auth-gateway/src/server.ts`
- Create: `services/ecosystem-auth-gateway/src/store/tokenStore.ts`
- Modify: `plugins/openclaw-plugin-google-home/src/index.ts`
- Modify: `plugins/openclaw-plugin-google-home/openclaw.plugin.json`
- Modify: `openclaw-config/openclaw.json`

- [ ] **Step 1: Implement minimal token storage and Google auth routes**
- [ ] **Step 2: Add token-aware Google status and new auth tools**
- [ ] **Step 3: Re-run the targeted Google and auth-gateway tests and verify they pass**

## Chunk 4: SmartThings Minimal Live Control

### Task 4: Implement narrow SmartThings runtime tools

**Files:**
- Modify: `plugins/openclaw-plugin-smartthings/src/index.ts`
- Modify: `plugins/openclaw-plugin-smartthings/openclaw.plugin.json`

- [ ] **Step 1: Add list, status, and execute tools**
- [ ] **Step 2: Keep the command surface intentionally minimal**
- [ ] **Step 3: Re-run the targeted SmartThings tests and verify they pass**

## Chunk 5: Rokid Registry Routing

### Task 5: Replace the hard-coded coffee path with registry-backed capability routing

**Files:**
- Modify: `services/rokid-bridge-gateway/src/orchestration/openclawClient.ts`
- Modify: `services/rokid-bridge-gateway/src/orchestration/actionNormalizer.ts`
- Modify: `services/rokid-bridge-gateway/src/server.ts`
- Modify: `plugins/openclaw-plugin-rokid-bridge/src/index.ts`

- [ ] **Step 1: Reuse the capability registry resolution logic for Rokid decisions**
- [ ] **Step 2: Preserve confirmation behavior while removing hard-coded service definitions**
- [ ] **Step 3: Re-run the targeted Rokid tests and verify they pass**

## Chunk 6: Alexa and Matrix Docs

### Task 6: Add Alexa readiness and the support matrix

**Files:**
- Create: `plugins/openclaw-plugin-alexa/src/index.ts`
- Create: `plugins/openclaw-plugin-alexa/openclaw.plugin.json`
- Create: `plugins/openclaw-plugin-alexa/src/__tests__/alexa.test.ts`
- Create: `plugins/openclaw-plugin-alexa/skills/alexa-readiness/SKILL.md`
- Create: `docs/home-ecosystem-support-matrix.md`
- Modify: `scripts/bootstrap-openclaw-plugin.sh`
- Modify: `0313/openclaw-ha-blueprint/README.md`
- Modify: `docs/openclaw-ha-ecosystem-progress-2026-03-15.md`

- [ ] **Step 1: Add the Alexa readiness-only plugin**
- [ ] **Step 2: Add a unified support matrix page**
- [ ] **Step 3: Update bootstrap and docs**
- [ ] **Step 4: Run the targeted Alexa tests and verify they pass**

## Chunk 7: Full Verification

### Task 7: Verify the repo

**Files:**
- Test: `npm test -- plugins/openclaw-plugin-google-home/src/__tests__/google-home.test.ts plugins/openclaw-plugin-smartthings/src/__tests__/smartthings.test.ts services/ecosystem-auth-gateway/src/__tests__/gateway.test.ts services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts plugins/openclaw-plugin-alexa/src/__tests__/alexa.test.ts`
- Test: `npm test`

- [ ] **Step 1: Run the targeted test set**
- [ ] **Step 2: Run the full test suite**
- [ ] **Step 3: Report exact pass counts and any remaining intentional gaps**
