# Open-Source Readiness Checklist

## Purpose

This checklist tracks whether `Mira_Released_Version/` is clean enough to be copied into a standalone public repository.

## Ready Items

- release-side documentation shell exists
- `core/`, `modules/`, `services/`, `examples/`, and `deploy/` all have public entrypoints
- source-to-release mapping is documented
- release-side example config files use `.example` naming
- outbound policy ownership is documented as a release-safe pattern

## Required Checks Before Split

- remove installed dependencies such as `node_modules/`
- remove local environment files
- confirm all runtime examples use placeholder credentials
- confirm deploy docs do not rely on private devbox paths
- confirm all top-level docs prefer release-side links over prototype-tree links
- confirm package names and README language are public-facing
- run the shared release verification entrypoint from [package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/package.json)

## Known Remaining Decisions

- final license selection
- release repository name and package namespace normalization
- whether to carry package lockfiles for all release-side packages
- which release-side tests must be copied versus referenced from the active repo

See also:

- [repository-split-readiness.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/repository-split-readiness.md)
- [package-and-license-decisions.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/package-and-license-decisions.md)

## Operator Rule

If a file would be unsafe or confusing in a public repository, do not move it into `Mira_Released_Version/`.
