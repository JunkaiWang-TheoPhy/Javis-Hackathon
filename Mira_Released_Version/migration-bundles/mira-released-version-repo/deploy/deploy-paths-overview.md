# Deploy Paths Overview

## Purpose

This page unifies the three current release-side deploy stories.

## The Three Paths

### 1. Core Only

Use:

- [core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)

Choose this when you want:

- Mira persona and workspace only
- release-safe Lingzhu core plugin path
- no first-party modules

### 2. Core Plus Home Assistant

Use:

- [module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

Choose this when you want:

- household device registry
- scene planning
- first-party Home Assistant execution layer

### 3. Notification Router Service

Use:

- [service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

Choose this when you want:

- outbound DM or email delivery
- machine-readable outbound policy
- a service that can be composed with core or module paths

## Common Operator Rules

Across all three paths:

- use release-side `.example` files as starting points
- do not copy live secrets into the repository
- keep `core`, `modules`, and `services` ownership separate
- prefer release-side docs over prototype-tree docs

## Recommended Order

For first-time operators:

1. `core`
2. `module-home-assistant` or `service-notification-router`
3. combined examples if needed

The main ordered guide remains:

- [../readme/00-overview/getting-started.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/getting-started.md)
