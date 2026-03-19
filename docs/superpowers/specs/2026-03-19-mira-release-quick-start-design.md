# Mira Release Quick Start Design

## Goal

Add a release-side quick-start layer that helps readers choose between the three currently real paths:

- `minimal-core`
- `home-stack`
- `service-notification-router`

## Scope

This is a documentation-only step. It does not change runtime code or deploy scripts.

## Design

Create a single quick-start page under `readme/00-overview/` that answers:

1. which path should a new reader choose first
2. what each path proves
3. what files to open next

Then update the top-level release README, docs portal, and examples index to point at this page.

## Non-Goal

This step does not create new example flows. It only makes the current ones easier to discover and compare.
