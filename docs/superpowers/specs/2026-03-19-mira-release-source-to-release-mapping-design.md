# Mira Release Source To Release Mapping Design

## Goal

Add a real source-to-release mapping document under `Mira_Released_Version/docs/migration/` and tighten the release-side source boundary notes for `core/plugins` and `services/notification-router`.

## Scope

This step is documentation-only. It does not move new runtime code.

## Design

Create one mapping page that answers:

1. which prototype source trees currently feed the release tree
2. which files are already migrated
3. which files are partially migrated as sanitized examples
4. which files are intentionally excluded

Then update `docs/migration/README.md`, `readme/50-development/contributing-and-migration.md`, `core/plugins/README.md`, and `services/notification-router/README.md` so the mapping and the release-safe source boundaries stay aligned.
