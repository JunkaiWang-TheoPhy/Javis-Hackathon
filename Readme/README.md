# Readme Documentation Index

## Purpose

This index organizes the documentation stored under `Readme/`, especially the Chinese source files and their English companion editions.

Use this file to:

- quickly find the right document by topic
- understand the relationship between Chinese and English files
- identify which files are full companions versus cleaned or structured release-facing editions

## Naming Conventions

### Chinese Source

- `topic-name.md`

This is usually the original Chinese note, export, or working spec.

### Full English Companion

- `topic-name.en.md`

This is the direct English companion for the source file.

### Clean English Edition

- `topic-name.clean.en.md`

This keeps most of the technical content while removing transcript noise and reorganizing the material into cleaner sections.

### Structured English Edition

- `topic-name.structured.en.md`

This is the highly compressed, release-oriented version intended for later reuse in `Mira_Released_Version`.

## Architecture and Release Docs

- `mira-release-strategy-options.md`
- `mira-release-strategy-options.en.md`
- `mira-released-version-layered-release-architecture.md`
- `mira-released-version-layered-release-architecture.en.md`
- `mira-released-version-layered-release-architecture.html`
- `mira-core-without-home-assistant.md`
- `mira-core-without-home-assistant.en.md`
- `mira-core-openclaw-relationship-and-proactive-capabilities.md`
- `mira-core-openclaw-relationship-and-proactive-capabilities.en.md`
- `mira-home-assistant-flagship-module.md`
- `mira-home-assistant-flagship-module.en.md`
- `home-assistant-module-positioning-options.md`
- `home-assistant-module-positioning-options.en.md`

## Channel, Policy, and Messaging Docs

- `mira-openclaw-channel-integration-spec.md`
- `mira-openclaw-channel-integration-spec.en.md`
- `messaging-lark-module-positioning.md`
- `messaging-lark-module-positioning.en.md`

## Memory, Runtime, and Behavior Docs

- `mira-memory-sleep-and-forgetting-spec.md`
- `mira-memory-sleep-and-forgetting-spec.en.md`
- `2026-03-15-mi-band-automation-plan.md`
- `2026-03-15-mi-band-automation-plan.en.md`

## Repo Context and Operational Docs

- `repo-footprint-overview.md`
- `repo-footprint-overview.en.md`
- `mira-v1-role-in-this-repo.md`
- `mira-v1-role-in-this-repo.en.md`
- `devbox-connectivity-and-sync-overview.md`
- `devbox-connectivity-and-sync-overview.en.md`
- `supported-smart-home-ecosystems.md`
- `supported-smart-home-ecosystems.en.md`
- `conversation-docs-added-2026-03-17.md`
- `conversation-docs-added-2026-03-17.en.md`

## Large Export-Derived Companion Sets

### OpenClaw Jarvis System Design

- `openclaw-jarvis-system-design.md`
- `openclaw-jarvis-system-design.en.md`
- `openclaw-jarvis-system-design.clean.en.md`
- `openclaw-jarvis-system-design.structured.en.md`

### OpenClaw Smart Device Demo

- `openclaw-smart-device-demo.md`
- `openclaw-smart-device-demo.en.md`
- `openclaw-smart-device-demo.clean.en.md`
- `openclaw-smart-device-demo.structured.en.md`

### Vision Pro Development Guide

- `vision-pro-development-guide.md`
- `vision-pro-development-guide.en.md`
- `vision-pro-development-guide.clean.en.md`
- `vision-pro-development-guide.structured.en.md`

## Suggested Reading Paths

### If you want the release architecture first

1. `mira-release-strategy-options.md`
2. `mira-released-version-layered-release-architecture.md`
3. `mira-core-without-home-assistant.md`
4. `mira-home-assistant-flagship-module.md`
5. `mira-openclaw-channel-integration-spec.md`
6. `mira-memory-sleep-and-forgetting-spec.md`

### If you want repo context first

1. `repo-footprint-overview.md`
2. `mira-v1-role-in-this-repo.md`
3. `devbox-connectivity-and-sync-overview.md`
4. `conversation-docs-added-2026-03-17.md`

### If you want the large research-style background set

1. `openclaw-jarvis-system-design.structured.en.md`
2. `openclaw-smart-device-demo.structured.en.md`
3. `vision-pro-development-guide.structured.en.md`

Then go deeper with the corresponding `.clean.en.md` or `.en.md` files.

## Maintenance Rule

When a Chinese source file gets a new English companion:

1. keep the filename stem identical
2. add a `File Relationship` section to the English file
3. update this index if the document is part of the maintained set

## Summary

`Readme/` now functions as a documentation staging area:

- Chinese sources remain the archive of original reasoning
- `.en.md` files provide direct English companions
- `.clean.en.md` files provide cleaner technical versions
- `.structured.en.md` files provide release-facing compressed versions

This makes later migration into `Mira_Released_Version/readme/` much easier.
