# Rokid Blueprint Merge Design

**Date:** 2026-03-13
**Status:** Approved in chat, written for planning
**Scope:** Extend the existing `openclaw-ha-blueprint` to support Rokid-driven visual interactions while preserving the current Home Assistant blueprint structure as the primary execution plane.

---

## Goal

Merge the Rokid support proposal into the current blueprint with minimal structural disruption so the repository can support two working paths:

1. Wearable and Home Assistant flows that already exist in the blueprint
2. Rokid visual observation flows that can explain what the user sees, request confirmation, and trigger Home Assistant actions

The resulting repository should remain understandable as a single blueprint, not split into a separate standalone Rokid repository.

---

## Non-Goals

- No continuous first-person video pipeline in the first version
- No direct Rokid-to-Home Assistant coupling
- No replacement of the existing `ha-control` plugin
- No long-term memory subsystem beyond minimal session state needed for confirmation flows
- No attempt to standardize every future visual device in this first pass

---

## Existing Baseline

The current blueprint already provides:

- `docker-compose.yml` for Home Assistant, Ollama, and OpenClaw
- `openclaw-config/openclaw.json` for OpenClaw runtime configuration
- `plugins/openclaw-plugin-ha-control/` for Home Assistant tools, wearable webhook handling, presence watching, and cooling orchestration
- `homeassistant-config/` for minimal Home Assistant API and scene support
- `scripts/` for end-to-end demo scripts

This baseline remains valid and must keep working after the merge.

---

## Design Principles

1. Preserve the current blueprint shape
2. Add Rokid support as an incremental layer, not a rewrite
3. Use contract-first boundaries so companion capture details can evolve without forcing downstream rewrites
4. Keep the OpenClaw plugin surface narrow and typed
5. Keep Home Assistant as the execution plane for real side effects
6. Prefer explanation before actuation
7. Require confirmation for side effects unless the request is clearly imperative and explicitly allowed

---

## Target Repository Structure

The merged structure keeps the existing top-level blueprint directories and adds only the minimum new modules required for Rokid support.

```text
openclaw-ha-blueprint/
├─ README.md
├─ docker-compose.yml
├─ homeassistant-config/
├─ openclaw-config/
├─ packages/
│  └─ contracts/
├─ services/
│  └─ rokid-bridge-gateway/
├─ apps/
│  └─ rokid-companion/
├─ plugins/
│  ├─ openclaw-plugin-ha-control/
│  └─ openclaw-plugin-rokid-bridge/
├─ scripts/
│  ├─ bootstrap-openclaw-plugin.sh
│  ├─ demo-sequence.sh
│  └─ demo-rokid-coffee-sequence.sh
└─ docs/
   └─ superpowers/
      └─ specs/
```

### Directory Responsibilities

- `homeassistant-config/`
  - Remains the Home Assistant execution plane configuration
  - Continues to hold scenes, scripts, automations, and minimal API setup

- `openclaw-config/`
  - Remains the OpenClaw runtime configuration root
  - Gains configuration for the Rokid bridge plugin and any bridge endpoint settings needed by the new flow

- `packages/contracts/`
  - Holds shared TypeScript contracts used by the Rokid companion, bridge service, and OpenClaw plugin
  - This is the canonical source for the visual observation and action response shapes

- `services/rokid-bridge-gateway/`
  - Provides explicit ingress for Rokid-side clients
  - Owns `POST /v1/observe`, `POST /v1/confirm`, and a health endpoint
  - Owns minimal session and confirmation state
  - Calls OpenClaw and returns normalized action envelopes

- `apps/rokid-companion/`
  - Holds a local companion app skeleton and module boundaries
  - Models capture, OCR, detection, encoding, HUD rendering, speech, and action execution
  - First version may remain a mock or simulated client if no real device SDK is used

- `plugins/openclaw-plugin-ha-control/`
  - Keeps its current responsibilities unchanged
  - Remains the Home Assistant control and orchestration plugin for existing wearable and presence flows

- `plugins/openclaw-plugin-rokid-bridge/`
  - Adds the OpenClaw-side tool surface for Rokid workflows
  - Does not accept direct external ingress from Rokid devices

- `scripts/`
  - Keeps current demo scripts
  - Adds a Rokid demo script that simulates the coffee-machine observation-confirm-execute flow

- `README.md`
  - Becomes the primary system-level explanation of both flows
  - Includes updated architecture diagrams and run instructions

---

## Contract-First Boundary

Two shared contracts define the interface between the Rokid-facing modules and the OpenClaw-facing modules.

### `VisualObservationEvent`

Represents a compact semantic summary of what the user saw and did.

Required capabilities:

