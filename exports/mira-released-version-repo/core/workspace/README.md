# Workspace

## Purpose

This directory will hold the release-side Mira workspace skeleton.

## Owns

- workspace-level rules
- memory-facing notes
- task and tool boundary docs

## Does Not Own

- service runtime code
- Home Assistant module implementation
- private devbox state

## Planned Contents

- workspace markdown skeleton
- memory guidance
- outbound and heartbeat-facing workspace docs

## Current Status

The first release-side workspace files are now present:

- [AGENTS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/AGENTS.md)
- [MEMORY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/MEMORY.md)
- [OUTBOUND_POLICY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md)
- [TOOLS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/TOOLS.md)

These are either direct release-safe migrations or sanitized templates based on [Mira_v1/openclaw-workspace](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-workspace).

The remaining source file there is:

- [memory/2026-03-15.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-workspace/memory/2026-03-15.md)

That file is intentionally excluded from release core because it is a dated working-memory log rather than reusable workspace structure.
