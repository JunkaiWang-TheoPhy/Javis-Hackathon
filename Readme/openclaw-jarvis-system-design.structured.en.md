# OpenClaw Jarvis System Design (Structured English Edition)

## File Relationship

- Chinese source: `openclaw-jarvis-system-design.md`
- Full English companion: `openclaw-jarvis-system-design.en.md`
- Clean English companion: `openclaw-jarvis-system-design.clean.en.md`
- Structured English companion: `openclaw-jarvis-system-design.structured.en.md`

This file is the highly compressed, release-oriented English edition. Use it as the reusable architecture summary for `Mira_Released_Version`, not as a transcript replacement.

## Release Summary

Build the system as:

`OpenClaw runtime + memory and policy services + Home Assistant device plane + wearable and app bridges`

Do not build it as:

- a prompt-only repo
- a vendor-by-vendor protocol stack inside OpenClaw
- a smart-home system without memory, policy, and companion behavior

## Product Positioning

The target is a Jarvis-style ambient agent with:

- persistent context
- proactive but policy-constrained action
- wearable and home integration
- typed household execution
- companion-style continuity

## System Roles

### OpenClaw

Owns:

- runtime
- sessions
- skills
- plugins
- channel surfaces
- proactive orchestration hooks

Does not own:

- low-level household protocol stacks
- raw wearable collection
- per-vendor cloud logic for every ecosystem

### Home Assistant

Owns:

- household entities
- services
- scenes
- event subscriptions
- multi-vendor device normalization

### Wearable and App Bridges

Own:

- HealthKit and watch bridges
- geofencing and presence ingress
- OS-level notifications
- normalized upstream events

## Recommended Stack

### Household Control

`vendor ecosystems -> Home Assistant -> OpenClaw tools and policies`

### Wearable Context

`wearable sensors -> phone or OS data layer -> bridge app -> OpenClaw`

### Spatial Interface

Use Vision Pro or similar devices as:

- operator surface
- spatial dashboard
- demo shell

## Core Internal Layers

1. device and sensor layer
2. event and context layer
3. memory layer
4. policy layer
5. typed action layer

The release should emphasize layers 3 to 5. That is where the system becomes a Jarvis-style agent instead of a device dashboard.

## Required Memory Classes

- working memory
- episodic memory
- semantic memory
- routine memory
- care memory

This supports continuity, compression, prioritization, and future sleep-forgetting flows.

## Typed Action Model

Preferred actions:

- `notify_user`
- `run_scene`
- `set_climate`
- `play_media`
- `request_checkin`
- `escalate_caregiver`

Avoid:

- unrestricted model-generated raw service calls

## Integration Priorities

Recommended device priority for practical integration:

1. Apple Watch
2. Vision Pro
3. Xiaomi Watch
4. Rokid

Why:

- integration quality follows standardized data and automation surfaces more than hardware novelty

## Release Repo Implications

A release-quality repo should keep:

- architecture docs
- ADRs
- scenario docs
- threat model docs
- OpenClaw workspace
- mobile and wearable bridges
- memory and policy services
- dashboards
- integration modules

## Safety Boundary

Separate:

- low-risk comfort and reminder actions
- medium-risk household actions
- high-risk privacy and physical-security actions

High-risk actions must not share the same approval path as low-risk comfort actions.

## Durable Decisions

1. OpenClaw stays the cognitive runtime.
2. Home Assistant is the first-party household execution plane.
3. Memory and policy are first-class system components.
4. Typed tools and typed actions are mandatory.
5. Monorepo structure is justified because contracts, scenarios, and runtime rules must evolve together.

## Recommended Use

- Use the Chinese source as the archive.
- Use `.en.md` for broad English reading.
- Use `.clean.en.md` for fuller technical context.
- Use this file when extracting release architecture into `Mira_Released_Version`.
