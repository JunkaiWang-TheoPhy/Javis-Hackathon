# Mira Release Notification Router Migration Design

## Purpose

This design defines the first release-safe migration pass for:

- `Mira_Released_Version/services/notification-router/`

The goal is not to mirror the entire active runtime service tree.

The goal is to move the first public-safe service assets into the release tree so this service can be understood, configured, and later extracted as part of a standalone repository.

## Scope

This pass should include:

- release-side configuration examples
- environment variable templates
- service runtime contract documentation
- source-tree boundary documentation

This pass should not include:

- private credentials
- active runtime test files
- live policy ownership logic duplicated across services
- a full source mirror of the active implementation

## Recommended Migration Shape

The first release-safe set should be:

- `Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml`
- `Mira_Released_Version/services/notification-router/config/env.example`
- `Mira_Released_Version/services/notification-router/src/README.md`
- `Mira_Released_Version/services/notification-router/docs/README.md`
- `Mira_Released_Version/services/notification-router/docs/runtime-contract.md`

Supporting updates should also be made to:

- `Mira_Released_Version/services/notification-router/README.md`
- `Mira_Released_Version/services/README.md`
- `Mira_Released_Version/README.md`

## Design Rules

1. Keep the release tree channel-agnostic but honest about the currently implemented channels.
2. Treat `notification-router` as the canonical outbound runtime surface.
3. Migrate configuration as examples, not as live ownership state.
4. Prefer contract and boundary docs over raw code duplication in this pass.
5. Make the release-side service package look extractable even before source migration is complete.

## Expected Outcome

After this pass:

- `notification-router` in the release tree has real service-facing content
- future maintainers can see its runtime contract and environment model
- release docs can point to a real service package instead of only placeholders
- later source migration can happen file-by-file without redoing the public shell
