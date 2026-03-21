# Contributing And Migration

## Purpose

This page explains how to continue building `Mira_Released_Version` without collapsing it back into a raw prototype dump.

## Choose The Right Area First

Before editing anything, decide which release-side area owns the change.

### Use `core/` when the change is about

- Mira persona
- workspace rules
- release-safe OpenClaw config
- release-safe core plugins
- minimal-core examples

### Use `modules/` when the change is about

- domain-specific capabilities that extend Mira but do not define Mira
- Home Assistant
- future wearable, Apple, printer, or other first-party modules

### Use `services/` when the change is about

- long-running backend processes
- outbound routing
- future helper services that should stay outside core and modules

### Use `deploy/` when the change is about

- operator setup order
- environment templates
- service or module startup instructions

### Use `readme/` when the change is about

- public onboarding
- release navigation
- first-read documentation

### Use `docs/` when the change is about

- migration notes
- architecture addenda
- internal release-side structure decisions

## Recommended Migration Order

When moving material from the prototype repository into the release tree, keep this order:

1. `core`
2. `examples/minimal-core`
3. `services`
4. `modules`
5. advanced composition examples
6. internal release docs

That order preserves the main rule:

- `core` must stand on its own before modules and services expand it

## What To Migrate Carefully

Good migration candidates:

- release-safe templates
- transport-neutral helper code
- typed contracts
- public-facing READMEs
- example configs with placeholders

## What Not To Copy Directly

Do not directly mirror:

- live devbox runtime state
- secrets, API keys, tokens, or auth files
- session logs
- dated working-memory logs
- raw private environment paths unless they are being documented as examples
- live transport glue that still depends on unstable runtime details

## Current Internal Companions

Use these internal release docs together:

- [docs/architecture/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/architecture/README.md)
- [docs/migration/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/README.md)
- [migration-bundles/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/migration-bundles/README.md)
- [docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)
- [docs/migration/release-baseline.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/release-baseline.md)
- [docs/migration/open-source-readiness-checklist.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/open-source-readiness-checklist.md)
- [docs/migration/repository-split-readiness.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/repository-split-readiness.md)
- [docs/migration/package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)

## When To Use Imported Migration Bundles

Use the imported bundle layer under `migration-bundles/` when the material did not originate cleanly inside the current release tree, but still needs to stay close to `Mira_Released_Version` for ongoing migration work.

Typical cases:

- home ecosystem support copied from another repo context
- Codex migration prompts and checklists that should travel with the release tree
- standalone release-tree exports kept as a comparison surface

Do not treat these bundles as active runtime roots. They are copied context and migration aids, not replacement entrypoints for the live release structure.

The current imported bundle entrypoint is:

- [migration-bundles/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/migration-bundles/README.md)

## Current Public Entry Companions

Use these public release docs together:

- [readme/00-overview/quick-start.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/quick-start.md)
- [readme/00-overview/getting-started.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/getting-started.md)

## Practical Rule

If a proposed addition makes `Mira_Released_Version` look more like a private backup than a public package, it probably belongs in the main prototype repo or in internal docs, not in the release tree itself.

## Shared Verification Entry

The release tree now exposes a shared root-level verification entry:

```bash
cd Mira_Released_Version
npm run verify:release
npm run export:repo
```
