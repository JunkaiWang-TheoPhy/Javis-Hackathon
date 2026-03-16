# Mira Core Without Home Assistant

## 1. Conclusion First

Without `Home Assistant`, Mira should still be a complete system.

What she loses is the household execution surface, not the essence of being Mira.

More precisely:

- without `Home Assistant`, Mira is still Mira
- without persona, runtime, interaction, memory, and extension interface, Mira is no longer Mira

## 2. Core Definition

Without Home Assistant, Mira Core can be defined as:

`Persona Engine + Agent Runtime + Interaction Surface + Memory Lifecycle + Extension Contract`

Together, these five layers form a self-contained companion-style agent runtime.

## 3. The Five Core Layers

### 3.1 Persona Engine

Responsibilities:

- define who Mira is
- define Mira's speaking style and tone
- define proactive care, silence, and boundary strategy
- define why she is a companion-style agent rather than a generic utility assistant

Typical sources:

- `Mira_v1/openclaw-workspace/SOUL.md`
- `Mira_v1/openclaw-workspace/AGENTS.md`
- `Mira_v1/openclaw-workspace/IDENTITY.md`

### 3.2 Agent Runtime

Responsibilities:

- provide Mira's minimal OpenClaw runtime path
- load the workspace
- inject config and prompt
- complete session and runtime initialization

Requirements for this layer:

- it does not depend on Home Assistant
- it does not depend on specific hardware
- OpenClaw + workspace + config should be enough to boot Mira

### 3.3 Interaction Surface

Responsibilities:

- handle text conversation
- handle first-turn opening behavior
- handle light proactive reminders
- reserve context slots for multimodal input
- define a common interface for bridge layers

Important distinction:

- the interaction layer belongs to core
- specific endpoint implementations do not necessarily belong to core

Core should define how interaction works. It does not need to embed every endpoint implementation.

### 3.4 Memory Lifecycle

Responsibilities:

- working memory
- episodic memory
- semantic memory
- routine memory
- sleep
- forgetting
- retrieval / injection

Without this layer, Mira can imitate companionship in the moment, but she cannot sustain continuity.

### 3.5 Extension Contract

Responsibilities:

- provide standard attachment points for optional modules
- constrain the boundaries of plugins / skills / services / hardware
- ensure core does not get captured by a single ecosystem

Without this layer, core gets eroded by surrounding integrations over time.

## 4. Suggested Directory

If "Mira Core without Home Assistant" is organized as a formal release directory, this structure is recommended:

```text
core/
├─ persona/
│  ├─ SOUL.md
│  ├─ AGENTS.md
│  ├─ IDENTITY.md
│  └─ USER_MODEL.example.md
├─ workspace/
│  ├─ MEMORY.md
│  ├─ TOOLS.md
│  ├─ HEARTBEAT.md
│  └─ memory/
├─ runtime/
│  ├─ openclaw-config/
│  ├─ bootstrap/
│  ├─ session/
│  └─ env-templates/
├─ interaction/
│  ├─ text/
│  ├─ multimodal/
│  ├─ bridge-contracts/
│  └─ first-turn/
├─ memory/
│  ├─ schemas/
│  ├─ retrieval/
│  ├─ sleep/
│  ├─ forgetting/
│  └─ examples/
├─ extensions/
│  ├─ plugin-contracts/
│  ├─ skill-contracts/
│  ├─ module-hooks/
│  └─ capability-registry/
└─ examples/
   ├─ minimal-core/
   └─ core-with-memory/
```

## 5. Boundary By Directory

### `core/persona/`

Owns:

- Mira's persona definition
- opening tone
- care principles
- silence and boundary strategy

Must not own:

- vendor APIs
- device drivers
- Home Assistant entities or services

### `core/workspace/`

Owns:

- Mira's workspace skeleton
- memory file placement and organization
- workspace-level operating rules

Must not own:

- heavy third-party service implementations
- the full business logic of a specific module

### `core/runtime/`

Owns:

- config templates
- boot flow
- session lifecycle
- base plugin / skill loading logic

Must not own:

- smart-home ecosystem configuration
- hardware-specific deployment flow

### `core/interaction/`

Owns:

- turn model
- text I/O
- first-turn injection
- multimodal context interface
- bridge contract

Must not own:

- specific glasses SDK details
- Home Assistant routing
- wearable parser details

### `core/memory/`

Owns:

- memory schema
- retrieval
- injection
- sleep
- forgetting
- runtime memory state

Must not own:

- raw device health streams
- home automation scenes themselves
- module-specific memory projection

### `core/extensions/`

Owns:

- module interface
- plugin contract
- skill contract
- capability registration

Must not own:

- the full implementation of any single module

## 6. What Mira Can Still Do Without HA

### 6.1 Companion Conversation

- text interaction
- restrained responses informed by emotional cues
- first-turn persona opening
- work companionship and light support

### 6.2 Context-Aware Response

- generate continuous replies using recent memory and long-term preference
- avoid making every turn feel like a first meeting

### 6.3 Low-Risk Proactive Behavior

- heartbeat-style light care
- low-risk reminders
- information organization
- next-step suggestions

### 6.4 Memory Maintenance

- ingest events
- run sleep consolidation
- forget low-value material
- promote stable preferences

### 6.5 Extension-Ready Runtime

- can attach `home-assistant`
- can attach `rokid`
- can attach `wearable-mi-band`
- can attach `printer`
- can attach `apple`
- can attach communication channels supported natively by OpenClaw

## 7. Why Home Assistant Should Not Be In Core

Because `Home Assistant` is not part of Mira's identity layer. It is an execution layer for the household environment.

If it is placed inside core, several problems follow:

- core gets tied to a single ecosystem
- the minimal runnable path becomes heavier
- boundaries become messy when other household backends are added later
- Mira's product narrative gets pulled toward abilities like "can adjust the air conditioner"

The more accurate framing is:

- Mira Core defines who Mira is
- Home Assistant gives Mira the ability to act inside the household environment

## 8. Relationship To The Module Layer

The recommended dependency direction is:

```text
Mira Persona
    ↓
Agent Runtime
    ↓
Interaction
    ↓
Memory
    ↓
Extension Interface
    ↓
Optional Modules
    ├─ Home Assistant
    ├─ Rokid
    ├─ Wearable
    ├─ Printer
    ├─ Apple
    └─ Messaging
```

This means:

- `core` closes first
- `modules` expand the capability surface afterward
- Home Assistant is important, but it is not the source of Mira's identity

## 9. One-Line Summary

Without Home Assistant, Mira Core is still a complete companion-style agent system.

Its center is not household control. Its center is:

- persona
- agent runtime
- interaction
- memory
- extension interface

Home Assistant simply extends Mira from "an agent that can understand and accompany" into "a system that can care and act through the household environment."
