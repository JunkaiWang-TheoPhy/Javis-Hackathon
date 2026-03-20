# Notification Router Config

## Purpose

This directory will hold release-side machine-readable configuration examples for the formal outbound-delivery service.

## Owns

- release-safe config examples
- canonical runtime policy placement notes
- service-level environment and channel config guidance

## Does Not Own

- Mira persona wording
- gateway-side event production logic
- module-specific scene planning

## Planned Contents

- `outbound-policy.example.yaml`
- `env.example`
- channel environment templates
- provider-specific config notes

## Current Status

The first release-side config examples now present here are:

- [outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)
- [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example)

The active implementation currently uses:

- [notification-router/config/outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)
- [rokid-bridge-gateway/config/outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml)

This should be read as a coexistence state:

- `notification-router/config/outbound-policy.yaml`
  - formal runtime target
- `rokid-bridge-gateway/config/outbound-policy.yaml`
  - transition-era compatibility placement

The release-side goal is to document the formal path here, while still acknowledging the current migration state in the main repository.
