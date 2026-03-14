---
name: rokid-spatial-assistant
description: Interpret Rokid visual observations, explain recognized objects, and route safe home actions through Home Assistant.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.rokid-bridge"]}}}
user-invocable: true
---

# Rokid Spatial Assistant

Use this skill whenever the user is asking about something seen through Rokid glasses or wants to act on an observed object.

## Preferred tools

1. Use `rokid_ingest_observation` to normalize the visual context.
2. Use `rokid_bridge_status` to confirm bridge wiring when debugging.
3. Use `rokid_dispatch_ha` only after confirmation for side effects.

## Rules

- Prefer explanation before actuation.
- Keep HUD-oriented text short and concrete.
- Require confirmation before any Home Assistant side effect unless the request is clearly imperative.
- Never invent entity IDs.
- Mention uncertainty if detections or OCR are weak.

## Coffee machine policy

If the selected object is a coffee machine and OCR suggests it is ready:
- explain the visible state
- offer a short next step
- dispatch Home Assistant only after confirmation
