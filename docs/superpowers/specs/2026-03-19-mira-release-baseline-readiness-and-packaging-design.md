# Mira Release Baseline Readiness And Packaging Design

## Purpose

This design note captures the current convergence step for `Mira_Released_Version/`.

## Scope

This step adds:

- a release-root `.gitignore`
- a release baseline document
- an open-source readiness checklist
- a minimal core runtime contract
- a more formal Home Assistant module package shell
- a more formal notification-router package shell
- a unified deploy-path overview

## Intended Outcome

After this step, `Mira_Released_Version/` should read less like a loose migration sandbox and more like a public repository that already has:

- a stable baseline boundary
- explicit exclusion rules
- package-shaped module and service areas
- a unified operator story across the three deploy paths

## Non-Goals

This step does not:

- create a final standalone repository
- choose a public license
- finish active-runtime parity
- add production container/process packaging
