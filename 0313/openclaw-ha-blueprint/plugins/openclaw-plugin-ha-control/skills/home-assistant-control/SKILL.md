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
2. Use `home_handle_hr_event` for wearable-driven high-heart-rate evaluation.
3. Use `home_run_cooling_scene` when the user explicitly wants the configured arrival/cooling sequence.
4. Use `ha_call_service` for direct Home Assistant control when a specific entity or service is required.
5. Use `ha_process_conversation` only when the user request is naturally phrased and an entity ID is unknown.

# Rules

- Prefer the plugin tools over browser automation for steady-state control.
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
