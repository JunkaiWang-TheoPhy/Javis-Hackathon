---
name: hue-direct
description: Use the Hue plugin to inspect a configured Philips Hue bridge, list resources, and run direct light or scene actions.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.hue.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill for Philips Hue bridge checks, scene discovery, and narrow direct bridge actions when the Hue plugin is enabled.

# Preferred tools

1. Use `hue_status` to confirm the bridge is configured and reachable.
2. Use `hue_list_lights` to enumerate bridge lights before adding richer direct controls.
3. Use `hue_list_scenes` before activating a scene by id.
4. Use `hue_control_light` for bounded direct light updates such as power or brightness changes.
5. Use `hue_activate_scene` to recall a known scene by id.

# Rules

- Prefer this plugin for direct Hue bridge inspection.
- Keep Home Assistant as the main execution path unless the user explicitly wants the direct bridge route.
- Prefer typed tools over ad hoc bridge payloads.
