# Core

## Purpose

This section explains the independently deployable Mira core.

## Owns

- persona boundaries
- workspace skeleton
- OpenClaw config intent
- core skill and plugin boundaries

## Does Not Own

- Home Assistant logic
- hardware adapters
- channel-specific runtime services

## Planned Contents

- core architecture
- core directory map
- minimum viable runtime story

## Current Status

The release-side core implementation has started.

The first migrated core files now live under [core](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core), with direct persona files, sanitized workspace templates, and a broader release-safe OpenClaw config set that now includes:

- agent defaults
- a custom vision-provider example
- a sanitized Lingzhu plugin config example
- a sanitized Lingzhu runtime system prompt

The first minimal-core onboarding path is now present through:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)
- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
