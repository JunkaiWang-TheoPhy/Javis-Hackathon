# OpenClaw Home Ecosystem Progress 2026-03-15

Last checked: 2026-03-15

## Summary

The `0313/openclaw-ha-blueprint` repo now has a clearer multi-ecosystem home-control shape:

- `Home Assistant` remains the primary device plane
- `openclaw-plugin-ha-control` now carries a HA-first ecosystem registry
- `Philips Hue` now has both a direct bridge plugin and an active `directAdapter` route from `ha-control`
- `Google Home / Nest` has a readiness-only plugin that validates setup but does not pretend to offer live control yet
- `Lutron` now has a local bridge session diagnostic layer on top of its HA-first skeleton, including a summarized session-info tool
- `SmartThings` still has a readiness-only HA-first and direct-compatible skeleton
- `HomeKit` remains HA-first only in this repo

## Completed

- Added multi-ecosystem registry metadata to `plugins/openclaw-plugin-ha-control`
- Added sample ecosystem entries for `xiaomi`, `matter`, `aqara`, `tuya`, `switchbot`, `hue`, `homekit`, `google / nest`, `lutron`, and `smartthings`
- Added direct-adapter routing in `ha-control` for supported Hue devices in `auto` and `direct_adapter` modes
- Added `plugins/openclaw-plugin-hue/` with:
  - `hue_status`
  - `hue_list_lights`
  - `hue_list_scenes`
  - `hue_control_light`
  - `hue_activate_scene`
- Added `plugins/openclaw-plugin-google-home/` with:
  - `google_home_status`
  - `google_home_config_summary`
  - `google_home_validate_config`
  - `google_home_oauth_checklist`
- Added `plugins/openclaw-plugin-lutron/` with readiness, config validation, local bridge session testing, and summarized session-info output
- Added `plugins/openclaw-plugin-smartthings/` with readiness and config validation tools
- Updated `scripts/bootstrap-openclaw-plugin.sh` to install the new brand plugins
- Added tests for direct routing, the new brand plugins, and bootstrap script coverage

## What Is Usable Now

### HA-first path

Use `plugins/openclaw-plugin-ha-control/` as the default route for:

- Xiaomi / Mi Home
- Matter
- Aqara
- Tuya
- SwitchBot
- Hue through Home Assistant or the direct adapter route
- HomeKit through Home Assistant
- Google / Nest through Home Assistant-backed entities
- Lutron through Home Assistant-backed entities
- SmartThings through Home Assistant-backed entities

### Direct plugin path

Use `plugins/openclaw-plugin-hue/` when you explicitly want local Hue bridge access.

Use `plugins/openclaw-plugin-google-home/` only for setup and readiness checks. It does not expose live Google device control yet.

Use `plugins/openclaw-plugin-lutron/` for readiness checks and local bridge session diagnostics, including summarized session info. It still does not expose live device control yet.

Use `plugins/openclaw-plugin-smartthings/` for readiness checks only. It does not expose live device control yet.

## Enablement Notes

The new brand plugins are still disabled by default in `openclaw-config/openclaw.json`.

To enable one of them:

1. Keep the plugin installed with `./scripts/bootstrap-openclaw-plugin.sh`
2. Set `plugins.entries.<plugin-id>.enabled = true`
3. Add the plugin id to both `plugins.allow` and `tools.allow`

Examples:

- `hue`
- `google-home`
- `lutron`
- `smartthings`

`homekit` does not have a direct plugin in this repo. Keep it under the HA-first ecosystem registry.

## Still Pending

- Add a real Google Home / Nest OAuth callback flow and token handling
- Add a higher-level Lutron LEAP command layer if direct execution is needed beyond HA
- Add a real SmartThings auth and device-control layer if HA coverage is insufficient
- Add more vendor-direct adapters where Home Assistant coverage is insufficient
- Add brand-specific diagnostics for HomeKit bridge/controller troubleshooting if needed

## Verification

Fresh verification on 2026-03-15:

- `npm test` in `0313/openclaw-ha-blueprint`
- Result: `40/40` tests passed

## Key Files

- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-ha-control/src/ecosystem.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-ha-control/src/index.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-hue/src/index.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-hue/src/client.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-google-home/src/index.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-lutron/src/index.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-lutron/src/session.ts`
- `0313/openclaw-ha-blueprint/plugins/openclaw-plugin-smartthings/src/index.ts`
- `0313/openclaw-ha-blueprint/openclaw-config/openclaw.json`
- `0313/openclaw-ha-blueprint/scripts/bootstrap-openclaw-plugin.sh`
