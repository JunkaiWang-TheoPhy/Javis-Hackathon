# Mira Release Core Plugin Lingzhu Bridge Design

## Goal

Migrate the first release-safe slice of `Mira_v1/lingzhu-bridge` into `Mira_Released_Version/core/plugins/lingzhu-bridge` without copying the live transport handler.

## Scope

This migration includes only transport-neutral files that belong to Mira core:

- `src/first-turn-opening.ts`
- `src/memory-context.ts`
- `src/types.ts`
- package-local tests and README

This migration does not include:

- `src/http-handler.ts`
- image caching and live bridge side effects
- active devbox runtime wiring

## Design

The release-side package will be a small standalone TypeScript package with its own `package.json`, `tsx` test script, and `.gitignore`.

Its responsibility is to preserve three core plugin behaviors:

1. first-turn branded opening utilities
2. memory-context query and injection helpers
3. Lingzhu-facing transport-neutral request/config types

The package README will explicitly document that the live transport adapter remains outside release core and will be migrated separately, if at all.

## Migration Boundary

`Mira_Released_Version/core/plugins/lingzhu-bridge` is a core plugin helper package, not a full runtime extension mirror.

It should be safe to publish as documentation-backed source material without secrets, runtime endpoints other than documented localhost defaults, or vendor-specific live bridge glue.
