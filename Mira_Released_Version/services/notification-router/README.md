# Notification Router

## Purpose

This directory is the release-side home for Mira's outbound delivery service.

## Owns

- outbound routing service docs
- release-side service boundary
- future channel integration notes
- canonical outbound-policy ownership notes

## Does Not Own

- workspace persona rules
- module-specific scene planning
- gateway-side event production

## Planned Contents

- service README
- runtime contract notes
- release-safe config examples
- first-pass source package
- `config/README.md`
- `config/outbound-policy.example.yaml`
- `config/env.example`
- `src/server.ts`
- `src/types.ts`
- `src/dispatch/dispatchMessageIntent.ts`
- `src/routes/dispatchIntent.ts`
- `src/channels/`
- `src/policy/`
- `docs/runtime-contract.md`

## Current Status

The active implementation currently lives in the main repository service tree:

- [services/notification-router](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router)
- [services/notification-router/config/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/README.md)

The release-side reading should match the active-repo service docs:

- `notification-router` is the formal outbound runtime target
- its config directory is the intended canonical machine-readable policy home
- `rokid-bridge-gateway` still carries a transition-era compatibility placement in the active repo

The point of this folder is no longer just "reserve the name".

It is to make the final ownership direction explicit before full service migration happens.

The first release-safe service-content files now present here are:

- [config/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/README.md)
- [config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)
- [config/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example)
- [src/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/README.md)
- [src/server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/server.ts)
- [src/types.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/types.ts)
- [src/dispatch/dispatchMessageIntent.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/dispatch/dispatchMessageIntent.ts)
- [docs/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/docs/README.md)
- [docs/runtime-contract.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/docs/runtime-contract.md)

This means the release tree now contains a runnable first-pass source package for:

- `GET /v1/health`
- `POST /v1/dispatch`
- `openclaw_channel_dm` dispatch
- `email` dispatch through a Resend-style adapter

The remaining migration gap is not "make this exist".

It is:

- converge release-side source toward active-runtime parity
- add release-side tests and deploy packaging inside the release tree itself

Recent hardening added:

- local package scripts in [package.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/package.json)
- local YAML-backed policy loading
- a release-side package test in [src/__tests__/notification-router.test.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/__tests__/notification-router.test.ts)

The first release-side composition example that uses this service now lives at:

- [examples/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)

The first advanced composition example that combines this service with the Home Assistant module now also lives at:

- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)
