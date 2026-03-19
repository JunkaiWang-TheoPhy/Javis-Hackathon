# Mira Release Split Readiness Design

## Purpose

This note captures the next open-source cleanup pass for `Mira_Released_Version/`.

## Scope

This pass adds:

- a release-side changelog
- repository split readiness notes
- package and license decision notes
- package namespace normalization for `notification-router`

## Intended Outcome

After this pass, the release tree should be easier to copy into its own repository without ambiguity about:

- whether the current tree is split-ready
- how package names should look
- how lockfiles should be treated
- which public-repo documents still remain open decisions
