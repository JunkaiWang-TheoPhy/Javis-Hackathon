# Minimal Runtime Contract

## Purpose

This document defines the smallest honest runtime contract for Mira core inside the release tree.

It describes what an external OpenClaw runtime must provide in order to load the current release-safe core package.

## Required Inputs

The current minimal contract depends on:

- [openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [agent-defaults-snippet.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/agent-defaults-snippet.json5)
- [lingzhu-system-prompt.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/lingzhu-system-prompt.txt)
- [../workspace/AGENTS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/AGENTS.md)
- [../workspace/MEMORY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/MEMORY.md)
- [../workspace/OUTBOUND_POLICY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md)
- [../plugins/lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)

## External Runtime Assumptions

The release tree still assumes an external OpenClaw runtime provides:

- agent loading
- workspace mounting
- model provider wiring
- plugin discovery or plugin path registration
- session storage and runtime process management

The release tree does not currently bundle OpenClaw itself.

## Minimal Core Outcome

When the current contract is satisfied, the release-side minimal core should provide:

- Mira persona files
- release-safe workspace rules
- release-safe outbound policy guidance
- release-safe Lingzhu bridge helpers
- a documented OpenClaw config example

## Current Non-Goals

This contract does not yet guarantee:

- packaged runtime installation
- one-click local bootstrap
- bundled module loading
- production secrets management
- service orchestration

## Matching Paths

Operator-facing path:

- [../../deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)

Example path:

- [../../examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
