# Release Baseline

## Purpose

This document defines the current Git-ready baseline for `Mira_Released_Version/`.

It does not mean the release tree is feature-complete.

It means the current structure is stable enough to be treated as the first public release assembly baseline.

## Baseline Scope

The current baseline includes:

- top-level release portal and documentation shell
- `core/` with release-safe persona, workspace, config, and the first core plugin package
- `modules/home-assistant/` with registry examples, scene planning skeletons, and module docs
- `services/notification-router/` with a runnable first-pass source package
- `examples/` with `minimal-core`, `home-stack`, `service-notification-router`, and combined path docs
- `deploy/` with matching operator-facing paths
- `docs/migration/source-to-release-mapping.md`

## Baseline Exclusions

The current baseline explicitly excludes:

- live secrets and provider credentials
- installed `node_modules/`
- local `.env` files
- devbox runtime state
- session logs and dated working-memory logs
- transport-specific glue that is not yet release-safe

## Baseline Entry Documents

Start here:

- [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/README.md)
- [readme/00-overview/getting-started.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/00-overview/getting-started.md)
- [docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)

## Git Baseline Rules

To keep this baseline stable:

- add release-safe files only
- update mapping docs when source boundaries change
- prefer `.example` and template files over live config
- keep `core`, `modules`, `services`, and `deploy` boundaries explicit

## Next Stabilization Targets

The next pieces that still need more convergence are:

- `modules/home-assistant/plugin/` packaging and runtime contract
- `services/notification-router/` production-facing packaging details
- unified deploy story across `core`, `module-home-assistant`, and `service-notification-router`
- final open-source hygiene pass before repository split
