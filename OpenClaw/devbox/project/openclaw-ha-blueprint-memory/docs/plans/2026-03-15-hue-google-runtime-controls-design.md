# Hue Runtime Controls and Google Readiness Design

## Goal

Extend the new brand-specific plugins so they are more useful in practice without breaking the HA-first architecture:

- make the Hue plugin capable of direct light and scene actions against a local bridge
- keep the Google Home / Nest plugin honest by adding readiness and OAuth-prep tooling instead of fake live control
- wire the bootstrap flow so new plugins can actually be installed into OpenClaw

## Scope

### Philips Hue

Add a small but real direct-control surface:

- list scenes
- turn a light on or off
- set light brightness
- activate a scene

The plugin remains intentionally narrow. It does not attempt full resource coverage or long-running subscriptions.

### Google Home / Nest

Keep this plugin as a preparation layer:

- summarize configuration readiness
- report missing OAuth and project prerequisites
- expose a checklist tool the agent can use when guiding setup

This avoids pretending a server-side token is enough for production Google Home control.

### Bootstrap

Make the plugin install script install the new plugin directories when they are present so the runtime path matches the repository contents.

## API Shape

### Hue

Add tool-level actions instead of a generic raw request tool:

- `hue_list_scenes`
- `hue_control_light`
- `hue_activate_scene`

The input model stays close to OpenClaw intents:

- `lightId`
- `power`
- `brightness`
- `transitionMs`
- `sceneId`

### Google Home / Nest

Add setup-oriented tools:

- `google_home_validate_config`
- `google_home_oauth_checklist`

These tools should produce structured output that tells the agent exactly what is missing and why control is still deferred.

## Configuration

Extend plugin schemas only where the runtime needs real values:

- Hue: optional default transition time and optional expected bridge ID
- Google: optional project number and optional enabled platform list for readiness checks

The sample config remains disabled by default.

## Testing

Add tests that prove:

- Hue requests hit the expected bridge endpoints with the expected payloads
- new Hue tools are registered and return normalized summaries
- Google readiness output reflects missing and present config fields
- the bootstrap script includes the new plugin installs

## Follow-up Work

- route `ha-control` direct-adapter execution into the Hue plugin when a policy allows it
- add Google Home auth callback storage once a client app exists
- add HomeKit bridge-specific diagnostics if HA-only setup friction becomes a problem
