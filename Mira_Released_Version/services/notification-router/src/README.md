# Notification Router Source Boundary

## Purpose

This directory holds the first release-side source package for `notification-router`.

## Owns

- service entrypoint boundaries
- channel adapter boundaries
- config loading and dispatch boundaries
- local release-safe outbound contracts
- release-side default outbound policy wiring

## Does Not Own

- outbound policy semantics themselves
- upstream intent production
- Mira persona or workspace rules
- active runtime secrets or provider credentials

## Current Files

- `server.ts`
- `types.ts`
- `config/routerConfig.ts`
- `dispatch/dispatchMessageIntent.ts`
- `routes/dispatchIntent.ts`
- `channels/openclawChannelDm.ts`
- `channels/resendEmail.ts`
- `policy/defaultOutboundPolicy.ts`
- `policy/outboundPolicyLoader.ts`
- `policy/outboundPolicyEvaluator.ts`
- `policy/outboundPolicyTypes.ts`

## Current Status

This is now a self-contained first-pass package, not just a placeholder boundary.

It intentionally owns local types and a built-in default outbound policy so it can be copied into a standalone release repo without importing the active runtime's shared packages.

It now also supports optional file-backed outbound policy loading through `outboundPolicyPath`, so release-side execution can move beyond the built-in defaults when a YAML policy file is present.

The active implementation still lives in:

- [server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/server.ts)
- [dispatch/dispatchMessageIntent.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/dispatch/dispatchMessageIntent.ts)
- [channels/openclawChannelDm.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/channels/openclawChannelDm.ts)
- [channels/resendEmail.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/channels/resendEmail.ts)
- [routes/dispatchIntent.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/routes/dispatchIntent.ts)
- [types.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/types.ts)

Current differences from the active runtime:

- release-side source uses local contracts instead of shared package imports
- release-side source uses local `yaml` dependency resolution inside the release package
- release-side source can load either a built-in default policy or a YAML file path
- release-side source is verified by a smoke test before wider file-by-file migration

Verification entrypoint:

- [release-notification-router-package.test.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/__tests__/release-notification-router-package.test.ts)
- [notification-router.test.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/__tests__/notification-router.test.ts)
