# OpenClaw Jarvis System Design (Clean English Edition)

## File Relationship

- Chinese source: `openclaw-jarvis-system-design.md`
- Full English companion: `openclaw-jarvis-system-design.en.md`
- Clean English companion: `openclaw-jarvis-system-design.clean.en.md`
- Structured English companion: `openclaw-jarvis-system-design.structured.en.md`

This file is the cleaned English edition of the Chinese source. It preserves the major technical content while removing export noise such as repeated metadata, prompt wrappers, and raw transcript artifacts. For maintenance, keep this file aligned with the Chinese source at the level of technical substance, not line-by-line formatting.

## 1. System Thesis

The source argues for a Jarvis-style ambient agent built on OpenClaw with:

- continuous context intake
- long-term and short-term memory
- proactive sensing
- proactive action
- safety-constrained actuation
- companion-style interaction

The recommended system model is:

`sensors and apps -> event and context layer -> memory and policy layer -> action router -> home, wearable, and communication interfaces`

## 2. Recommended Runtime Roles

### OpenClaw

Use OpenClaw as:

- orchestration shell
- session runtime
- tool and plugin surface
- channel router
- skill-driven cognitive layer

Do not use OpenClaw as:

- a full Zigbee stack
- a Matter controller replacement
- a direct driver for every vendor ecosystem

### Home Assistant

Use Home Assistant as:

- household device authority layer
- entity and service abstraction layer
- event subscription point
- scene execution layer
- bridge for multi-vendor household integrations

### Wearables

Treat wearables as:

- data sources
- alert sources
- context sources
- interaction triggers

Do not confuse them with the system brain.

## 3. Core System Layers

### Device and Sensor Layer

Handles data acquisition and device actuation only.

Examples:

- Apple Watch health data
- geofencing
- Home Assistant entities
- media players
- mechanical switch actuators

### Event and Context Layer

Normalizes raw inputs into typed events:

- wearable events
- presence events
- household state changes
- user messages
- scheduled context

### Memory Layer

The source differentiates:

- working memory
- episodic memory
- semantic memory
- routine memory
- care memory

This is later compatible with sleep and forgetting mechanisms.

### Policy Layer

Combines body state, home state, presence, calendar state, memory, and permissions to decide which actions are acceptable.

### Action Layer

Uses typed actions such as:

- notify user
- run scene
- set climate
- play media
- request check-in
- escalate caregiver

## 4. Why the Repository Should Be a Monorepo

The source prefers a polyglot monorepo because the system spans:

- Swift apps
- TypeScript plugins
- Markdown skills
- Python or TypeScript services
- Home Assistant YAML
- dashboards and consoles

The argument is that contracts, policies, scenario tests, and instructions must evolve together.

## 5. Recommended Repository Layout

The cleaned architecture repeatedly points to these major areas:

- `docs/architecture`
- `docs/adrs`
- `docs/scenarios`
- `docs/threat-model`
- `openclaw-workspace`
- `apps/ios-bridge`
- `apps/watchos-companion`
- `apps/web-console`
- `services`
- `integrations`
- `infra`

This layout makes the system easier to reason about by separating:

- cognitive runtime
- operating-system bridges
- backend services
- household integrations
- design and safety documentation

## 6. Device Comparison Findings

### Apple Watch

Best for:

- health data
- notifications
- quick interactions
- workout-triggered automation

Reason:

- standardized health stack
- mature connectivity patterns

### Vision Pro

Best for:

- spatial terminal
- agent cockpit
- high-end interaction shell

Not best for:

- continuous health sensing
- low-friction background data collection

### Xiaomi Watch

Useful for:

- data ingestion
- trend analysis
- lower-cost health data collection

Usually requires an intermediate operating-system data layer.

### Rokid

Best viewed as:

- an AR development platform
- a custom app target

Not best viewed as:

- a ready-made general-purpose household or wearable bridge

## 7. Household Control Strategy

The source compares two broad approaches:

### Direct Vendor Integration

`OpenClaw -> vendor cloud or vendor-specific API`

Best only when:

- you need one vendor
- you need advanced vendor-specific features
- you can absorb maintenance burden

### Hub-Based Integration

`OpenClaw -> Home Assistant -> vendor integrations`

Preferred when:

- you need many ecosystems
- you want long-term maintainability
- you want entity and service normalization
- you want local-first behavior when possible

## 8. Control Surfaces

The source distinguishes three control layers.

### Assist-First Natural Language

Good for:

- fuzzy household requests
- area-aware phrasing
- language-level interaction

### Strongly Typed REST and Events

Good for:

- deterministic service calls
- replayable tests
- exact state reads
- scene execution

### Voice and Playback Surface

Good for:

- speech I/O
- broadcast and playback
- external terminal surfaces

But not the household authority layer itself.

## 9. Skills and Plugins

The cleaned distinction is:

- `SKILL.md` teaches the model how and when to use tools
- plugins add actual tools, routes, services, or commands

This supports a layered implementation pattern:

- one skill for household reasoning
- one plugin for Home Assistant control
- optional additional plugins for special vendor adapters

## 10. Example System Behaviors

The source repeatedly returns to a small set of canonical scenarios:

### Heart-Rate Alert

- detect elevated heart rate
- notify user
- run a cooling or comfort action

### Arrive-Home Cooling

- detect arrival
- inspect recent exertion or body state
- turn on fan or climate
- optionally play matching media

### Elder-Care and Living-Alone Support

- monitor routine disruptions
- prompt for check-ins
- escalate carefully when needed

### Standing Reminder and Work Coach

- use time and routine context
- trigger check-ins or prompts

### Affective Companion Behavior

- personalize interaction
- keep long-term continuity
- combine memory with low-risk proactive behavior

## 11. Safety Boundaries

The source is explicit that actuation must be gated.

Low-risk examples:

- fan
- AC preset
- media playback
- reminders

High-risk examples:

- door locks
- cameras
- gas valves
- dangerous appliances

High-risk actions should require stronger confirmation or explicit human approval.

## 12. Practical Takeaways

The cleaned technical conclusion is:

1. Keep OpenClaw focused on cognition, coordination, and channels.
2. Use Home Assistant as the primary device plane.
3. Use typed actions and typed tools.
4. Treat memory and policy as first-class system components.
5. Prefer standardized operating-system data layers for wearables.
6. Separate low-risk and high-risk actuation from the beginning.

## 13. Companion File Usage

- Read `openclaw-jarvis-system-design.en.md` for a fuller English companion reading.
- Read this file when you want most of the technical content without transcript clutter.
- Read `openclaw-jarvis-system-design.structured.en.md` when you want a compressed release-oriented architecture reference.
