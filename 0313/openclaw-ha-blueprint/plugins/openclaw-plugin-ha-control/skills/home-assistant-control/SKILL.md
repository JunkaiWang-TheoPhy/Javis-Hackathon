---
name: home-assistant-control
description: Use the ha-control plugin tools to read Home Assistant state, run cooling scenes, and respond to wearable high-heart-rate events.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.ha-control.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill whenever the task is about Home Assistant devices, presence-aware cooling, or the plugin's wearable webhook flow.

# Preferred tools

1. Use `ha_get_state` for read-only checks.
2. Use `home_list_capabilities` to inspect configured Xiaomi, Matter, Aqara, Tuya, SwitchBot, Hue, HomeKit, Google/Nest, and similar ecosystem devices.
3. Use `home_execute_intent` when the user wants a configured multi-ecosystem device action by alias or device ID.
4. Use `home_handle_hr_event` for wearable-driven high-heart-rate evaluation.
5. Use `home_run_cooling_scene` when the user explicitly wants the configured arrival/cooling sequence.
6. Use `ha_call_service` for direct Home Assistant control when a specific entity or service is required.
7. Use `ha_process_conversation` only when the user request is naturally phrased and an entity ID is unknown.

# Rules

- Prefer the plugin tools over browser automation for steady-state control.
- Prefer `home_execute_intent` over raw `ha_call_service` when the target device is represented in the configured ecosystem registry.
- Treat HomeKit as HA-first in this repository: use HomeKit Bridge or HomeKit Device paths instead of inventing a fake direct cloud API.
- Treat Hue and Google/Nest as HA-first for now, while keeping `directAdapter` metadata available for a future direct adapter plugin.
- If the user asks for a direct device action and the entity ID is already known, use `ha_call_service` instead of free-form conversation.
- For heart-rate alerts, always prefer `home_handle_hr_event` so the configured thresholds, dedupe window, notification path, and cooling logic stay consistent.
- For "I'm home and hot after a workout" style requests, prefer `home_run_cooling_scene`.
- When reporting results back, include what entity or scene was triggered.

# Examples

## Read state

Use `ha_get_state` with:

```json
{"entity_id":"fan.living_room"}
```

## Manual cooling scene

Use `home_run_cooling_scene` with:

```json
{"reason":"user requested cooldown after workout"}
```

## List configured ecosystem capabilities

Use `home_list_capabilities` with:

```json
{"vendor":"xiaomi"}
```

You can also inspect newer examples such as:

```json
{"vendor":"hue"}
```

## Intent-based device actuation

Use `home_execute_intent` with:

```json
{"alias":"xiaomi fan","intent":"turn_on","confirmed":true}
```

Additional examples:

```json
{"alias":"hue light","intent":"turn_on","confirmed":true}
```

```json
{"alias":"nest thermostat","intent":"set_temperature","value":23,"confirmed":true}
```

## High heart rate event

Use `home_handle_hr_event` with:

```json
{"heart_rate_bpm":118,"sustained_sec":420,"at_home":true,"post_workout":true,"source":"apple_watch"}
```

## Direct switch actuation

Use `ha_call_service` with:

```json
{"domain":"switch","service":"turn_on","entity_id":"switch.third_reality_wall_switch"}
```
