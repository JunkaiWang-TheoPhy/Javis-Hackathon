# Migration Bundles

This directory holds imported migration-oriented bundles copied from other repo contexts into the local `Mira_Released_Version/` tree.

These bundles are reference material. They are not wired into the active release runtime, and they should not replace the current release root or deployment entrypoints.

## Included Bundles

- `mira-home-ecosystem-migration-pack`
  - Context bundle for incrementally migrating Mira home ecosystem support.
  - Includes prototype-side source material, release-side source material, a Chinese checklist, and Codex prompt templates.
- `mira-released-version-repo`
  - Exported standalone release-tree snapshot for comparison, selective copying, and repo-split reference.

## How To Use Them

1. Read `mira-home-ecosystem-migration-pack/README.md` first.
2. Use `mira-home-ecosystem-migration-pack/CHECKLIST.zh-CN.md` as the execution checklist.
3. Use `mira-home-ecosystem-migration-pack/PROMPTS.md` when handing migration work to Codex in another repo or a fresh session.
4. Treat `mira-released-version-repo/` as a reference tree for selective copying into `core/`, `modules/`, `services/`, `deploy/`, and `docs/`.
5. Do not run the bundle directories as if they were the live release root.

## Why They Are Here

These bundles were imported because some Mira migration work originated in other repos or in export-only directories. Copying them here keeps the release-side migration context close to the release tree itself, so future Codex sessions do not have to reconstruct the same background from scratch.
