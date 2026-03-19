# Core Plugins

## Purpose

This directory will hold runtime plugins that belong to Mira core.

## Owns

- core runtime plugin contracts
- release-safe plugin boundaries

## Does Not Own

- first-party module implementations
- long-running backend services
- hardware-side adapters

## Planned Contents

- minimal core plugin scaffolds
- release plugin registration notes

## Current Status

The first release-side core plugin package now exists:

- [lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)

This first migrated package intentionally includes only release-safe, transport-neutral bridge helpers:

- first-turn opening utilities
- memory-context helpers
- Lingzhu request and config types

The live transport handler remains outside release core for now.

## Current Source Boundary

Currently migrated into release core:

- `Mira_v1/lingzhu-bridge/src/first-turn-opening.ts`
- `Mira_v1/lingzhu-bridge/src/memory-context.ts`
- `Mira_v1/lingzhu-bridge/src/types.ts`
- two package-local tests for those helpers

Currently excluded from release core:

- `Mira_v1/lingzhu-bridge/src/http-handler.ts`
- `Mira_v1/lingzhu-bridge/src/image-message-utils.ts`
- transport-specific live extension glue

The canonical migration record now lives at:

- [docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)
