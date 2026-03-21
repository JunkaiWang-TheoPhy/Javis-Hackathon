---
name: lutron-direct
description: Use the Lutron plugin to inspect readiness for future direct Lutron bridge integration.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.lutron.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when checking whether the repo has enough Lutron bridge and LEAP configuration to support a local bridge session and future direct adapter work.

# Preferred tools

1. Use `lutron_status` to inspect current setup state.
2. Use `lutron_config_summary` to review sanitized config values.
3. Use `lutron_validate_config` to see which local certificate prerequisites are still missing.
4. Use `lutron_test_session` to attempt a real local TLS session against the configured bridge.
5. Use `lutron_list_session_info` to get a sanitized summary of the bridge session and peer certificate metadata.

# Rules

- Keep Lutron HA-first for device execution until a higher-level LEAP command layer exists.
- Treat `lutron_test_session` and `lutron_list_session_info` as bridge-session diagnostics, not proof that full local control is implemented.
