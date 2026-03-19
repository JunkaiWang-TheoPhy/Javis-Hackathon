# Home Stack Example

## Purpose

This directory will hold a release-side example that composes Mira core with the Home Assistant flagship module.

## Owns

- example composition notes for `core + home-assistant`
- module stack walkthroughs
- example-only release guidance

## Does Not Own

- production deploy recipes
- module implementation itself
- live household configuration

## Planned Contents

- stack overview
- required module pieces
- setup expectations

## Current Status

This directory now documents the first flagship module stack path.

## Home Stack Means

`home-stack` in this release tree means:

- Mira core is present
- the Home Assistant flagship module is added on top
- household state and action planning become available
- optional outbound delivery can be routed through `notification-router`

It does not mean this release tree ships a live Home Assistant instance.

## Required Pieces

The current `home-stack` path depends on:

- [core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/README.md)
- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [modules/home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/README.md)
- [modules/home-assistant/config/home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json)
- [modules/home-assistant/registry/devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json)
- [modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md)
- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

Optional but recommended:

- [services/notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md)
- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)

## Setup Order

1. Start with the core-only path in [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md).
2. Read the module boundary in [modules/home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/README.md).
3. Adapt [home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json) with a real endpoint and token.
4. Review [devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json) to map household roles and devices.
5. Use [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md) as the operator-facing setup path.

## What This Path Proves

This path is the first release-side explanation of how:

- core identity stays independent
- Home Assistant remains a first-party module, not part of core
- scene orchestration consumes registry metadata
- outbound messaging can remain an optional service dependency

If you want to continue from this path into a module-plus-service composition example, use:

- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)
