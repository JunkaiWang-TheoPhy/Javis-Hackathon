# Release Architecture

## Purpose

This directory will hold release-side architecture notes that are more internal than the public reading portal.

## Owns

- architecture addenda
- cross-cutting release structure notes
- internal release decomposition docs

## Does Not Own

- first-read public docs
- deploy walkthroughs
- runtime code

## Planned Contents

- release architecture notes
- service/module/core relationship docs
- future release-side diagrams

## Current Status

This area is no longer only a placeholder.

It currently serves as the internal companion to the public release docs, especially when a change needs to explain:

- why a boundary belongs in `core`, `modules`, `services`, or `deploy`
- why a release-safe package differs from the active runtime
- why some source material is intentionally excluded from public migration

The current public-facing development entrypoint is:

- [readme/50-development/contributing-and-migration.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/readme/50-development/contributing-and-migration.md)
