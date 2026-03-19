# Lingzhu Bridge Core Package

## Purpose

This package preserves the release-safe, transport-neutral pieces of Mira's Lingzhu bridge inside release core.

## Owns

- first-turn branded opening utilities
- memory-context query and injection helpers
- Lingzhu-facing request and config types used by the core bridge layer

## Does Not Own

- the live Lingzhu HTTP transport handler
- image caching or other runtime side effects
- active devbox extension wiring

## Current Release-Safe Contents

- [`src/first-turn-opening.ts`](./src/first-turn-opening.ts)
- [`src/memory-context.ts`](./src/memory-context.ts)
- [`src/types.ts`](./src/types.ts)
- [`tests/first-turn-opening.test.mts`](./tests/first-turn-opening.test.mts)
- [`tests/memory-context.test.mts`](./tests/memory-context.test.mts)

## Source Relationship

This package is migrated from:

- [`Mira_v1/lingzhu-bridge`](../../../../Mira_v1/lingzhu-bridge)

It is intentionally not a full mirror of the live bridge package. The release-side migration keeps only the core-safe helpers that belong under `core/plugins/`.

## Intentionally Excluded For Now

- `src/http-handler.ts`
- image transport helpers tied to the live extension
- runtime-specific debug/event glue

## Verification

Run:

```bash
cd Mira_Released_Version/core/plugins/lingzhu-bridge
npm test
```

## Minimal-Core Integration

The current release-side minimal-core path references this package through:

- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)

The config wiring is defined, but the final plugin installation workflow is still operator-defined.
