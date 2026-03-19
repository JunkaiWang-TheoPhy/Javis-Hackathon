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

This is the current example priority order:

1. `minimal-core`
2. `home-stack`
3. `service-notification-router`

The reason is architectural, not cosmetic:

- the release repo must first prove that Mira core is understandable without modules
- only after that should module and service composition examples become primary
