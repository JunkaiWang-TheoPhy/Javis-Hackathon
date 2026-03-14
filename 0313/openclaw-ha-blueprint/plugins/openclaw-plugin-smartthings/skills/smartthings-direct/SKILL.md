---
name: smartthings-direct
description: Use the SmartThings plugin to inspect readiness for future direct SmartThings integration.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.smartthings.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when checking whether the repo has enough SmartThings configuration to support a future direct adapter.

# Preferred tools

1. Use `smartthings_status` to inspect readiness.
2. Use `smartthings_config_summary` to review sanitized cloud config.
3. Use `smartthings_validate_config` to see which minimum SmartThings prerequisites are still missing.

# Rules

- Keep SmartThings HA-first until a real direct auth and device-control layer exists.
- Treat this plugin as readiness tooling, not live SmartThings control.
