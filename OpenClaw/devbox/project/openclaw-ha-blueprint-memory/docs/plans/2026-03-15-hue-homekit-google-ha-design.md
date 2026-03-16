# Hue, HomeKit, and Google-Nest HA-First Expansion Design

## Goal

Extend the multi-ecosystem Home Assistant registry to cover Philips Hue, Apple HomeKit, and Google/Nest while keeping the data model compatible with future direct adapters for Hue and Google/Nest.

## Scope

This change remains HA-first:

- Hue uses Home Assistant entities backed by the Hue bridge integration.
- HomeKit uses Home Assistant HomeKit Bridge or HomeKit Device paths only.
- Google/Nest uses Home Assistant entities exposed through Google/Nest-compatible integrations and exposed-entity workflows.

This change does not add live direct adapter code. It only adds metadata so direct adapters can be added later without changing the contracts again.

## Data Model Changes

Add forward-compatible fields:

- `connectionMode`: describes whether the ecosystem is currently routed via `home_assistant`, `bridge`, `cloud_api`, or `hybrid`.
- `directAdapter`: optional string naming the future direct adapter, such as `hue-local` or `google-home`.
- `externalIds`: optional device-level map for bridge IDs, Nest device IDs, accessory IDs, and similar future adapter references.

Expose these fields through registry summaries so future adapter work does not require another model migration.

## Brand Modeling

### Philips Hue

- ecosystem id: `hue-home`
- vendor: `hue`
- connection mode: `bridge`
- future direct adapter hint: `hue-local`
- common kinds: `light`, `scene`, `sensor`, `button`

### Apple HomeKit

- ecosystem id: `homekit-home`
- vendor: `homekit`
- connection mode: `bridge`
- no direct adapter in this phase
- common kinds: `light`, `switch`, `climate`, `cover`, `lock`

### Google/Nest

- ecosystem id: `google-nest-home`
- vendor: `google`
- connection mode: `cloud_api`
- future direct adapter hint: `google-home`
- common kinds: `climate`, `camera`, `doorbell`, `speaker`, `light`

## Testing

Add tests that prove:

- registry summaries keep the new compatibility metadata
- filters can narrow devices by connection mode
- example configs for Hue, HomeKit, and Google/Nest parse and surface through the tool layer

## Follow-up Work

- add `plugins/openclaw-plugin-hue/` direct skeleton
- add `plugins/openclaw-plugin-google-home/` direct skeleton
- refactor registry execution to optionally dispatch through a direct adapter when present
