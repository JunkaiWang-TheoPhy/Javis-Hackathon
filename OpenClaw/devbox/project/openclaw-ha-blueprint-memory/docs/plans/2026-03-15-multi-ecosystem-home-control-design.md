# Multi-Ecosystem Home Control Design

## Goal

Turn the existing Home Assistant control plugin into a vendor-aware execution layer that can represent Xiaomi, Matter, Aqara, Tuya, SwitchBot, and similar ecosystems without hard-coding each brand into OpenClaw flows.

## Scope

This design keeps Home Assistant as the default device plane. Vendor ecosystems are described as config-backed device catalogs with aliases, areas, capabilities, and risk metadata. The plugin resolves high-level intents like `turn_on`, `turn_off`, `activate`, or `set_temperature` into constrained Home Assistant service calls.

The design does not implement direct Xiaomi, Aqara, or Tuya cloud APIs in this change. Those remain optional fallback adapters for capabilities that Home Assistant does not expose.

## Architecture

1. Add a multi-ecosystem registry model inside `ha-control`.
2. Let the registry describe devices by ecosystem, vendor, aliases, area, and supported intents.
3. Expose read tools to inspect that registry and one execute tool that routes an intent to a Home Assistant service call.
4. Require per-capability risk metadata so the plugin can refuse or request confirmation before side effects.
5. Keep the existing heart-rate and cooling flows intact.

## Data Model

Each configured ecosystem contains:

- `id`: stable identifier such as `xiaomi-home`
- `vendor`: `xiaomi`, `aqara`, `tuya`, `matter`, `switchbot`
- `integration`: the system actually executing the device, currently `home_assistant`
- `region`: optional region metadata for ecosystems like Xiaomi or Tuya
- `devices`: device entries with aliases, area, entity IDs, and capabilities

Each device contains:

- `id`: stable key
- `entityId`: main Home Assistant entity
- `kind`: `fan`, `light`, `scene`, `switch`, `climate`, `cover`, `sensor`, `button`
- `aliases`: natural-language names OpenClaw can match
- `capabilities`: intent mappings with `domain`, `service`, optional `data`, `requiresConfirmation`, and `riskTier`

## Tooling Changes

Add two new plugin tools:

- `home_list_capabilities`
  Returns the configured ecosystem/device capability registry and supports filtering by ecosystem, vendor, area, or kind.

- `home_execute_intent`
  Resolves a device by `device_id` or alias, checks confirmation requirements, and dispatches a constrained Home Assistant service call.

Keep existing tools:

- `ha_get_state`
- `ha_call_service`
- `ha_process_conversation`
- `home_run_cooling_scene`
- `home_handle_hr_event`

## Safety Model

`home_execute_intent` only dispatches capabilities explicitly present in config. It does not accept arbitrary domains or services. This lets the repo support Xiaomi and other ecosystems through HA while keeping OpenClaw on an allowlist model instead of a free-form actuation model.

## Testing

Add unit tests for:

- registry building
- alias lookup across ecosystems
- confirmation enforcement
- service payload resolution
- area/vendor filtering

## Follow-up Work

- Refactor Rokid bridge action generation to use the same capability registry
- Add vendor-direct adapters only where Home Assistant coverage is insufficient
- Add audit logging and richer policy routing around `riskTier`
