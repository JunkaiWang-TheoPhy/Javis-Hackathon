# Source To Release Mapping

## Purpose

This document records how prototype-repo source material is currently being mapped into `Mira_Released_Version`.

## Status Labels

- `Migrated`: the source material already has a release-side counterpart in place.
- `Partially migrated`: only a release-safe or reduced slice has been carried over.
- `Intentionally excluded`: the source material is not supposed to enter the release tree in its current form.

## 1. Mira Persona And Workspace

| Prototype source | Release target | Status | Notes |
| --- | --- | --- | --- |
| `Mira_v1/openclaw-workspace/SOUL.md` | `core/persona/SOUL.md` | Migrated | Direct persona migration. |
| `Mira_v1/openclaw-workspace/IDENTITY.md` | `core/persona/IDENTITY.md` | Migrated | Direct persona migration. |
| `Mira_v1/openclaw-workspace/AGENTS.md` | `core/workspace/AGENTS.md` | Partially migrated | Kept as a sanitized release-safe workspace rule file. |
| `Mira_v1/openclaw-workspace/MEMORY.md` | `core/workspace/MEMORY.md` | Partially migrated | Kept as a release-safe memory policy/template file. |
| `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md` | `core/workspace/OUTBOUND_POLICY.md` | Migrated | Release-safe workspace policy file. |
| `Mira_v1/openclaw-workspace/TOOLS.md` | `core/workspace/TOOLS.md` | Partially migrated | Private runtime details removed. |
| `Mira_v1/openclaw-workspace/memory/2026-03-15.md` | none | Intentionally excluded | Dated working-memory log, not reusable release structure. |

## 2. OpenClaw Config Material

| Prototype source | Release target | Status | Notes |
| --- | --- | --- | --- |
| `Mira_v1/openclaw-config/agent-defaults-snippet.json5` | `core/openclaw-config/agent-defaults-snippet.json5` | Migrated | Direct release-safe migration. |
| `Mira_v1/openclaw-config/custom-right-codes-vision-snippet.json5` | `core/openclaw-config/custom-right-codes-vision-snippet.example.json5` | Partially migrated | Converted to provider-safe example. |
| `Mira_v1/openclaw-config/lingzhu-config-snippet.json5` | `core/openclaw-config/lingzhu-config-snippet.example.json5` | Partially migrated | Converted to release-safe example. |
| `Mira_v1/openclaw-config/lingzhu-system-prompt.txt` | `core/openclaw-config/lingzhu-system-prompt.txt` | Partially migrated | Sanitized to remove private runtime details. |
| active runtime `openclaw.json` shapes | `core/openclaw-config/openclaw.example.json` | Partially migrated | Reconstructed as a release-safe minimal-core config. |

## 3. Lingzhu Bridge To Core Plugins

| Prototype source | Release target | Status | Notes |
| --- | --- | --- | --- |
| `Mira_v1/lingzhu-bridge/src/first-turn-opening.ts` | `core/plugins/lingzhu-bridge/src/first-turn-opening.ts` | Migrated | Transport-neutral helper. |
| `Mira_v1/lingzhu-bridge/src/memory-context.ts` | `core/plugins/lingzhu-bridge/src/memory-context.ts` | Migrated | Transport-neutral helper. |
| `Mira_v1/lingzhu-bridge/src/types.ts` | `core/plugins/lingzhu-bridge/src/types.ts` | Migrated | Shared request/config types. |
| `Mira_v1/lingzhu-bridge/tests/first-turn-opening.test.mts` | `core/plugins/lingzhu-bridge/tests/first-turn-opening.test.mts` | Migrated | Package-local release-side test. |
| `Mira_v1/lingzhu-bridge/tests/memory-context.test.mts` | `core/plugins/lingzhu-bridge/tests/memory-context.test.mts` | Migrated | Package-local release-side test. |
| `Mira_v1/lingzhu-bridge/src/http-handler.ts` | none | Intentionally excluded | Live transport entrypoint still tied to active runtime details. |
| `Mira_v1/lingzhu-bridge/src/image-message-utils.ts` | none | Intentionally excluded for now | Not needed for the first release-safe core plugin slice. |
| `Mira_v1/lingzhu-bridge/tests/image-message-utils.test.mts` | none | Intentionally excluded for now | Deferred with `image-message-utils.ts`. |
| `Mira_v1/lingzhu-bridge/bridge-change.md` | none | Intentionally excluded for now | Historical note, not yet needed as release-side source. |

