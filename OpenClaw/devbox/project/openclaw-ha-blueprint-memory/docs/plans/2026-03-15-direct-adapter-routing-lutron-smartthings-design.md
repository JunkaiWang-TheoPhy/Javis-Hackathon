# Direct Adapter Routing, Lutron, and SmartThings Design

## Goal

Advance the multi-ecosystem home-control work in the next practical order:

- make `ha-control` use the configured `directAdapter` path for supported Hue devices
- add a `Lutron` HA-first and direct-compatible skeleton
- add a `SmartThings` HA-first and direct-compatible skeleton

## Why This Order

### Hue first

Hue already has:

- ecosystem metadata in `ha-control`
- a direct plugin
- a realistic local bridge API

So this step converts existing metadata into an actual execution path instead of adding more placeholders.

### Lutron second

Lutron fits the same HA-first plus direct-compatible pattern well:

- Home Assistant already supports Lutron Caseta and related bridge-backed systems
- Lutron exposes LEAP-based integration paths
- the direct path is local-network oriented, which matches the current repo better than another cloud-first adapter

### SmartThings third

SmartThings is useful but heavier:

- HA integration exists and is cloud-backed
- SmartThings has multiple API surfaces, including a Home API preview and cloud APIs
- a repo skeleton should stay honest and readiness-oriented until a clearer auth and device-control strategy is implemented

## Direct Adapter Routing Design

`home_execute_intent` should accept a routing preference:

- `auto`
- `home_assistant`
- `direct_adapter`

Behavior:

- `auto`: use direct adapter when a supported direct adapter is configured and enabled, otherwise fall back to Home Assistant
- `home_assistant`: always dispatch to Home Assistant
- `direct_adapter`: require a direct path and fail if it is not available

For this phase, only `hue-local` is implemented as a direct executor.

## Hue Execution Scope

Support these direct Hue intents from `ha-control`:

- `turn_on`
- `turn_off`
- `set_brightness`
- `activate`

The executor should rely on configured `externalIds` such as:

- `hueLightId`
- `hueSceneId`

If required IDs are missing, `auto` falls back to Home Assistant and `direct_adapter` fails.

## Lutron Skeleton Scope

Add a plugin boundary for `Lutron` with readiness tooling only:

- status
- config summary
- config validation

Model it around HA-first execution plus future direct compatibility with a `lutron-leap` adapter hint.

## SmartThings Skeleton Scope

Add a plugin boundary for `SmartThings` with readiness tooling only:

- status
- config summary
- config validation

Model it around HA-first execution plus future direct compatibility with a `smartthings-api` adapter hint.

## Config and Registry Changes

Extend sample config with:

- richer Hue example IDs for direct routing
- disabled plugin entries for `lutron` and `smartthings`
- ecosystem registry entries for `lutron-home` and `smartthings-home`

## Testing

Add tests that prove:

- `home_execute_intent` can route a configured Hue device through the direct path
- `home_execute_intent` falls back to HA when direct routing is unavailable in `auto` mode
- `direct_adapter` mode errors when no supported adapter is available
- `Lutron` and `SmartThings` plugins register their readiness tools
- bootstrap installs the new plugins
