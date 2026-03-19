# Notification Router Resend Email Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real email channel to `notification-router` using Resend.

**Architecture:** Extend the router config and channel config union with a new `resend_email` adapter, add one focused end-to-end router test, then implement the minimal adapter that sends `OutboundMessageIntent` through Resend's HTTP API.

**Tech Stack:** TypeScript, Node fetch, Resend Email API

---

## Chunk 1: Add the failing test

### Task 1: Add a router test for the email channel

**Files:**
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/notification-router.test.ts`

- [ ] Add a failing test that dispatches an allowed self-checkin through the `email` channel.
- [ ] Run the targeted test and confirm failure.

## Chunk 2: Add the minimal adapter

### Task 2: Extend config and types

**Files:**
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/types.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/config/routerConfig.ts`

- [ ] Add `resend_email` config support.
- [ ] Add environment loading for Resend settings.

### Task 3: Implement the adapter

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/channels/resendEmail.ts`
- Modify: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/dispatch/dispatchMessageIntent.ts`

- [ ] Implement the smallest successful send path.
- [ ] Keep missing recipient address and non-200 provider responses explicit.

## Chunk 3: Verify

### Task 4: Run focused tests

**Files:**
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/notification-router.test.ts`
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/outbound-dispatch.test.ts`

- [ ] Run the email-channel test.
- [ ] Run router regression tests.
