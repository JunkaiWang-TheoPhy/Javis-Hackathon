# Rokid Bridge Gateway Config

## Purpose

This folder contains gateway-local configuration.

For outbound policy, it should currently be understood as a transition-layer config location, not the ideal final ownership point.

## Current State

This folder still contains:

- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml)

But the repository now also contains the formal runtime target path:

- [notification-router/config/outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)

So this file should not be described as the only machine-readable policy file anymore.

## How To Read This Folder

Right now this folder should be treated as:

- a transition-era compatibility location
- useful for migration safety and parity checks
- not necessarily the final canonical ownership layer

## Future Decision

The next architectural decision is whether this folder should:

1. keep a compatibility copy of outbound policy for a limited time
2. stop owning outbound policy entirely and rely on `notification-router`

Until that decision is made, changes here should be mirrored consciously with the router-side config and the policy docs.
