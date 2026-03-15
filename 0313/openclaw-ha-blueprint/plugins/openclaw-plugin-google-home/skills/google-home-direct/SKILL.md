---
name: google-home-direct
description: Use the Google Home / Nest skeleton plugin to inspect readiness and configuration state.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.google-home.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when working on Google Home / Nest direct integration readiness and setup diagnostics.

# Preferred tools

1. Use `google_home_status` to inspect config and token-aware auth state.
2. Use `google_home_config_summary` to review sanitized Google Home / Nest configuration state.
3. Use `google_home_validate_config` to see which project and OAuth prerequisites are still missing.
4. Use `google_home_oauth_checklist` to guide setup without claiming full live device control.
5. Use `google_home_auth_status`, `google_home_build_auth_url`, and `google_home_token_summary` when working through the shared auth gateway flow.

# Rules

- Treat this plugin as auth-flow-capable but not yet a broad live-control surface.
- Do not claim general Google Home device control from this plugin yet.
- Use readiness and token tools to surface missing project, OAuth, platform, and callback configuration explicitly.
