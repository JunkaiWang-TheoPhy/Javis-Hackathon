# Codex Migration Prompts

This file extracts the most useful Codex prompts from the bundle README and turns them into copy-paste templates.

Use these in the **target repo**, not in this source repo.

The assumption is:

- Mira is already deployed in another repository
- the old conversation memory does not carry over
- you want Codex to use this bundle as migration context
- you want **incremental migration**, not a rewrite

---

## 1. Context Bootstrap

```text
Please read _migration/mira-home-ecosystem-migration-pack/README.md
and systematically inspect both prototype-source and release-source.
Then tell me how to incrementally migrate the Home Assistant flagship module,
notification-router, and the 12 smart-home named entries into the current repository.

Requirements:
- Do not assume prior conversation memory still exists.
- Do not rewrite the current repository from scratch.
- Treat this as incremental migration into an already deployed Mira repo.
```

---

## 2. Source-To-Target Mapping Only

```text
Based on _migration/mira-home-ecosystem-migration-pack,
produce a source-to-target mapping for the current repository.

Requirements:
- Mapping only for now.
- Do not modify files yet.
- Clearly distinguish prototype-source from release-source.
- Call out what can be copied, what must be adapted, and what must remain excluded.
```

---

## 3. Incremental Migration Guardrails

```text
This is incremental migration, not reconstruction.
Please respect the current repository structure and absorb the migration pack in-place.
Do not turn the current repository into another monorepo.
Do not assume old session memory still exists.
Use only the current repository and the migration pack files as context.
```

---

## 4. Wave 1: Release-Side Home Assistant Module Shell

```text
Please migrate only the release-side Home Assistant module shell first.

Use:
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/modules/home-assistant/
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/examples/home-stack/README.md
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/deploy/module-home-assistant/README.md

Requirements:
- Migrate docs, config, registry, and plugin package shell.
- Do not migrate all direct adapters yet.
- Do not break the current deployed structure.
- Prefer additive changes and compatibility.
```

---

## 5. Wave 2: Expand To 12 Named Ecosystems

```text
Please extend the current home module so it formally covers 12 named smart-home entries.

Use:
- _migration/mira-home-ecosystem-migration-pack/prototype-source/Readme/supported-smart-home-ecosystems.md
- _migration/mira-home-ecosystem-migration-pack/prototype-source/docs/openclaw-ha-ecosystem-progress-2026-03-15.md
- _migration/mira-home-ecosystem-migration-pack/prototype-source/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/src/ecosystem.ts
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/modules/home-assistant/registry/devices.example.json

Requirements:
- First add support matrix, ecosystem docs, registry slots, and config slots.
- Prefer HA-first routing.
- Do not promise full direct runtime for all 12 entries in the first pass.
- Keep 1 formal home module, not 12 separate modules.
```

---

## 6. Wave 3: Migrate Direct Adapter Boundaries One By One

```text
Please migrate only one direct-adapter boundary at a time.

Start with:
- Hue

Use the migration pack as source context.

Requirements:
- First migrate README, boundary docs, package shell, and operator notes.
- Do not migrate other ecosystems in the same pass.
- Keep HA-first as the default route.
```

---

## 7. Wave 4: Bring In Notification Router

```text
Please incrementally migrate the release-side notification-router into the current repository.

Use:
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/services/notification-router/
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/workspace/AGENTS.md

Requirements:
- Align it with the current outbound policy structure.
- Preserve the current deployed notification path where possible.
- Do not break the current runtime while introducing the release-side service structure.
```

---

## 8. Wave 5: Rebuild Long-Term Workspace Context, Not Old Chat Memory

```text
Do not attempt to migrate old session memory.

Instead, rebuild release-safe long-term workspace context using:
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/workspace/AGENTS.md
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/workspace/MEMORY.md
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md
- _migration/mira-home-ecosystem-migration-pack/release-source/Mira_Released_Version/core/openclaw-config/openclaw.example.json

Requirements:
- Reconstruct stable workspace rules and memory policy.
- Do not copy ephemeral conversation history.
- Do not introduce live-machine assumptions from the source repo.
```

---

## 9. Static Verification Before Installation

```text
Before running or installing anything, please do static verification only:
- check migrated paths
- check config examples
- check package metadata
- check README vs runtime contract consistency

Do not start services yet.
If extra env.example files, operator docs, or package scripts are needed, add them incrementally.
```

---

## 10. Installation Pass

```text
Now begin the installation pass.

Requirements:
- Install incrementally, not all at once.
- Prefer this order:
  1. modules/home-assistant/plugin
  2. services/notification-router
  3. optional direct adapters
- Preserve compatibility with the current repository structure.
- Report exactly what was installed and what still remains pending.
```

---

## 11. Smoke Test Pass

```text
Now do a local smoke-test pass.

Requirements:
- verify the Home Assistant module can read config and registry
- verify notification-router can load config and start
- do not enable all 12 ecosystem paths at once
- prefer one narrow test path first, then expand

Summarize what works, what is still mocked, and what is still docs-only.
```

---

## 12. Twelve-Entry Support Matrix Pass

```text
Please produce or update the home-ecosystem support matrix for these 12 named entries:
- Amazon Alexa
- Apple Home
- HomeKit
- Xiaomi / Mi Home
- Matter
- Aqara
- Tuya / Smart Life
- SwitchBot
- Philips Hue
- Google Home / Nest
- Lutron
- SmartThings

For each entry, include:
- support level
- runtime path
- whether direct adapter is needed
- operator prerequisites
- current implementation status
```

---

## 13. Safe Prompt If The Current Repo Already Has Similar Structures

```text
The current repository may already contain its own home-control, notification, or workspace-rule structure.

Please:
- compare the existing structure against the migration pack
- prefer merge/adapt over overwrite
- preserve deployable current behavior
- only introduce changes that move the repository closer to Mira release structure
```

---

## 14. Safe Prompt If You Want Codex To Move Slowly

```text
Please work in small waves.

For each wave:
1. inspect the relevant migration-pack files
2. propose the exact incremental changes
3. implement only that wave
4. run verification
5. summarize remaining risks before moving on

Do not opportunistically do later waves early.
```

---

## 15. Human Reminder

When using these prompts:

- keep the migration pack intact inside the target repo until the migration is complete
- do not expect Codex to remember prior sessions
- always force it to read the bundle first
- always emphasize “incremental migration” and “do not overwrite current deployment”
