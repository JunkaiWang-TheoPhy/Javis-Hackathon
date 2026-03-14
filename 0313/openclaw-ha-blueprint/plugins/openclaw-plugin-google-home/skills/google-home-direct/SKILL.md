---
name: google-home-direct
description: Use the Google Home / Nest skeleton plugin to inspect readiness and configuration state.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.google-home.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when working on Google Home / Nest direct integration readiness and setup diagnostics.

# Preferred tools

1. Use `google_home_status` to inspect whether the plugin is configured for future auth flows.
2. Use `google_home_config_summary` to review sanitized Google Home / Nest configuration state.
3. Use `google_home_validate_config` to see which project and OAuth prerequisites are still missing.
4. Use `google_home_oauth_checklist` to guide setup without claiming live device control.

# Rules

- Treat this plugin as a skeleton until a real user-auth flow is implemented.
- Do not claim live Google Home device control from this plugin yet.
- Use readiness tools to surface missing project, OAuth, and platform configuration explicitly.
