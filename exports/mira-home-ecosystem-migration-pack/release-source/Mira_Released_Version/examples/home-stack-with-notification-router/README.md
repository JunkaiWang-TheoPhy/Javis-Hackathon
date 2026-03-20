# Home Stack With Notification Router

## Purpose

This directory documents the advanced release-side composition path for Mira core, the Home Assistant flagship module, and the outbound routing service together.

## Owns

- advanced composition notes for `core + home-assistant + notification-router`
- release-safe sequencing for module-plus-service setup
- example-only guidance for household actions plus outbound delivery

## Does Not Own

- Home Assistant administration
- notification-router runtime source
- production orchestration or secret management

## Current Status

This is the first release-side example that combines:

- Mira core
- the first-party Home Assistant module
- the release-side `notification-router`

## Use This Path When

Use this path if you want all of the following at once:

- the household execution surface from `home-stack`
- the policy-gated outbound surface from `notification-router`
- a release-side story for scenes that may also need DM or email delivery

If you only need household execution, stop at:

- [examples/home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)

If you only need core plus outbound delivery, use:

- [examples/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)

## Required Building Blocks

- [examples/home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)
- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)
- [services/notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md)
- [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

## Setup Order

1. Complete the [minimal-core](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md) path.
2. Complete the [home-stack](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md) path.
3. Start the release-side [notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md).
4. Follow the service deploy path in [deploy/service-notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md).
5. Revisit outbound-facing scene and policy expectations in the Home Assistant module docs.

## What This Path Proves

This path is the current release-side proof point for:

- core identity remaining separate from the Home Assistant module
- household execution and outbound delivery remaining separate concerns
- scenes and policies being able to rely on an external outbound service without turning that service into core

## Current Limitations

- this is still an operator guide, not a production packaging guide
- it does not yet ship a full service-to-module runtime integration inside the release tree
- channel credentials and delivery-provider setup remain external
