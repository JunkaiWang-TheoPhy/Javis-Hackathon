# Notification Router Runtime Contract

## Purpose

This document explains the release-safe runtime surface for `notification-router`.

It describes:

- what the service accepts
- what it returns
- how channels are selected
- which configuration files shape its behavior

## Service Role

`notification-router` is Mira's canonical outbound-delivery service.

It should:

- receive normalized outbound intents
- evaluate machine-readable outbound policy
- select an allowed channel
- dispatch through that channel

It should not:

- invent outbound policy at runtime
- produce high-level events
- own Mira persona or workspace guidance

## Current Endpoints

### `GET /v1/health`

Purpose:

- simple service liveness check

Current response shape:

```json
{
  "ok": true,
  "service": "notification-router"
}
```

### `POST /v1/dispatch`

Purpose:

- evaluate and dispatch one normalized outbound intent

Expected request body:

```json
{
  "intent": {
    "intent_id": "intent-001",
    "created_at": "2026-03-19T10:00:00.000Z",
    "source": "heartbeat",
    "message_kind": "checkin",
    "recipient_scope": "self",
    "risk_tier": "low",
    "privacy_level": "private",
    "content": "Time for a quick check-in.",
    "preferred_channels": ["openclaw_channel_dm"],
    "fallback_channels": ["email"]
  }
}
```

The release-side package currently owns a local first-pass contract layer:

- [types.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/types.ts)

These local types mirror the active runtime contract shape closely enough for migration work, but they are intentionally self-contained for release portability.

## Channel Model

The current active runtime supports:

- `openclaw_channel_dm`
- `email`

Current adapters are:

- webhook-based DM dispatch
- Resend-backed email dispatch

Release-safe configuration should therefore document both channels, without assuming any private provider credentials.

## Policy Loading Model

The current release-side first pass supports two policy-loading modes:

1. built-in default policy
2. explicit YAML file path supplied through `outboundPolicyPath`

The built-in default path uses:

- [defaultOutboundPolicy.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/policy/defaultOutboundPolicy.ts)
- [outboundPolicyLoader.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/policy/outboundPolicyLoader.ts)

The file-backed path uses the release package's own `yaml` dependency rather than the active runtime package graph.

The example YAML remains the release-side documentation target:

- [config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)

## Configuration Surface

The release-side config package should be read as:

- [config/outbound-policy.example.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/outbound-policy.example.yaml)
  - example machine-readable policy
- [config/env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/config/env.example)
  - example environment variables for DM and email channels

Current active runtime references:

- [config/outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)
- [src/config/routerConfig.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/config/routerConfig.ts)

Release-side first-pass source now includes:

- [src/config/routerConfig.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/config/routerConfig.ts)
- [src/channels/openclawChannelDm.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/channels/openclawChannelDm.ts)
- [src/channels/resendEmail.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/services/notification-router/src/channels/resendEmail.ts)

## Dispatch Flow

The intended runtime flow is:

1. upstream service submits `OutboundMessageIntent`
2. `notification-router` loads outbound policy
3. it evaluates channel candidates in priority order
4. it dispatches the first allowed and configured channel
5. it returns a structured decision plus delivery result

Current active dispatch implementation:

- [src/dispatch/dispatchMessageIntent.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/dispatch/dispatchMessageIntent.ts)

## Migration Rule

This release-side contract document exists so later source migration can stay aligned with:

- canonical service ownership
- shared outbound contracts
- release-safe configuration examples

It should evolve before or alongside any file-by-file source migration, not after it.

That condition is now partially met: the release tree already contains a runnable first-pass source package, plus a local package test that verifies YAML-backed policy loading.
