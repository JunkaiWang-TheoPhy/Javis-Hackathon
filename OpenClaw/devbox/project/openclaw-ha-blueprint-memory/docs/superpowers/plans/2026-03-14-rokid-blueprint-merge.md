# Rokid Blueprint Merge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal, runnable Rokid observation flow to the existing blueprint without breaking the current Home Assistant wearable flow.

**Architecture:** Keep the current `ha-control` plugin and Home Assistant execution plane intact. Add a shared contracts package, a narrow `rokid-bridge` OpenClaw plugin, and a small bridge service that can accept observation payloads, return action envelopes, and dispatch confirmed Home Assistant actions.

**Tech Stack:** TypeScript, Node.js built-in HTTP server, `@sinclair/typebox`, `tsx`, Node test runner, existing OpenClaw plugin layout, Home Assistant REST API.

---

## Chunk 1: Tooling And Shared Contracts

### Task 1: Add minimal TypeScript workspace tooling and shared Rokid contracts

**Files:**
- Create: `0313/openclaw-ha-blueprint/package.json`
- Create: `0313/openclaw-ha-blueprint/tsconfig.json`
- Create: `0313/openclaw-ha-blueprint/packages/contracts/package.json`
- Create: `0313/openclaw-ha-blueprint/packages/contracts/src/visual-observation.ts`
- Create: `0313/openclaw-ha-blueprint/packages/contracts/src/action-envelope.ts`
- Create: `0313/openclaw-ha-blueprint/packages/contracts/src/index.ts`
- Create: `0313/openclaw-ha-blueprint/packages/contracts/src/__tests__/contracts.test.ts`

- [ ] **Step 1: Add config-only workspace files**

Create root `package.json` with:
- `private: true`
- scripts for `test`, `test:contracts`, `test:bridge`
- dev dependencies: `typescript`, `tsx`

Create `tsconfig.json` for ESM TypeScript targeting modern Node.

- [ ] **Step 2: Write the failing contract test**

Create `packages/contracts/src/__tests__/contracts.test.ts` with tests that:
- accept a valid `VisualObservationEvent`
- reject an invalid observation missing core IDs
- accept an `ActionEnvelope` carrying `overlay_panel` and `speech`
- reject an invalid envelope with an unknown action kind

Expected test style:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { Value } from "@sinclair/typebox/value";
import { ActionEnvelopeSchema, VisualObservationEventSchema } from "../index.js";

test("accepts a valid observation", () => {
  assert.equal(Value.Check(VisualObservationEventSchema, validObservation), true);
});
```

- [ ] **Step 3: Run the contract test to verify it fails**

Run:

```bash
npm test -- packages/contracts/src/__tests__/contracts.test.ts
```

Expected:
- failure because schema exports do not exist yet

- [ ] **Step 4: Write the minimal contracts implementation**

Implement TypeBox schemas and exported TypeScript types in:
- `visual-observation.ts`
- `action-envelope.ts`
- `index.ts`

Required exported names:
- `VisualObservationEventSchema`
- `ActionEnvelopeSchema`
- `VisualObservationEvent`
- `ActionEnvelope`

- [ ] **Step 5: Run the contract test to verify it passes**

Run:

```bash
npm test -- packages/contracts/src/__tests__/contracts.test.ts
```

Expected:
- PASS

---

## Chunk 2: OpenClaw Plugin Surface

### Task 2: Add the Rokid OpenClaw plugin with typed tools and skill

**Files:**
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/package.json`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/openclaw.plugin.json`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/src/types.ts`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/src/homeAssistant.ts`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/src/safeguards.ts`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/src/index.ts`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/skills/rokid-spatial-assistant/SKILL.md`
- Create: `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-rokid-bridge/src/__tests__/plugin-helpers.test.ts`

- [ ] **Step 1: Write the failing plugin helper test**

Create tests for helper behavior, not for the OpenClaw runtime itself:
- normalize selected detection correctly
- reject unsafe dispatch when service payload has no domain/service
- allow a valid Home Assistant dispatch payload

Expected helper surface:

