# Repository Split Readiness

## Purpose

This document tracks whether `Mira_Released_Version/` is ready to become its own repository.

## Already Ready

- release-side top-level portal exists
- `core/`, `modules/`, `services/`, `examples/`, `deploy/`, and `docs/` all have public entrypoints
- source-to-release mapping exists
- a Git baseline has already been established in the current repo
- release-side installed dependencies are no longer carried in the tree
- a release-root workspace and verification entrypoint now exist

## Ready Enough For Initial Split

The current tree is ready enough for an initial split if the goal is:

- creating a dedicated public repository root
- continuing migration work there
- preserving the current release architecture and docs

## Still Open Before Public Launch

- final license selection
- final package namespace policy confirmation
- confirmation of whether both release-side `package-lock.json` files should stay
- optional CI/bootstrap setup for release-side packages
- final pass over README language and public wording

## Recommended Split Order

1. copy `Mira_Released_Version/` into a dedicated repository
2. carry over the related release design and plan docs if desired
3. add a final `LICENSE`
4. decide whether to keep or regenerate lockfiles
5. add CI for the runnable release-side packages

## Companion Documents

- [release-baseline.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/release-baseline.md)
- [open-source-readiness-checklist.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/open-source-readiness-checklist.md)
- [package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)
