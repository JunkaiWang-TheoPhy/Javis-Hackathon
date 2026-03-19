# Mira Release Notification Router Source Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the first runnable, release-safe `notification-router` source package into `Mira_Released_Version/services/notification-router/src/`.

**Architecture:** Keep the first release-side package self-contained. Use local contracts, a built-in default outbound policy, and local channel adapters so the release tree can stand on its own before later parity work.

**Tech Stack:** TypeScript, Node HTTP server, built-in fetch, release-side Markdown docs

---

## Chunk 1: Source Package Skeleton

### Task 1: Add release-side service source files

**Files:**
- Create: `Mira_Released_Version/services/notification-router/package.json`
- Create: `Mira_Released_Version/services/notification-router/src/types.ts`
- Create: `Mira_Released_Version/services/notification-router/src/policy/outboundPolicyTypes.ts`
- Create: `Mira_Released_Version/services/notification-router/src/policy/defaultOutboundPolicy.ts`
- Create: `Mira_Released_Version/services/notification-router/src/policy/outboundPolicyLoader.ts`
- Create: `Mira_Released_Version/services/notification-router/src/policy/outboundPolicyEvaluator.ts`
- Create: `Mira_Released_Version/services/notification-router/src/channels/openclawChannelDm.ts`
- Create: `Mira_Released_Version/services/notification-router/src/channels/resendEmail.ts`
- Create: `Mira_Released_Version/services/notification-router/src/config/routerConfig.ts`
- Create: `Mira_Released_Version/services/notification-router/src/dispatch/dispatchMessageIntent.ts`
- Create: `Mira_Released_Version/services/notification-router/src/routes/dispatchIntent.ts`
- Create: `Mira_Released_Version/services/notification-router/src/server.ts`
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/release-notification-router-package.test.ts`

- [x] **Step 1: Write the failing test**

Test path already created:

`OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/release-notification-router-package.test.ts`

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- services/notification-router/src/__tests__/release-notification-router-package.test.ts
```

Expected: fail with module-not-found for `Mira_Released_Version/services/notification-router/src/server.ts`

- [x] **Step 3: Write minimal implementation**

Add the release-side package files listed above with a self-contained default policy and a minimal HTTP server.

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- services/notification-router/src/__tests__/release-notification-router-package.test.ts
```

Expected: PASS

## Chunk 2: Documentation Alignment

### Task 2: Update release-side docs to reflect the source migration

**Files:**
- Modify: `Mira_Released_Version/services/notification-router/README.md`
- Modify: `Mira_Released_Version/services/notification-router/src/README.md`
- Modify: `Mira_Released_Version/services/notification-router/docs/runtime-contract.md`
- Modify: `Mira_Released_Version/deploy/service-notification-router/README.md`
- Create: `docs/superpowers/specs/2026-03-19-mira-release-notification-router-source-migration-design.md`
- Create: `docs/superpowers/plans/2026-03-19-mira-release-notification-router-source-migration.md`

- [ ] **Step 1: Update service README**

Document that the release tree now contains a runnable first-pass source package rather than only boundary placeholders.

- [ ] **Step 2: Update source README**

Document the self-contained first-pass design and list the concrete files now present.

- [ ] **Step 3: Update runtime contract**

Document the built-in default policy object, local type ownership, and current channel support.

- [ ] **Step 4: Update deploy README**

Describe the minimal service startup path using the release-side package and config examples.
