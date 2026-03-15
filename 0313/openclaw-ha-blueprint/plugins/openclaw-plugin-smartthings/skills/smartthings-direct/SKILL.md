---
name: smartthings-direct
description: Use the SmartThings plugin to inspect readiness for future direct SmartThings integration.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.smartthings.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when checking whether the repo has enough SmartThings configuration to support a future direct adapter.

# Preferred tools

1. Use `smartthings_status` to inspect readiness and direct-control availability.
2. Use `smartthings_config_summary` to review sanitized cloud config.
3. Use `smartthings_validate_config` to see which minimum SmartThings prerequisites are still missing.
4. Use `smartthings_list_devices`, `smartthings_get_device_status`, and `smartthings_execute_command` for the minimal live-control surface.

# Rules

- Keep SmartThings HA-first for broad automation strategy.
- Treat the new runtime surface as intentionally minimal, not a full SmartThings platform wrapper.
