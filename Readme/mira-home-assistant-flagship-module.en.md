# Mira's Flagship Home Assistant Module

## 1. Module Positioning

The `Home Assistant` module should be defined as:

> Mira's flagship home control module.  
> Home Assistant acts as the device authority layer, while Mira interprets household state and safely executes actions through typed tools, scene orchestration, wearable and presence policies, and an ecosystem registry.

This definition has two key points:

1. `Home Assistant` is Mira's strongest and most mature home-control backend.
2. `Mira` herself is not subordinate to Home Assistant. She operates at a higher layer of understanding, orchestration, and decision-making.

Because of that, this module should not be described as "just another HA plugin." It should be described as Mira's first-party flagship module for the home environment.

## 2. Why It Is the Flagship Module

Within the current Mira system, Home Assistant is the best fit for the home device authority layer because it already provides:

- unified device abstraction
- broad ecosystem coverage
- a stable entity / service / scene model
- automation and state subscription
- a centralized expression of household state

This means Mira does not need to couple herself directly to every vendor cloud API, every local device protocol, or every standalone app. Instead, through Home Assistant she can first obtain:

- the current state of devices in the home
- the actions those devices can perform
- pre-defined scenes
- unified semantics for presence, climate, lighting, media, and more

From a systems perspective, Home Assistant owns device authority, while Mira owns:

- user-intent understanding
- contextual judgment about whether action is appropriate
- execution-path choice based on risk
- multi-step scene organization
- the decision to confirm, delay, or suppress an action

## 3. Role In The Overall Architecture

In Mira's layered release architecture, this module should live at:

```text
Mira_Released_Version/
└─ modules/
   └─ home-assistant/
```

It should not be part of `core/`, because:

- Mira Core is fundamentally about persona, runtime, interaction, memory, and extension interface.
- Home Assistant is the module that gives Mira execution ability inside the household environment. It is not Mira's identity layer.

More precisely:

- `core/` defines who Mira is.
- `modules/home-assistant/` defines how Mira acts inside the home.

Its system role should therefore be:

- the first-party home-control module on top of `Mira Core`
- Mira's strongest outward-facing environment execution surface today
- the flagship implementation of Mira's future multi-ecosystem home capability

## 4. Architectural Center: Not A Single API, But A Home Control Plane

The real center of this module is not a single `service call`, but a complete home control plane.

It should contain four core pillars:

1. `typed tools`
2. `scene orchestration`
3. `wearable/presence policies`
4. `ecosystem registry`

Together, these four pillars are what make Mira more than a system that can issue switch commands. They make her a system that can understand household state and act safely.

## 5. Typed Tools

### 5.1 Definition

`typed tools` are the standardized tool interfaces Mira uses to interact with the home-control system.

Their value is that they:

- map natural-language intent into structured, verifiable calls
- let Mira know exactly what she is reading, controlling, and affecting
- make risk evaluation, audit logging, and regression testing feasible

### 5.2 Responsibilities

At a minimum, this layer should cover:

- reading device state
- calling Home Assistant services
- querying scenes and capabilities
- triggering pre-defined scenes
- processing home actions driven by body state or presence

The key is not "having many tools." The key is having clean boundaries:

- every tool has clear inputs
- every tool has clear outputs
- every tool has a clear side-effect boundary
- every tool has a clear risk level

### 5.3 Why It Matters

Without typed tools, Mira easily degrades into:

- dumping language generation directly into HA APIs
- unstable testing
- weak safety confirmation
- no clear distinction between state reads and side-effecting actions

With typed tools, Mira can support:

- separation of reads and writes
- risk tiers
- approval-chain insertion
- traceable behavior

## 6. Scene Orchestration

### 6.1 Definition

`scene orchestration` is not single-device control. It is the organization of multiple actions into a contextual household execution unit.

Examples include:

- arrival cooling
- post-workout recovery mode
- quiet evening companion mode
- focused work environment switching

### 6.2 Why Mira Needs A Scene Layer

If the system only has individual toggle commands, Mira looks like a natural-language remote control.

But Mira is not meant to be a remote control. She is meant to be:

- a context-aware companion agent
- a system that turns understanding into environmental action

The scene layer allows Mira to evolve from:

- "turn on the air conditioner"

to:

- "switch the home into the most appropriate environment for the current situation"

### 6.3 Inputs To Scene Orchestration

Scenes should not be triggered by a single utterance alone. They should be decided through multi-dimensional context:

- explicit user request
- current body state
- presence state
- time of day
- recent interaction memory
- risk and interruption cost

### 6.4 Outputs From Scene Orchestration

Scene execution should not collapse into a single service call. It should produce:

- combined actions
- execution rationale
- risk judgment
- confirmation requirement, if any
- a post-execution state summary

