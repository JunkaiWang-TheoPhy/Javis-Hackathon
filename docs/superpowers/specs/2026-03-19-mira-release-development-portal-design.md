# Mira Release Development Portal Design

## Goal

Turn the release-side development section into an actual contributor and migration entrypoint.

## Scope

This is documentation-only. It will not change runtime code or deploy scripts.

## Design

Add one developer-facing page under `readme/50-development/` that explains:

1. where to start when contributing to the release tree
2. how to choose between `core`, `modules`, `services`, and `deploy`
3. how to migrate material from the prototype repo into the release tree
4. what should never be copied directly

Then update `docs/README.md`, `docs/migration/README.md`, and `docs/architecture/README.md` so the internal release docs area stops being a pure placeholder.
