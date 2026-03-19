# Examples

## Purpose

This directory will hold release-facing examples across core, modules, and services.

## Owns

- example entrypoints
- demonstration layouts
- release-safe walkthrough examples

## Does Not Own

- production service code
- private runtime snapshots
- long-form architecture docs

## Planned Contents

- minimal core example
- module composition examples
- service wiring examples

## Current Status

The first release-side example path now exists:

- [minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)

This is the current example priority order:

1. `minimal-core`
2. `home-stack`
3. `service-notification-router`
4. `home-stack-with-notification-router`

The reason is architectural, not cosmetic:

- the release repo must first prove that Mira core is understandable without modules
- only after that should module and service composition examples become primary

The third path is now an actual composition example:

- [service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)

It connects:

- Mira core
- the release-safe `lingzhu` core plugin path
- `notification-router`

The advanced composition path now also exists:

- [home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)

Use it only after `home-stack`, not before.

If you want a single chooser page before opening the examples themselves, use:

- [readme/00-overview/quick-start.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/quick-start.md)
