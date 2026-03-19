# Home Assistant Module

## Purpose

This directory is Mira's first-party flagship module for household execution.

## Owns

- household control module boundaries
- registry examples
- plugin skeletons
- scene-planning documentation

## Does Not Own

- Mira core persona
- generic outbound service ownership
- device firmware or direct hardware driver stacks

## Planned Contents

- module overview docs
- plugin implementation skeleton
- registry samples
- deploy notes for the Home Assistant module

## Current Status

The first release-side module assets already present here are:

- [docs/scene-resolver-policy-coordination-spec.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md)
- [docs/module-runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/module-runtime-contract.md)
- [docs/package-assembly-checklist.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/package-assembly-checklist.md)
- [registry/devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json)
- [config/home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json)
- [plugin/package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/package.json)
- [plugin/tsconfig.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/tsconfig.json)
- [plugin/src/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/src/README.md)

This README turns those files into a public module entrypoint rather than a loose implementation subtree.

The first module onboarding path now exists through:

- [examples/home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)
- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

The first advanced module-plus-service composition path now also exists through:

- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)

The canonical migration record for this module now also lives at:

- [../docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)
