# Services

## Purpose

This directory will hold release-side long-running backend services.

## Owns

- service boundaries
- service-specific README entrypoints
- release-safe service shells

## Does Not Own

- core persona rules
- module-specific UI docs
- deploy recipes themselves

## Planned Contents

- `notification-router/`
- release-side service config skeletons
- future helper services when they are stable enough for release

## Current Status

The first release-side service area is now:

- [notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router)

That service entry now includes a matching config skeleton:

- [notification-router/config/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/README.md)
- [notification-router/config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)
- [notification-router/config/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example)
- [notification-router/src/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/README.md)
- [notification-router/src/server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/server.ts)
- [notification-router/src/types.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/types.ts)
- [notification-router/docs/runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/docs/runtime-contract.md)
- [notification-router/docs/operator-checklist.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/docs/operator-checklist.md)

The current release-side interpretation is:

- `notification-router` is the formal outbound service target
- gateway-local outbound policy still exists in the active repo as a transition-era compatibility layer
- release docs should describe both, but treat the router as the long-term ownership point

This means the release tree has now started the first real content migration for `notification-router`, not only placeholder README files.

The current release-side service package is still a first pass:

- it is self-contained on purpose
- it uses a built-in default outbound policy object
- it should later converge toward active-runtime parity without losing release portability

The current package naming and lockfile policy are tracked in:

- [../docs/migration/package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)
