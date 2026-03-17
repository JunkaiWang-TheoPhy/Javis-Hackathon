# Notification Router Skeleton Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first standalone `notification-router` service with typed outbound message contracts, policy evaluation, and one real dispatch path for `openclaw_channel_dm`.

**Architecture:** Add a new service under `services/notification-router/` that owns `OutboundMessageIntent` and `ChannelDeliveryResult`, reuses the existing outbound-policy evaluation logic, exposes a `POST /v1/dispatch` route, and dispatches allowed direct-message intents to a configured webhook target. Keep the first implementation small: one server, one channel adapter, one config loader, one end-to-end test file.

**Tech Stack:** TypeScript, Node HTTP server, existing YAML outbound-policy evaluator, `node:test`, built-in `fetch`

---

## Chunk 1: Service Skeleton and Contracts

### Task 1: Add failing tests for router contracts and dispatch flow

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/notification-router.test.ts`
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/notification-router.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails because the service files do not exist yet**
- [ ] **Step 3: Implement the minimal contracts and router code to satisfy the tests**
- [ ] **Step 4: Run the test again and verify it passes**

### Task 2: Add the standalone notification-router service files

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/package.json`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/types.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/config/routerConfig.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/channels/openclawChannelDm.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/dispatch/dispatchMessageIntent.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/routes/dispatchIntent.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/server.ts`

- [ ] **Step 1: Add the policy file in the future runtime location**
- [ ] **Step 2: Add `OutboundMessageIntent` and `ChannelDeliveryResult` types**
- [ ] **Step 3: Add router config loading for the direct-message webhook channel**
- [ ] **Step 4: Add the `openclaw_channel_dm` webhook adapter**
- [ ] **Step 5: Add dispatch logic that evaluates policy, resolves a channel, and dispatches only when allowed**
- [ ] **Step 6: Add the HTTP route and server wrapper**

## Chunk 2: Verification

### Task 3: Verify end-to-end behavior

**Files:**
- Verify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/notification-router.test.ts`

- [ ] **Step 1: Run the new notification-router tests**
- [ ] **Step 2: Re-run the existing outbound-policy tests to confirm compatibility**
- [ ] **Step 3: Inspect git status for the new service files**

## Expected Commands

- `npm test -- services/notification-router/src/__tests__/notification-router.test.ts`
- `npm test -- services/rokid-bridge-gateway/src/__tests__/outbound-policy.test.ts`

## Notes

- Keep the first actual channel path provider-neutral by using a webhook-backed `openclaw_channel_dm` adapter.
- Do not add email-provider dependencies in this pass.
- Keep the router independent from `rokid-bridge-gateway`; reuse outbound-policy evaluation code instead of duplicating policy semantics.