```ts
import { buildObservationSummary, normalizeDispatchPayload } from "../index.js";
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run:

```bash
npm test -- plugins/openclaw-plugin-rokid-bridge/src/__tests__/plugin-helpers.test.ts
```

Expected:
- failure because helper exports do not exist yet

- [ ] **Step 3: Implement the plugin files**

Implement:
- plugin manifest with `id: "rokid-bridge"`
- `package.json` pointing OpenClaw to `./src/index.ts`
- helper types and Home Assistant client
- `safeguards.ts` for minimal dispatch validation
- `index.ts` exporting:
  - `buildObservationSummary`
  - `normalizeDispatchPayload`
  - default OpenClaw plugin registration

The plugin must register:
- `rokid_ingest_observation`
- `rokid_dispatch_ha`
- `rokid_bridge.status`

- [ ] **Step 4: Add the Rokid skill**

Create `skills/rokid-spatial-assistant/SKILL.md` that encodes:
- explain before actuation
- confirmation before side effects
- no invented entity IDs
- preferred use of Rokid tools

- [ ] **Step 5: Run the helper test to verify it passes**

Run:

```bash
npm test -- plugins/openclaw-plugin-rokid-bridge/src/__tests__/plugin-helpers.test.ts
```

Expected:
- PASS

---

## Chunk 3: Bridge Service And Coffee Demo Flow

### Task 3: Add the Rokid bridge service with observe/confirm endpoints

**Files:**
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/package.json`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/store/transientMemory.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/orchestration/promptBuilder.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/orchestration/actionNormalizer.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/orchestration/openclawClient.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/routes/observe.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/routes/confirm.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/server.ts`
- Create: `0313/openclaw-ha-blueprint/services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts`

- [ ] **Step 1: Write the failing bridge route test**

Cover:
- `POST /v1/observe` returns a confirm-tier envelope for a coffee machine observation
- `POST /v1/confirm` returns a side-effect envelope after pressing `start_scene`
- repeated `POST /v1/confirm` for the same pending action does not duplicate dispatch

Test with a real local server instance and fake HA dispatch callback.

- [ ] **Step 2: Run the bridge route test to verify it fails**

Run:

```bash
npm test -- services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts
```

Expected:
- failure because the bridge server does not exist yet

- [ ] **Step 3: Implement the bridge service**

Implement:
- in-memory session store keyed by `sessionId`
- `POST /v1/observe`
- `POST /v1/confirm`
- `GET /v1/health`

Behavior:
- validate the incoming observation against the contract
- for the first version, produce deterministic coffee-machine responses through `openclawClient.ts`
- return `ActionEnvelope` responses
- make confirmation idempotent

- [ ] **Step 4: Keep the bridge OpenClaw-facing, not device-facing**

`openclawClient.ts` should model the OpenClaw reasoning boundary:
- ingest normalized observation
- produce explanation-first envelope
- produce confirmed side-effect envelope

For this first pass, keep it deterministic and mockable so the demo runs locally without depending on a live OpenClaw API surface.

- [ ] **Step 5: Run the bridge route test to verify it passes**

Run:

```bash
npm test -- services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts
```

Expected:
- PASS

---

## Chunk 4: Blueprint Wiring, Scripts, And README

### Task 4: Wire the merged blueprint and document both demo paths

**Files:**
- Modify: `0313/openclaw-ha-blueprint/docker-compose.yml`
- Modify: `0313/openclaw-ha-blueprint/openclaw-config/openclaw.json`
- Modify: `0313/openclaw-ha-blueprint/README.md`
- Create: `0313/openclaw-ha-blueprint/scripts/demo-rokid-coffee-sequence.sh`
- Create: `0313/openclaw-ha-blueprint/scripts/rokid-observation.sample.json`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-companion/package.json`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-companion/src/demo/coffeeMachineDemo.ts`

- [ ] **Step 1: Add the failing wiring test**

Add a lightweight test in `services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts` or a new focused test that asserts:
- compose wiring expects a `rokid-bridge-gateway` service
- sample coffee observation can be posted through the demo script path assumptions

If a shell-level test is too expensive, keep this as a Node-level configuration test around expected URLs and paths.

- [ ] **Step 2: Run the wiring test to verify it fails**

Run:

```bash
npm test -- services/rokid-bridge-gateway/src/__tests__/bridge-routes.test.ts
```

Expected:
- FAIL because compose/config/script assumptions are not wired yet

- [ ] **Step 3: Update runtime wiring**

Modify:
- `docker-compose.yml` to add `rokid-bridge-gateway`
- `openclaw-config/openclaw.json` to allow and configure `rokid-bridge`

Create:
- `scripts/demo-rokid-coffee-sequence.sh`
- `scripts/rokid-observation.sample.json`

The demo script should:
- post the sample observation
- print the first envelope
- post the confirm payload
- print the second envelope

- [ ] **Step 4: Update README**

Rewrite `README.md` to include:
- merged architecture overview
- updated directory tree
- wearable path
- Rokid path
- ASCII diagrams
- how to run the coffee demo
- explicit note that v1 uses deterministic bridge reasoning and can later be swapped for live OpenClaw agent runs

- [ ] **Step 5: Add a minimal companion skeleton**

Create:
- `apps/rokid-companion/package.json`
- `apps/rokid-companion/src/demo/coffeeMachineDemo.ts`

This is a boundary stub, not a full app. It should show the expected observation payload flow and import the shared contracts package.

- [ ] **Step 6: Run focused verification**

Run:

```bash
npm test
```

Expected:
- all newly added contract, plugin helper, and bridge route tests pass

---

## Execution Notes

- Config files may be created before tests where necessary; do not over-apply TDD to pure build metadata.
- All production logic changes must still follow red-green-refactor.
- Keep the first implementation deterministic and mockable.
- Do not break the existing `plugins/openclaw-plugin-ha-control/` path.
- Preserve the current blueprint’s value as a runnable Home Assistant demo even without Rokid hardware.
