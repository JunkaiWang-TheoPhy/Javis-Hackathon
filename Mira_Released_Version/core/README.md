# Mira Core

## Purpose

`core/` is the future independently deployable Mira base package.

## Owns

- persona foundations
- workspace foundations
- OpenClaw config templates
- core skills and plugins
- minimal examples

## Does Not Own

- Home Assistant module logic
- hardware-specific adapters
- long-running service ownership

## Planned Contents

- `persona/`
- `workspace/`
- `openclaw-config/`
- `skills/`
- `plugins/`
- `examples/`

## Current Status

This is now a partially migrated release-side core.

The first migrated files now include:

- [persona/SOUL.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/persona/SOUL.md)
- [persona/IDENTITY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/persona/IDENTITY.md)
- [workspace/AGENTS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/AGENTS.md)
- [workspace/MEMORY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/MEMORY.md)
- [workspace/OUTBOUND_POLICY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md)
- [workspace/TOOLS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace/TOOLS.md)
- [openclaw-config/agent-defaults-snippet.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/agent-defaults-snippet.json5)
- [openclaw-config/custom-right-codes-vision-snippet.example.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/custom-right-codes-vision-snippet.example.json5)
- [openclaw-config/lingzhu-config-snippet.example.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/lingzhu-config-snippet.example.json5)
- [openclaw-config/lingzhu-system-prompt.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/lingzhu-system-prompt.txt)
- [openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)

The first core-only onboarding path now exists through:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)

The remaining source material still lives in:

- [Mira_v1/openclaw-workspace](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-workspace)
- [Mira_v1/openclaw-config](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-config)
- [Mira_v1/lingzhu-bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/lingzhu-bridge)

The only still-unmigrated file inside [Mira_v1/openclaw-workspace](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-workspace) is the dated memory log, which remains intentionally excluded from release core.
