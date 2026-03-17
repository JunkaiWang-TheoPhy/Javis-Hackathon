# Outbound Policy Evaluation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first real `allow / ask / block` outbound-policy evaluation path to `rokid-bridge-gateway` by loading `config/outbound-policy.yaml`, evaluating outbound intents, and exposing a minimal HTTP endpoint.

**Architecture:** Keep the first version narrow. Add a small outbound-policy module inside `services/rokid-bridge-gateway/src` that loads the YAML config, evaluates a normalized outbound intent against the rule set, and exposes a `POST /v1/outbound/evaluate` route. Do not wire actual delivery yet; this step only produces policy decisions with reasons.

**Tech Stack:** TypeScript, `tsx --test`, Node HTTP server, YAML config

---

## Chunk 1: Tests And Runtime Skeleton

### Task 1: Add failing tests for outbound-policy evaluation

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/outbound-policy.test.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Write a failing policy test for `user_self_reminder = allow`**
- [ ] **Step 2: Run the single test to confirm it fails because the evaluator does not exist**
- [ ] **Step 3: Write a failing policy test for `user_self_checkin = allow`**
- [ ] **Step 4: Write a failing policy test for `caregiver_escalation = ask`**
- [ ] **Step 5: Write a failing policy test for `new_recipient_requires_confirmation = ask`**
- [ ] **Step 6: Write a failing route test for `POST /v1/outbound/evaluate`**
- [ ] **Step 7: Run the targeted tests and confirm the missing behavior fails clearly**

### Task 2: Define narrow runtime file boundaries

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyTypes.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyLoader.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyEvaluator.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/routes/outboundEvaluate.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/server.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/package.json`

- [ ] **Step 1: Add a YAML parser dependency if needed**
- [ ] **Step 2: Define normalized outbound intent and decision result types**
- [ ] **Step 3: Define a loader that reads `config/outbound-policy.yaml`**
- [ ] **Step 4: Define an evaluator entry point that returns `allow / ask / block` with reasons**

## Chunk 2: Minimal Implementation

### Task 3: Implement the smallest evaluator that passes the four core rules

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyTypes.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyLoader.ts`
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/outboundPolicyEvaluator.ts`

- [ ] **Step 1: Load the YAML config into a typed runtime object**
- [ ] **Step 2: Normalize route inputs into a stable outbound intent**
- [ ] **Step 3: Implement exact-match evaluation for the four core contrast rules**
- [ ] **Step 4: Fall back to default `ask` when no allow rule matches**
- [ ] **Step 5: Return decision metadata including matched rule and reasons**
- [ ] **Step 6: Run tests and make sure the evaluator tests pass**

### Task 4: Add a first gateway route

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/routes/outboundEvaluate.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/server.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Accept `POST /v1/outbound/evaluate` with a JSON body containing an outbound intent**
- [ ] **Step 2: Validate the required fields narrowly**
- [ ] **Step 3: Run the evaluator and return a JSON decision**
- [ ] **Step 4: Verify the route test passes**

## Chunk 3: Verification

### Task 5: Run targeted verification

**Files:**
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/outbound-policy.test.ts`
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Run the outbound-policy tests**
Run: `npm test -- services/rokid-bridge-gateway/src/__tests__/outbound-policy.test.ts`

- [ ] **Step 2: Run the route tests**
Run: `npm test -- services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 3: Run both together**
Run: `npm test -- services/rokid-bridge-gateway/src/__tests__/outbound-policy.test.ts services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 4: Confirm the route returns real `allow / ask / block` decisions backed by the YAML file**