## 4. Home Assistant Module Material

| Prototype source | Release target | Status | Notes |
| --- | --- | --- | --- |
| `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/*` | `modules/home-assistant/plugin/*` | Partially migrated | Release-side skeletons and docs exist; not full parity. |
| `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/homeassistant-config/*` | `modules/home-assistant/config/*` and `deploy/module-home-assistant/*` | Partially migrated | Release-safe config/example layer only. |
| `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/src/ecosystem.ts` concepts | `modules/home-assistant/registry/devices.example.json` and docs | Partially migrated | Converted into release-side registry model. |
| HA scene and policy ideas from active repo | `modules/home-assistant/docs/scene-resolver-policy-coordination-spec.md` and plugin skeleton | Partially migrated | Architecture-first migration. |

## 5. Notification Router Service

| Active source | Release target | Status | Notes |
| --- | --- | --- | --- |
| `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/package.json` | `services/notification-router/package.json` | Migrated | Release-side service package exists. |
| `.../services/notification-router/src/server.ts` | `services/notification-router/src/server.ts` | Migrated | First-pass runnable release-side service. |
| `.../services/notification-router/src/types.ts` | `services/notification-router/src/types.ts` | Migrated | Release-side contract copy. |
| `.../services/notification-router/src/dispatch/dispatchMessageIntent.ts` | `services/notification-router/src/dispatch/dispatchMessageIntent.ts` | Migrated | Release-side dispatch logic exists. |
| `.../services/notification-router/src/routes/dispatchIntent.ts` | `services/notification-router/src/routes/dispatchIntent.ts` | Migrated | Release-side route exists. |
| `.../services/notification-router/src/channels/openclawChannelDm.ts` | `services/notification-router/src/channels/openclawChannelDm.ts` | Migrated | Release-side first-pass channel path. |
| `.../services/notification-router/src/channels/resendEmail.ts` | `services/notification-router/src/channels/resendEmail.ts` | Migrated | Release-side first-pass email path. |
| `.../services/notification-router/src/config/routerConfig.ts` | `services/notification-router/src/config/routerConfig.ts` | Migrated | Release-side config loader exists. |
| `.../services/notification-router/config/outbound-policy.yaml` | `services/notification-router/config/outbound-policy.example.yaml` | Partially migrated | Example form only; runtime values removed. |
| `.../services/notification-router/src/__tests__/notification-router.test.ts` | `services/notification-router/src/__tests__/notification-router.test.ts` | Migrated | Release-side package test exists. |
| `.../services/notification-router/src/__tests__/release-notification-router-package.test.ts` | none | Intentionally excluded | Active-repo cross-package verification, not part of release package itself. |
| active runtime secrets and provider credentials | none | Intentionally excluded | Must remain outside release tree. |

## 6. Release-Side Examples And Deploy Paths

| Release area | Current role | Status | Notes |
| --- | --- | --- | --- |
| `examples/minimal-core` | core-only path | Migrated | Current first onboarding path. |
| `examples/home-stack` | core plus flagship module | Migrated | Current first module composition path. |
| `examples/service-notification-router` | core plus outbound service | Migrated | Current first core-plus-service path. |
| `examples/home-stack-with-notification-router` | core plus module plus service | Migrated | Current advanced composition path. |
| `deploy/core` | core deploy story | Migrated | Release-safe operator guide. |
| `deploy/module-home-assistant` | module deploy story | Migrated | Release-safe operator guide. |
| `deploy/service-notification-router` | service deploy story | Migrated | Release-safe operator guide plus helper scripts. |

## 7. Global Exclusions

The following classes should stay out of the release tree unless they are converted into examples or stripped templates:

- live secrets, tokens, and provider credentials
- devbox runtime state
- session logs and dated working-memory logs
- raw private environment paths presented as facts rather than examples
- unstable live transport glue that still depends on active runtime assumptions
- installed `node_modules/` directories

## Current Rule Of Thumb

If a source artifact explains Mira in a reusable, public, release-safe way, migrate it.

If it mainly reflects a live machine, live service, or private operating environment, document it in the prototype repo or in internal notes instead of copying it directly into `Mira_Released_Version`.
