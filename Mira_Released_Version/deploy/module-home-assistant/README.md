# Home Assistant Module Deploy

## Purpose

This directory will hold deployment notes for Mira core plus the Home Assistant flagship module.

## Owns

- module-specific deploy guidance
- module dependency notes
- release-safe setup expectations

## Does Not Own

- Home Assistant instance administration
- service implementation code
- generic core identity docs

## Planned Contents

- core-plus-module setup notes
- registry/config expectations
- module wiring steps

## Current Status

This directory now marks the first concrete deploy path for Mira core plus the Home Assistant flagship module.

## Required Inputs

Use these release-side files together:

- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [modules/home-assistant/config/home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json)
- [modules/home-assistant/registry/devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json)
- [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/env.example)

Optional service dependency:

- [services/notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md)

## Module Deploy Story

This is the intended order:

1. complete the core-only path first
2. copy and adapt [home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json)
3. copy and adapt [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/env.example)
4. map real household devices using [devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json)
5. if outbound self alerts or check-ins matter, prepare the release-side `notification-router`

The advanced example that combines this module path with the outbound service lives at:

- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)

## Current Non-Goals

This path still does not provide:

- Home Assistant installation instructions
- a live module runtime package
- automatic config generation from a running household
