# Home Assistant Module Package Assembly Checklist

## Purpose

This checklist defines what must be present before the release-side Home Assistant module can be treated as a stable module package.

## Required Package Elements

- [../README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/README.md)
- [../config/home-assistant-module.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/config/home-assistant-module.example.json)
- [../registry/devices.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/registry/devices.example.json)
- [../plugin/package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/package.json)
- [../plugin/tsconfig.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/tsconfig.json)
- [../plugin/src/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/plugin/src/README.md)
- [module-runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/module-runtime-contract.md)
- [scene-resolver-policy-coordination-spec.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md)

## What Still Counts As Incomplete

The release-side module should still be considered in-progress if any of these are missing:

- clear package metadata
- source-boundary doc for the plugin
- runtime contract doc
- registry example
- scene coordination spec
- operator-facing deploy path

## Matching Deploy Path

- [../../deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)
