# Mira Release Notification Router Local Deploy Pack Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local deploy pack for the release-side `notification-router` so the release tree includes a runnable startup path, health check, and sample dispatch helper.

**Architecture:** Keep deployment local-first. Use a small set of shell scripts plus release-safe env defaults and the release-side TypeScript service entrypoint.

**Tech Stack:** Bash, TypeScript via `tsx`, Node HTTP service

---

## Chunk 1: Deploy Pack Files

### Task 1: Add deploy-side templates and scripts

**Files:**
- Create: `Mira_Released_Version/deploy/service-notification-router/env.example`
- Create: `Mira_Released_Version/deploy/service-notification-router/start-local.sh`
- Create: `Mira_Released_Version/deploy/service-notification-router/check-health.sh`
- Create: `Mira_Released_Version/deploy/service-notification-router/dispatch-self-checkin.sh`
- Modify: `Mira_Released_Version/deploy/service-notification-router/README.md`

- [ ] **Step 1: Create deploy-side env template**

Mirror the release-safe service env template, plus a local default for `MIRA_NOTIFICATION_ROUTER_OUTBOUND_POLICY_PATH`.

- [ ] **Step 2: Create local startup script**

Start the release-side service with `tsx`, defaulting to the release example YAML policy file.

- [ ] **Step 3: Create helper scripts**

Add:

- `check-health.sh`
- `dispatch-self-checkin.sh`

- [ ] **Step 4: Update deploy README**

Document the local run flow using the new scripts.

## Chunk 2: Verification

### Task 2: Verify the local deploy pack

**Files:**
- Verify: `Mira_Released_Version/deploy/service-notification-router/start-local.sh`
- Verify: `Mira_Released_Version/deploy/service-notification-router/check-health.sh`
- Verify: `Mira_Released_Version/deploy/service-notification-router/dispatch-self-checkin.sh`
- Verify: `Mira_Released_Version/services/notification-router/src/__tests__/notification-router.test.ts`

- [ ] **Step 1: Run shell syntax verification**

Run:

```bash
bash -n Mira_Released_Version/deploy/service-notification-router/start-local.sh
bash -n Mira_Released_Version/deploy/service-notification-router/check-health.sh
bash -n Mira_Released_Version/deploy/service-notification-router/dispatch-self-checkin.sh
```

- [ ] **Step 2: Run release-side package tests**

Run:

```bash
cd Mira_Released_Version/services/notification-router
npm test
```

- [ ] **Step 3: Run local service smoke path**

Start the service with the deploy script, then run the health-check helper against it.
