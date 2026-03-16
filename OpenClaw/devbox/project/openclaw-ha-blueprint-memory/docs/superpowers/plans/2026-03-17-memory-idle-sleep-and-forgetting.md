# Memory Idle Sleep And Forgetting Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatic sleep and forgetting cycle that runs after two hours without a user request to Claw, consolidates memory, and keeps low-value noise out of long-term recall.

**Architecture:** Extend the existing SQLite-backed memory ledger with runtime state, add an idle-sleep controller that drives the existing consolidator, wire server routes to record user requests, and expose a small HTTP/script surface for periodic checks. Keep the existing memory context retrieval path intact and make the new behavior observable through tests and structured responses.

**Tech Stack:** TypeScript, Node `node:test`, Node `sqlite`, existing bridge-gateway HTTP server

---

## Chunk 1: Runtime State And Idle Controller

### Task 1: Add runtime state persistence

**Files:**
- Create: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/memory/memoryRuntimeState.ts`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/memory/memoryLedger.ts`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/memory/sqliteMemoryLedger.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/memory-ledger.test.ts`

- [ ] Write failing tests for reading and updating runtime state.
- [ ] Run the focused ledger test to confirm failure.
- [ ] Implement runtime state types and SQLite storage.
- [ ] Re-run the focused ledger test to confirm pass.

### Task 2: Add the idle sleep controller

**Files:**
- Create: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/memory/memoryIdleSleepController.ts`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/memory/memorySleepConsolidator.ts`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/store/transientMemory.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/memory-sleep.test.ts`

- [ ] Write failing tests for skip-before-threshold, sleep-after-threshold, and pending-confirmation suppression.
- [ ] Run the focused sleep tests to confirm failure.
- [ ] Implement idle sleep orchestration and stronger forgetting behavior for low-value noise.
- [ ] Re-run the focused sleep tests to confirm pass.

## Chunk 2: HTTP Wiring And Scheduler Surface

### Task 3: Wire user-request tracking into server routes

**Files:**
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/server.ts`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/routes/memoryIngest.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] Write failing integration tests for runtime state updates from direct user-facing routes and chat ingest events.
- [ ] Run the focused bridge test cases to confirm failure.
- [ ] Implement request-touch wiring.
- [ ] Re-run the focused bridge test cases to confirm pass.

### Task 4: Add an auto-sleep check endpoint and script

**Files:**
- Create: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/routes/memoryAutoSleep.ts`
- Create: `openclaw/devbox/project/openclaw-ha-blueprint-memory/scripts/run-memory-idle-sleep-check.sh`
- Modify: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/server.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] Write a failing integration test for the idle auto-sleep endpoint.
- [ ] Run the focused bridge test to confirm failure.
- [ ] Implement the route and scheduler script.
- [ ] Re-run the focused bridge test to confirm pass.

## Chunk 3: Verification

### Task 5: Run focused verification

**Files:**
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/memory-ledger.test.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/memory-sleep.test.ts`
- Test: `openclaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] Run the focused memory test files with `npm test -- services/rokid-bridge-gateway/src/__tests__/memory-ledger.test.ts services/rokid-bridge-gateway/src/__tests__/memory-sleep.test.ts services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`.
- [ ] If they pass, summarize the exact verification evidence.
- [ ] If they fail, fix the failures before claiming completion.
