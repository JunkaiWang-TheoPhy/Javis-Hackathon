# Mira Release Export Package And License Placeholder Design

## Purpose

This note captures the final split-preparation additions for `Mira_Released_Version/`.

## Scope

This pass adds:

- a root `LICENSE.placeholder.md`
- a repository split checklist
- a root export script
- a root export test
- root-level documentation wiring for export and pre-license publication state

## Intended Outcome

After this pass, the release tree should be able to:

- express that no final legal license has been chosen yet
- export itself as a standalone directory package
- verify the exported package as a repository root

## Non-Goals

This pass does not:

- choose the final license
- create the remote repository
- push the exported package anywhere
