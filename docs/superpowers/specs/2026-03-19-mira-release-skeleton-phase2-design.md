# Mira Release Skeleton Phase 2 Design

## Purpose

This design defines the second scaffold pass for `Mira_Released_Version/`.

Phase 1 established the first public shell:

- release portal
- core skeleton
- initial services skeleton
- initial deploy placeholders

Phase 2 should make the release tree read more like a standalone repository by filling the next missing public entrypoints.

## Scope

This pass should stay documentation-only.

It should not:

- migrate more runtime code
- copy live devbox state
- add deploy scripts
- add service implementation

It should:

- add missing top-level release entrypoints
- add second-level module, example, deploy, and docs README files
- make the release tree navigable at the level a public repository would need

## Current Gap

The current release tree already contains:

- `readme/`
- `core/`
- `services/`
- `deploy/`
- `modules/home-assistant/` content

But it still lacks several public-facing skeleton files that a standalone repository would normally expose:

- `modules/README.md`
- `modules/home-assistant/README.md`
- `apps/README.md`
- second-level `examples/` entrypoints
- second-level `deploy/` entrypoints
- second-level `docs/` entrypoints

Without those files, the repository still feels partially internal.

## Design Choice

Phase 2 should add the next public-facing navigation layer rather than deep implementation.

Recommended additions:

- `Mira_Released_Version/modules/README.md`
- `Mira_Released_Version/modules/home-assistant/README.md`
- `Mira_Released_Version/modules/home-assistant/plugin/README.md`
- `Mira_Released_Version/modules/home-assistant/docs/README.md`
- `Mira_Released_Version/modules/home-assistant/registry/README.md`
- `Mira_Released_Version/apps/README.md`
- `Mira_Released_Version/examples/minimal-core/README.md`
- `Mira_Released_Version/examples/home-stack/README.md`
- `Mira_Released_Version/examples/service-notification-router/README.md`
- `Mira_Released_Version/deploy/core/README.md`
- `Mira_Released_Version/deploy/module-home-assistant/README.md`
- `Mira_Released_Version/deploy/service-notification-router/README.md`
- `Mira_Released_Version/docs/architecture/README.md`
- `Mira_Released_Version/docs/migration/README.md`

## Ownership Rules

The new files should follow the same release-shell pattern used in phase 1:

- explain purpose
- explain ownership
- explain non-ownership
- list planned contents
- state current migration status

They should not:

- become changelog dumps
- pretend implementation already exists when it does not
- repeat long architecture docs already stored elsewhere

## Expected Outcome

After this pass:

- `modules/` becomes a visible public module entrypoint
- `home-assistant/` becomes readable as a module package rather than just loose files
- `apps/` exists as an explicit future release area
- `examples/`, `deploy/`, and `docs/` gain second-level repository navigation
- the root release README can describe a more complete public skeleton

This keeps the release tree expanding outward in a controlled way before more code migration happens.
