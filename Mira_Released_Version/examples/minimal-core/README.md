# Minimal Core Example

## Purpose

This directory will hold the smallest release-side example that runs Mira core without first-party modules.

## Owns

- minimal core walkthrough notes
- example composition boundaries
- release-safe example expectations

## Does Not Own

- Home Assistant setup
- service runtime implementation
- private environment files

## Planned Contents

- minimal core example README
- required config references
- expected runtime surfaces

## Current Status

This directory now documents the first honest minimal-core path.

## Minimal Core Means

`minimal-core` in this release tree means:

- Mira persona files are present
- a release-safe workspace skeleton is present
- a release-safe OpenClaw config example is present
- no first-party module is required
- no Home Assistant or hardware bridge is assumed

It does not mean this directory alone contains a full OpenClaw runtime bundle.

## Required Files

The current minimal-core path depends on:

- [core/persona/SOUL.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/persona/SOUL.md)
- [core/persona/IDENTITY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/persona/IDENTITY.md)
- [core/workspace/AGENTS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/AGENTS.md)
- [core/workspace/MEMORY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/MEMORY.md)
- [core/workspace/OUTBOUND_POLICY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md)
- [core/workspace/TOOLS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/TOOLS.md)
- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [deploy/core/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/env.example)

## Setup Order

1. Start from [core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/README.md) to understand core boundaries.
2. Read the persona and workspace files under [core/persona](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/persona) and [core/workspace](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace).
3. Copy and adapt [openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json) for the target OpenClaw runtime.
4. Copy and adapt [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/env.example) for local environment values.
5. Confirm the OpenClaw runtime points at the release-side workspace path.

## What You Can Validate

After wiring the above files into a real OpenClaw installation, the minimal-core path should prove:

- Mira can load as a persona-driven workspace
- timezone and compaction defaults are set
- outbound behavior remains policy-gated
- no Home Assistant module is required for the core identity layer

## Next Paths

After the minimal-core path is clear, continue with one of:

- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)
- [services/notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/README.md)
- [modules/home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/README.md)