## 7. Wearable / Presence Policies

### 7.1 Definition

`wearable/presence policies` are the policy layer that turns body state and spatial presence into conditions for household action.

They connect:

- bands, watches, and health events
- whether the user is home, arriving home, or active
- whether household actions should happen at all

### 7.2 Why This Is A Mira Signature

Ordinary Home Assistant automation tends to look like:

- if this then that

Mira needs something closer to:

- context-aware care policy

For example:

- if the user just finished a workout and is arriving home, should cooling start?
- if the user is tired at night, should strong alerts be suppressed?
- if the user prefers a quiet arrival home, should some automations be held back?

### 7.3 This Layer Must Be More Than Raw Device Forwarding

Its job is not just to pass through:

- heart rate
- presence
- sleep

Its job is to define:

- which states matter
- which combinations are allowed to trigger scenes
- which combinations must suppress scenes
- which actions require confirmation

### 7.4 Its Engineering Significance

This layer is what moves Mira from being a home controller to being a home companion system.

Without it, Mira is simply:

- a system that can control home devices

With it, Mira becomes:

- a system that adjusts the environment after understanding your state

## 8. Ecosystem Registry

### 8.1 Definition

`ecosystem registry` is a unified capability registration layer that describes:

- device identity
- aliases
- capabilities
- routing method
- risk tier

### 8.2 Why It Is Needed

Without a registry, the system quickly turns into:

- one logic path per vendor
- one naming convention per device
- scene logic full of hard-coded entity IDs

That kind of system does not scale and does not belong in a release version.

### 8.3 Its Role

The registry should elevate devices from vendor implementation details into unified capability objects Mira can understand, such as:

- `device`
- `aliases`
- `capabilities`
- `route`
- `risk tier`

That way Mira works with concepts like:

- "fan"
- "cooling"
- "quiet evening mode"

instead of low-level protocol details.

### 8.4 Its Relationship To Home Assistant

At the current stage, the registry can treat Home Assistant as the primary device authority layer.
But in the longer architecture, the registry should not exist only for HA. It should also leave room for future direct adapters and other ecosystem backends.

So today this module is:

- `HA-first backend`

But its longer-term direction should be:

- `Mira-centric capability registry`

## 9. Safe Execution Principles

Because this is Mira's flagship home-control module, safe execution must be part of its definition, not an afterthought.

### 9.1 Basic Principles

- separate state reads from side-effecting actions
- high-risk actions must be confirmable
- the module must not default to full, highest privilege across all devices
- Mira must not skip execution boundaries just because she understands the context

### 9.2 Risk Tiers

At a minimum, the system should distinguish:

- `inform`
  - read-only operations, low-risk explanations, notifications
- `confirm`
  - actions with side effects that require confirmation
- `side_effect`
  - actions that have executed or clearly change the environment

### 9.3 Why This Is Critical

Home control is not ordinary UI interaction.

It affects:

- temperature
- light
- sound
- locks / cameras / security
- environments for elder care and solitary living

So it must be a system with:

- typed tools
- scene orchestration
- policies
- risk discipline

## 10. Boundary With Mira Core

This module should depend on `Mira Core`, but it should not define Core in return.

### Mira Core Owns

- persona
- agent runtime
- interaction
- memory
- extension interface

### The Home Assistant Module Owns

- reading household state
- executing household actions
- orchestrating household scenes
- body-state / presence-driven household policy
- household ecosystem capability registration

### What Should Not Live In This Module

- Mira's base persona definition
- Mira's first-turn brand opening rules themselves
- Mira's general memory system itself
- generic interaction logic unrelated to the household environment

That boundary matters because it determines whether this module is:

- a powerful official module

instead of:

- Mira's core being swallowed by Home Assistant

## 11. Suggested External Narrative

If you want a release-facing description, this is the recommended wording:

> `modules/home-assistant/` is Mira's flagship home control module.  
> Home Assistant acts as the device authority layer, while Mira interprets household state and safely executes actions through typed tools, scene orchestration, wearable and presence policies, and a unified ecosystem registry.

This wording works because it:

- emphasizes Home Assistant's infrastructure role
- preserves Mira's role as the higher-level intelligence and orchestrator
- avoids describing the module as "just an HA plugin"
- avoids overstating it as a fully mature multi-ecosystem bus independent of HA

## 12. Final Conclusion

The core conclusion of this module description is:

- this is not a generic Home Assistant plugin folder
- this is Mira's first-party flagship module in the household environment
- Home Assistant owns the device authority layer
- Mira owns interpretation, orchestration, policy, and safe execution

So the most accurate positioning is:

**Mira's flagship home control module.**

It is the module that takes Mira from an agent who can understand and accompany to a system that can care through the environment, shape atmosphere, and act safely.
