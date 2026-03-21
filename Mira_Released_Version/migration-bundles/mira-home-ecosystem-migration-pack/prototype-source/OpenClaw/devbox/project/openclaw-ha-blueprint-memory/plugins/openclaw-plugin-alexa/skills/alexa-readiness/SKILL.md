---
name: alexa-readiness
description: Inspect Amazon Alexa smart-home account-linking readiness for this repo.
metadata: {"openclaw":{"requires":{"config":["plugins.entries.alexa.enabled"]}}}
user-invocable: true
---

# Purpose

Use this skill when checking whether Alexa smart-home configuration is ready for future integration work.

# Preferred tools

1. Use `alexa_status` to inspect the current plugin state.
2. Use `alexa_skill_config_summary` to review sanitized Alexa configuration values.
3. Use `alexa_account_linking_checklist` to see which account-linking prerequisites are still missing.

# Rules

- Keep Alexa readiness-only in this phase.
- Do not claim live Alexa device control exists yet.
