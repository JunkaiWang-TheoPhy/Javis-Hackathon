# Quick Start

## Purpose

This page helps new readers choose the right first path inside `Mira_Released_Version`.

If you already know you want the recommended order instead of a comparison view, use:

- [getting-started.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/getting-started.md)

## The Three Current Paths

### 1. Minimal Core

Start here if you want to understand Mira itself before adding modules or services.

Use:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)

This path proves:

- Mira core can stand on its own
- persona, workspace, config, and the release-safe `lingzhu` core plugin can be explained without Home Assistant

### 2. Home Stack

Go here next if you want to see Mira extended by the first-party flagship module.

Use:

- [examples/home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)
- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

This path proves:

- `core/` and `modules/home-assistant/` stay separate
- Home Assistant is a first-party module, not part of core identity

### 3. Core Plus Notification Router

Choose this when you want to see Mira core composed with an outbound service.

Use:

- [examples/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)
- [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

This path proves:

- Mira can have a release-side outbound story without Home Assistant
- outbound behavior stays policy-gated through `notification-router`

## Recommended Order

If you are reading this release tree for the first time, use this order:

1. `minimal-core`
2. `home-stack`
3. `service-notification-router`

That order matches the architecture:

1. understand core
2. add the first-party flagship module
3. add the first outbound service path

## If You Only Want One Path

- Choose `minimal-core` if you care most about Mira identity and release structure.
- Choose `home-stack` if you care most about household execution.
- Choose `service-notification-router` if you care most about outbound delivery and policy.
