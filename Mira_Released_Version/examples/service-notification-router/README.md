# Notification Router Example

## Purpose

This directory will hold release-side examples for outbound routing and channel composition.

## Owns

- service wiring examples
- outbound routing demonstration notes
- release-safe channel composition examples

## Does Not Own

- notification-router runtime source code
- provider credentials
- core persona rules

## Planned Contents

- outbound routing example flows
- DM and email channel examples
- service composition notes

## Current Status

This directory now documents the first release-side composition path that combines Mira core with the outbound routing service.

## Composition Goal

This example is for the case where you want:

- Mira core loaded as a release-safe OpenClaw workspace
- the release-safe `lingzhu` core plugin path enabled
- outbound delivery handled by `notification-router`

It is not a full production stack. It is the first honest release-side path for "core plus outbound service".

## Required Building Blocks

Start from these existing paths:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [core/plugins/lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)
- [services/notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md)
- [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

## Setup Order

1. Complete the [minimal-core](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md) path first.
2. Make the release-safe [lingzhu-bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md) package available to the target OpenClaw runtime.
3. Use the release-side [openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json) so the `lingzhu` plugin entry is enabled in config.
4. Install and start the release-side [notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md).
5. Follow the local deploy path in [deploy/service-notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md).
6. Verify a low-risk self check-in dispatch path before attempting broader outbound flows.

## What This Example Proves

After the above wiring, this example should demonstrate:

- the release tree can describe a real core-plus-service composition path
- Mira core does not require Home Assistant to have a valid outbound story
- outbound delivery remains policy-gated through `notification-router`

## Current Limitations

This example still does not define:

- one mandatory plugin installation workflow
- production-grade secrets handling
- a full OpenClaw binary/runtime bundle inside the release tree
