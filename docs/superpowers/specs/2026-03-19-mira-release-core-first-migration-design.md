# Mira Release Core-First Migration Design

## Purpose

This short design defines the first migration pass for `Mira_Released_Version/core/`.

The goal is not to fully replicate the live workspace.

The goal is to move the first release-safe core materials into the release tree so `core/` becomes real, readable, and reusable.

## Scope

This first pass includes:

- direct migration of stable persona files
- direct migration of the machine-safe outbound-policy workspace file
- direct migration of a minimal timezone config snippet
- sanitized release templates for workspace-level `AGENTS.md`, `MEMORY.md`, and `TOOLS.md`

This first pass excludes:

- daily memory logs
- live devbox state
- node IDs, private device notes, and local operator paths
- runtime URLs, tokens, or environment-specific bridge details
- channel- or hardware-specific config snippets that still need neutralization

## Target Files

Directly migrated:

- `Mira_Released_Version/core/persona/SOUL.md`
- `Mira_Released_Version/core/persona/IDENTITY.md`
- `Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- `Mira_Released_Version/core/openclaw-config/agent-defaults-snippet.json5`

Sanitized templates:

- `Mira_Released_Version/core/workspace/AGENTS.md`
- `Mira_Released_Version/core/workspace/MEMORY.md`
- `Mira_Released_Version/core/workspace/TOOLS.md`

## Design Rules

1. Keep Mira's identity intact.
2. Remove user-specific and environment-specific operational details.
3. Preserve release-safe guidance that still defines Mira's behavior.
4. Prefer templates over leaked private context.
5. Update the release README surface so `core/` no longer reads as a pure placeholder.

## Expected Outcome

After this pass:

- `core/persona/` contains real Mira identity files
- `core/workspace/` contains a release-safe working skeleton
- `core/openclaw-config/` contains at least one real config example
- release documentation can truthfully say that `core/` has begun formal migration