- identify the observation and session
- describe the capture mode
- include detections and OCR evidence
- capture user intent such as button press or voice query
- include optional local summary text
- include minimal privacy directives

First version fields:

- `schemaVersion`
- `sessionId`
- `observationId`
- `observedAt`
- `source`
- `capture`
- `detections`
- `ocr`
- `selectedDetectionId`
- `userEvent`
- `summary`
- `privacy`

### `ActionEnvelope`

Represents the normalized response returned after OpenClaw reasoning.

First version action kinds:

- `overlay_panel`
- `speech`
- `highlight_target`
- `home_assistant_service`
- `noop`

Required capabilities:

- identify the envelope and correlation target
- indicate safety tier
- carry one or more actions for HUD, speech, or Home Assistant dispatch
- optionally carry small memory writes if needed later

### Why This Boundary Is Mandatory

The most likely future source of change is the capture side:

- snapshot today
- ROI snapshot later
- continuous stream later still

By freezing the companion-to-bridge and bridge-to-plugin contract early, downstream modules can stay stable even if the capture implementation changes.

---

## Runtime Data Flow

The merged system keeps the current wearable path and adds a new Rokid path.

### Existing Path

```text
wearable webhook -> openclaw-plugin-ha-control -> Home Assistant
```

### New Rokid Path

```text
Rokid Glasses
  -> rokid-companion
  -> VisualObservationEvent
  -> rokid-bridge-gateway
  -> OpenClaw skill + rokid plugin tools
  -> ActionEnvelope
  -> HUD / speech / Home Assistant
```

### Responsibility Split

- Rokid Glasses and companion: sensing, local event creation, local presentation
- Bridge gateway: ingress, session cache, confirm handling, orchestration adapter
- OpenClaw: reasoning, policy, memory-aware interpretation
- Home Assistant: real side effects such as scenes, switches, buttons, fans, climate

---

## New Component Design

### `packages/contracts/`

Purpose:

- define shared types and schemas for Rokid flows
- prevent drift between companion, bridge, and plugin

Initial contents:

- `src/visual-observation.ts`
- `src/action-envelope.ts`
- `src/index.ts`

Optional validation helpers may be added if useful, but the package should remain minimal.

### `services/rokid-bridge-gateway/`

Purpose:

- receive Rokid observations from the companion
- translate them into OpenClaw-friendly runs
- manage short-lived confirmation state
- return normalized action envelopes

Endpoints:

- `POST /v1/observe`
- `POST /v1/confirm`
- `GET /v1/health`

Internal modules:

- `routes/observe.ts`
- `routes/confirm.ts`
- `orchestration/openclawClient.ts`
- `orchestration/promptBuilder.ts`
- `orchestration/actionNormalizer.ts`
- `store/transientMemory.ts`

Out of scope for v1:

- durable persistence
- full authentication stack
- continuous media ingestion

### `apps/rokid-companion/`

Purpose:

- represent the Rokid-side client boundary
- isolate capture, local preprocessing, transport, and HUD rendering

Initial module boundaries:

- `capture/`
- `preprocess/`
- `session/`
- `transport/`
- `hud/`
- `audio/`
- `actions/`
- `demo/`

The first version may be mock-driven if no live device SDK is available.

### `plugins/openclaw-plugin-rokid-bridge/`

Purpose:

- expose Rokid-facing tools inside OpenClaw
- normalize observation context
- route confirmed Home Assistant actions
- expose plugin status for debugging

Initial tool surface:

- `rokid_ingest_observation`
- `rokid_dispatch_ha`
- `rokid_bridge_status`

This plugin must not absorb companion ingress responsibilities. External clients talk to the bridge service, not directly to the plugin.

### `plugins/openclaw-plugin-ha-control/`

Purpose:

- remain the Home Assistant control and orchestration plugin for the existing blueprint

Constraints:

- do not merge Rokid ingress into this plugin
- do not break the existing wearable and arrival-home behavior
- allow Rokid flows to share the same Home Assistant execution plane

---

## Skill Design

The Rokid capability is introduced with a new skill:

- `plugins/openclaw-plugin-rokid-bridge/skills/rokid-spatial-assistant/SKILL.md`

Potential workspace mirror:

- `openclaw-workspace/skills/rokid-spatial-assistant/SKILL.md`

Skill rules:

1. Prefer explanation before actuation
2. Keep HUD text short and scannable
3. Require confirmation for side effects unless explicitly safe and imperative
4. Never invent entity IDs
5. Use the Rokid plugin tools instead of browser automation for steady-state visual flows
6. Mention uncertainty when detections or OCR are weak

The skill is not responsible for external ingress, OCR, or scene execution internals. It only shapes reasoning and tool use.

---

