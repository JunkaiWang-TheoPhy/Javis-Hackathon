# OpenClaw Config

## Purpose

This directory will hold release-side OpenClaw configuration templates for Mira.

## Owns

- config templates
- example runtime wiring
- release-safe defaults

## Does Not Own

- persona wording
- module-specific runtime logic
- private live secrets

## Planned Contents

- example config fragments
- release-safe runtime defaults
- environment template notes

## Current Status

This directory is now partially migrated with release-safe config material from
[Mira_v1/openclaw-config](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-config).

Current files:

- [agent-defaults-snippet.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/agent-defaults-snippet.json5)
- [custom-right-codes-vision-snippet.example.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/custom-right-codes-vision-snippet.example.json5)
- [lingzhu-config-snippet.example.json5](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/lingzhu-config-snippet.example.json5)
- [lingzhu-system-prompt.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/lingzhu-system-prompt.txt)
- [openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)

File relationship:

- `agent-defaults-snippet.json5` is a direct migration.
- `custom-right-codes-vision-snippet.example.json5` is a release-safe example derived from the source custom provider snippet.
- `lingzhu-config-snippet.example.json5` is a templated release-safe variant of the source Lingzhu plugin config.
- `lingzhu-system-prompt.txt` is a sanitized runtime prompt that removes devbox-specific node and bridge details while preserving Mira behavior.
- `openclaw.example.json` now wires the release-safe `lingzhu` core plugin into the minimal-core story by reusing the current `plugins.entries.lingzhu` config shape.

At this point, every file from [Mira_v1/openclaw-config](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-config) has a release-side counterpart under this directory.

The current minimal runtime contract now also lives at:

- [minimal-runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/minimal-runtime-contract.md)
