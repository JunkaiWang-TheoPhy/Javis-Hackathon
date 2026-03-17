# Release Home Assistant Scene Skeleton Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first release-facing TypeScript skeleton for `sceneDefinitions.ts`, `loadDevicesRegistry.ts`, and `sceneResolver.ts` under `Mira_Released_Version/modules/home-assistant/plugin/src`.

**Architecture:** Keep this version narrow and non-destructive. The registry loader reads `registry/devices.example.json` and normalizes it into a typed registry. Scene definitions remain static and declarative. The resolver consumes the definitions plus registry and returns a `ResolvedScenePlan` without executing any real side effects.

**Tech Stack:** TypeScript, Node test runner via `tsx --test`, JSON-based registry fixture

---

## Chunk 1: Tests

### Task 1: Add failing tests for registry loading and scene resolution

**Files:**
- Create: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/release-scene-skeleton.test.ts`

- [ ] **Step 1: Write a failing test that loads `devices.example.json` into a normalized registry**
- [ ] **Step 2: Run the test to verify it fails because the loader does not exist**
- [ ] **Step 3: Write a failing test that resolves `arrival_cooling` into a plan**
- [ ] **Step 4: Write a failing test that returns `blocked` when a required role is missing**
- [ ] **Step 5: Run the targeted tests and verify the failures are due to missing implementation**

## Chunk 2: Skeleton Implementation

### Task 2: Add release-facing types and loader

**Files:**
- Create: `Mira_Released_Version/modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts`

- [ ] **Step 1: Define typed registry entities that mirror the example JSON**
- [ ] **Step 2: Load the JSON fixture**
- [ ] **Step 3: Normalize aliases, scene bindings, and capabilities**
- [ ] **Step 4: Export a typed `loadDevicesRegistry()` function**

### Task 3: Add scene definitions

**Files:**
- Create: `Mira_Released_Version/modules/home-assistant/plugin/src/scenes/sceneDefinitions.ts`

- [ ] **Step 1: Define `SceneDefinition` and related types**
- [ ] **Step 2: Add a first `arrival_cooling` scene definition**
- [ ] **Step 3: Export a `getSceneDefinition()` helper**

### Task 4: Add `sceneResolver.ts`

**Files:**
- Create: `Mira_Released_Version/modules/home-assistant/plugin/src/scenes/sceneResolver.ts`

- [ ] **Step 1: Define `SceneResolveInput`, `ResolvedScenePlan`, and `ScenePlanStep`**
- [ ] **Step 2: Match devices by `sceneBindings.role` and `priority`**
- [ ] **Step 3: Expand action templates into plan steps**
- [ ] **Step 4: Return `ready` or `blocked` based on required role coverage**
- [ ] **Step 5: Keep confirmation/outbound fields present but skeletal**

## Chunk 3: Verification

### Task 5: Run targeted verification

**Files:**
- Test: `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/__tests__/release-scene-skeleton.test.ts`

- [ ] **Step 1: Run the release-scene skeleton tests**
Run: `npm test -- services/rokid-bridge-gateway/src/__tests__/release-scene-skeleton.test.ts`

- [ ] **Step 2: Confirm the loader reads the example JSON and the resolver emits a structured plan**
