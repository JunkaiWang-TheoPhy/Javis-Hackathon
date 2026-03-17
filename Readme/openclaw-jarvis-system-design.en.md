# OpenClaw Jarvis System Design

## File Relationship

- Chinese source: `openclaw-jarvis-system-design.md`
- Full English companion: `openclaw-jarvis-system-design.en.md`
- Clean English companion: `openclaw-jarvis-system-design.clean.en.md`
- Structured English companion: `openclaw-jarvis-system-design.structured.en.md`

This file is the full English companion for the large Chinese export draft. It keeps the same overall scope, main arguments, and major topic clusters, while normalizing obvious export noise for readability. For maintenance, treat the Chinese source as the archival conversation export and this file as its English companion edition.

## Overview

This document frames a Jarvis-style system built on OpenClaw as a long-running personal cyber-physical agent rather than a simple smart-home chatbot. The core design claim is:

`Sensors and apps -> event/context layer -> memory and policy layer -> action router -> home, wearable, and messaging interfaces`

In that framing:

- OpenClaw is the orchestration shell, session runtime, tool surface, and channel router.
- Home Assistant is the preferred device authority layer for household control.
- Wearables are upstream context sources, not the entire system.
- Memory and policy determine whether the system feels like “Jarvis” instead of a command bot.

## Primary Design Goal

The source document starts from a concrete ambition: a system that can connect to wearables and smart-home devices, support proactive sensing and proactive action, and handle companion-style scenarios such as:

- abnormal heart-rate reminders
- post-workout arrival cooling and media changes
- elder-care and living-alone companionship
- standing reminders for work
- emotional comfort and personalized interaction
- long-term and short-term memory with compression and organization

The response argues that this should not be designed as a single prompt repository. It should be designed as a versioned, testable system with contracts, schemas, policies, and scenario-driven behavior.

## Layered Architecture

The document repeatedly converges on a five-layer system.

### 1. Device and Sensor Layer

This layer only reads signals and executes actions.

Recommended paths:

- Apple Watch -> HealthKit -> iPhone companion app -> backend/OpenClaw
- Xiaomi and other smart-home ecosystems -> Home Assistant -> action bus -> OpenClaw policy layer
- Vision Pro -> interaction shell, spatial dashboard, or operator terminal

The system should avoid turning OpenClaw into a low-level protocol driver for every vendor.

### 2. Event and Context Layer

All inputs should be normalized into common event objects with:

- event id
- source
- type
- payload
- timestamp
- confidence

Representative event classes mentioned in the source:

- wearable heart-rate samples
- location enter-home events
- Home Assistant state changes
- user chat messages
- calendar or work-context transitions

### 3. Memory Layer

The source explicitly argues against “just use a vector database.” It proposes multiple memory forms:

- working memory
- episodic timeline memory
- semantic memory
- routine memory
- care memory

This is the part that later feeds memory compression, sleep, forgetting, and proactive companion behavior.

### 4. Policy Layer

The policy layer is described as the actual Jarvis brain. It combines:

- body state
- home state
- location and presence
- calendar and work context
- permissions and privacy mode
- memory state

It then selects actions under safety and annoyance constraints, rather than directly letting a model improvise every real-world action.

### 5. Action Layer

The source strongly prefers typed actions over raw arbitrary API calls. Safe actions include:

- notify user
- run scene
- set climate
- play media
- request check-in
- escalate caregiver

The principle is simple: the model should choose from controlled action types, not directly construct unrestricted home-control calls.

## Why a Polyglot Monorepo

The document argues for a monorepo because the system is inherently multi-language and multi-surface:

- Swift for iOS and watchOS bridges
- Markdown and TypeScript or JavaScript for OpenClaw skills and plugins
- Python or TypeScript for memory and policy services
- TypeScript for dashboards
- YAML and Home Assistant configuration

The important claim is that correctness does not live in one code file. It lives in:

- contracts
- schemas
- policies
- scenario tests
- skill instructions

That is why versioning these pieces together matters more than splitting the project into unrelated repositories too early.

## Recommended Repository Shape

One recurring recommendation is a monorepo with:

- `docs/architecture/`
- `docs/adrs/`
- `docs/scenarios/`
- `docs/threat-model/`
- `openclaw-workspace/`
- `apps/ios-bridge/`
- `apps/watchos-companion/`
- `apps/web-console/`
- `services/`
- `integrations/`
- `infra/`

This is not merely a folder preference. It encodes a worldview:

- OpenClaw workspace holds the agent shell.
- Apps bridge external operating systems and devices.
- Services maintain memory, policy, and routing.
- Integrations connect household and wearable ecosystems.
- Docs hold scenario truth and safety assumptions.

