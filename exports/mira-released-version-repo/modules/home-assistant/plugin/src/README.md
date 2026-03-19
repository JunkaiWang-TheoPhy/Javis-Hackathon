# Home Assistant Plugin Source Boundary

## Purpose

This directory contains the release-side source skeleton for Mira's Home Assistant flagship module plugin.

## Owns

- scene definitions
- scene resolution
- scene execution planning
- device registry loading
- risk, confirmation, and outbound policy hooks

## Does Not Own

- Home Assistant instance deployment
- notification service ownership
- Mira core persona files

## Current Files

- `registry/loadDevicesRegistry.ts`
- `scenes/sceneDefinitions.ts`
- `scenes/sceneResolver.ts`
- `scenes/scenePlanExecutor.ts`
- `policies/riskPolicy.ts`
- `policies/confirmationPolicy.ts`
- `policies/outboundPolicyAdapter.ts`

## Current Status

This is a release-side source skeleton, not yet a parity-complete live runtime package.

It is already sufficient to explain:

- how device registry data is consumed
- how scenes become plans
- how plan execution depends on Home Assistant and outbound contracts

## Current Source Boundary

Currently migrated into release-side plugin source:

- scene definition and resolution skeletons
- policy hook skeletons
- plan executor skeleton
- registry loading helper

Currently not yet carried as release-side module runtime source:

- active-runtime package metadata and test harness
- full Home Assistant dispatch client implementation
- active-runtime plugin registration glue
- provider-specific or environment-bound integration details

The canonical migration record now lives at:

- [../../../docs/migration/source-to-release-mapping.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/docs/migration/source-to-release-mapping.md)