## Minimal End-to-End Demo

The first Rokid demo is intentionally narrow:

```text
see coffee machine
-> explain what it is
-> show HUD panel
-> ask for confirmation
-> trigger Home Assistant action
-> show success response
```

### Demo Scenario

- User points at a coffee machine
- Companion submits a `VisualObservationEvent`
- OpenClaw returns an explanation and confirmation UI
- User confirms
- Bridge calls Home Assistant through the Rokid plugin
- HUD and speech report success

### Home Assistant Side Effect Targets

The action may target one of:

- `button.press` on a mechanical or proxy button entity
- `scene.turn_on` on a coffee scene
- `script.turn_on` on a Home Assistant script

The design must support any of these without changing the bridge contract.

### Demo Script Expectations

Add a script similar in spirit to the current demo scripts:

- posts a sample observation payload
- simulates user confirmation
- prints the returned envelopes

This script does not need a live Rokid device to prove the architecture.

---

## Configuration Changes

### `openclaw-config/openclaw.json`

Add:

- plugin allow entry for `rokid-bridge`
- plugin configuration for Home Assistant access and bridge defaults

Keep:

- existing `ha-control` plugin configuration intact

### `docker-compose.yml`

Add:

- `rokid-bridge-gateway` service

Keep:

- existing `homeassistant`
- existing `ollama`
- existing `openclaw-gateway`
- existing `openclaw-cli`

The new service should be added with minimal disturbance to the existing stack and should share the same local network environment used by the other services.

---

## Error Handling

The first version must not fail silently.

### Companion -> Bridge Failure

- return a short, HUD-safe error
- do not expose raw stack traces

### Bridge -> OpenClaw Failure

- return a `noop` action envelope
- include a concise reason suitable for display or speech

### OpenClaw -> Home Assistant Failure

- return a structured error from `rokid_dispatch_ha`
- normalize it to a user-facing HUD or speech message

### Duplicate Confirmation

- confirmation flow must be idempotent
- repeated `confirm` requests for the same pending action must not dispatch duplicate Home Assistant calls

### Weak Evidence

- if detections are low confidence or OCR is missing, the system should explain uncertainty and avoid actuation

---

## Testing Scope

The first implementation only needs focused tests around the new boundary surfaces.

### Contract Tests

- validate `VisualObservationEvent`
- validate `ActionEnvelope`

### Plugin Tests

- `rokid_ingest_observation` extracts normalized context correctly
- `rokid_dispatch_ha` maps to the expected Home Assistant payload

### Bridge Tests

- `POST /v1/observe` returns a normalized action envelope
- `POST /v1/confirm` executes a second-stage confirmed action
- repeated confirmation does not duplicate side effects

### Demo-Level Test

- coffee-machine observation leads to explanation-first output
- confirm step leads to a Home Assistant action envelope

Out of scope:

- live device SDK testing
- continuous stream load testing
- full UI automation of HUD rendering

---

## README Update Requirements

The updated `README.md` must explain the merged blueprint clearly enough that a new engineer can understand:

1. what existed before
2. what Rokid support adds
3. how the modules are divided
4. how to run both demos

### Required README Sections

- overview
- updated layout
- architecture summary
- data flow for wearable path
- data flow for Rokid path
- minimal setup instructions
- demo instructions
- known boundaries and non-goals

### Required Diagrams

At minimum, include two diagrams in Markdown-friendly form.

#### Diagram 1: System Architecture

```text
Rokid Glasses
  -> rokid-companion
  -> rokid-bridge-gateway
  -> OpenClaw plugins/skills
  -> Home Assistant
```

#### Diagram 2: Coffee Demo Sequence

```text
capture
  -> observation
  -> explanation panel
  -> confirm
  -> HA service
  -> HUD success
```

ASCII or Mermaid is acceptable as long as the diagrams remain readable in plain text.

---

## Implementation Constraints

The implementation plan that follows this spec must respect these constraints:

- preserve the current blueprint’s ability to run without Rokid hardware
- keep existing `ha-control` functionality intact
- prefer small, focused files
- avoid over-engineering authentication, persistence, or streaming before the first end-to-end Rokid demo works
- keep the first version mockable from scripts so it can be demonstrated locally

---

## Open Questions Resolved During Design

- Preserve current blueprint skeleton: yes
- Add Rokid support as incremental modules: yes
- Keep Home Assistant as device plane: yes
- Keep OpenClaw as reasoning plane: yes
- Use bridge service instead of direct companion-to-plugin ingress: yes
- Use contract-first schemas before implementation: yes
- Limit first demo to coffee-machine explanation-confirm-action: yes

There are no remaining unresolved design placeholders blocking implementation planning.