## Home Assistant as the Device Plane

The document repeatedly returns to the same conclusion:

`OpenClaw is the brain. Home Assistant is the body.`

Reasons given:

- Home Assistant already normalizes entities, services, events, and scenes.
- It provides REST, WebSocket, and conversation interfaces.
- It gives a safer and more uniform surface than direct vendor-cloud coupling.
- It localizes many integrations and reduces vendor-specific maintenance.

The preferred production design is therefore:

- OpenClaw for natural language, memory, policies, and proactive logic
- Home Assistant for device state, service execution, event subscriptions, and scene execution
- vendor-direct adapters only when Home Assistant does not expose a needed capability

## Assist-First Versus Strongly Typed Control

The source differentiates three household-control surfaces:

### Assist-First Natural Language

Use Home Assistant Assist or conversation APIs when the task is fuzzy, natural-language, area-aware, or human-like.

### Strongly Typed Control

Use REST services, event hooks, and state reads for deterministic actions such as:

- running specific scenes
- changing climate targets
- querying exact state
- replaying test scenarios

### Voice and Playback Surface

Alexa or Echo-like devices are treated as voice input or playback terminals, not as the household control core.

This is a recurring pattern in the source: separate the household authority plane from the voice surface.

## Device and Wearable Comparison

One large portion of the source compares different device categories from the OpenClaw integration perspective.

### Apple Watch

Ranked highest for real integration value because it has:

- standardized health data layers
- mature iPhone bridge patterns
- notifications and quick interactions
- workout and session-oriented automation possibilities

### Vision Pro

Positioned as a spatial interface or “agent cockpit,” not a primary sensor backend.

### Xiaomi Watch

Useful as a data source, often via intermediate operating-system data layers such as Mi Fitness, Health Connect, or Apple Health.

### Rokid

Treated as a developer platform and AR endpoint rather than a low-friction general-purpose smart-device integration.

The key lesson is that integration value comes more from standardized operating-system data and automation layers than from how futuristic the hardware looks.

## Skills, Plugins, and Boundaries

The source eventually sharpens the distinction between skills and plugins:

- skills teach the model how to use tools
- plugins actually add tools, commands, gateway routes, or background services

This distinction matters because a Jarvis-style system needs both:

- human-readable behavior guidance
- machine-executable capability surfaces

Later conversation blocks in the source move toward a concrete Home Assistant control skill and plugin design, including:

- heart-rate alerts
- arrival-home cooling
- mechanical switch control
- scene orchestration
- Home Assistant token and endpoint configuration

## Mechanical Switches and Actuation

The source also discusses physically actuated or semi-mechanical switch brands and patterns. The main architectural takeaway is:

- prefer device types with readable state and verifiable execution
- prefer Home Assistant-visible entities over opaque remote-only systems
- separate low-risk actions from high-risk actions

It treats SwitchBot and Third Reality as practical examples because they can be surfaced as manageable entities in Home Assistant and fit the typed-action model.

## Safety Model

The safety stance in the source is consistent:

- do not give unbounded control to unreviewed third-party skills
- treat household control like host execution, with policy gates and approvals
- separate low-risk actions from high-risk actions
- keep locks, cameras, gas valves, and dangerous appliances in a special approval class

This later becomes important for outbound policy and proactive behavior as well.

## Proactive and Companion Capabilities

Although much of the document is framed as architecture, its product target is clear:

- not just command-and-control
- not just household automation
- but companion-style proactive care

That requires:

- persistent memory
- compressed context
- event normalization
- typed actions
- channel routing
- clear policy boundaries

This is the foundation for later Mira-specific work in the repo.

## Core Design Conclusions

The source can be summarized into a few durable conclusions:

1. OpenClaw should remain the agent shell, not the full hardware protocol stack.
2. Home Assistant should usually be the first device plane for household actuation.
3. Wearables are most valuable when they feed standardized health and context layers.
4. Typed tools and typed actions are safer than unconstrained direct API generation.
5. Memory and policy are what make the system feel like Jarvis.
6. A monorepo is justified because schemas, policies, scenarios, and runtime instructions must evolve together.

## How To Use This File

For future management:

- Use `openclaw-jarvis-system-design.md` as the original Chinese archive.
- Use this file for an English reading pass over the full scope.
- Use `openclaw-jarvis-system-design.clean.en.md` when you want the same content reorganized into cleaner technical sections.
- Use `openclaw-jarvis-system-design.structured.en.md` when you want a release-facing, compressed architecture reference for `Mira_Released_Version`.
