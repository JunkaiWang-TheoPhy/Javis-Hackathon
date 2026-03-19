# Deploy

## Purpose

This section will hold deployment stories for the release version.

## Owns

- deployment model
- environment expectations
- minimal setup paths
- service composition notes

## Does Not Own

- low-level code contracts
- device registry semantics
- private runtime backup procedures

## Planned Contents

- minimal local deployment
- service dependency notes
- release-side configuration templates

## Current Status

The first placeholder deploy path exists under [deploy/minimal](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/minimal).

The release-side deploy shell now also includes:

- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)
- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)
- [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

The first deploy story that combines release-side core with a service path now exists through:

- [examples/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)

So the current deploy reading order is:

1. [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)
2. [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)
3. [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

The page that turns those deploy notes into a single onboarding sequence now lives at:

- [readme/00-overview/getting-started.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/getting-started.md)
