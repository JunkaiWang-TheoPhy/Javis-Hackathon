# Notification Router

## Purpose

`notification-router` is the intended long-term outbound delivery service for Mira.

It is responsible for:

- receiving normalized outbound intents
- evaluating machine-readable outbound policy
- selecting and dispatching through supported channels
- becoming the canonical runtime surface for outbound delivery

It should not own:

- Mira persona rules
- workspace-facing natural-language guidance
- high-level event production logic
- unrelated memory or orchestration responsibilities

## Current Role

At the current repository stage, `notification-router` already exists as a formal runtime service.

Its current direction is:

- act as the canonical dispatch surface
- hold the formal runtime outbound-policy path
- receive intents from upstream services such as `rokid-bridge-gateway`

Relevant files:

- [server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/server.ts)
- [dispatchMessageIntent.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/src/dispatch/dispatchMessageIntent.ts)
- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)

## Final Ownership Direction

The target architecture is:

- `notification-router` owns the machine-readable outbound-policy runtime entry
- upstream services submit normalized `OutboundMessageIntent`
- delivery channels are added here, not duplicated across gateways

This means the router should become the place where:

- outbound policy is enforced
- channel dispatch is executed
- future channels such as email are added

## Relationship To `rokid-bridge-gateway`

`rokid-bridge-gateway` should increasingly behave as:

- an upstream producer of outbound intents
- not the long-term primary owner of outbound delivery policy

The unresolved question is not whether the router exists.

That part is already true.

The unresolved question is:

- whether `rokid-bridge-gateway` should completely stop using its own policy YAML as a primary runtime path

## What Future Work Should Clarify

When tightening the final architecture, this folder should document:

1. whether `config/outbound-policy.yaml` here is the only canonical runtime file
2. whether the gateway retains a fallback copy for compatibility only
3. whether policy loading in the gateway is fully removed

## Recommended Writing Direction

Future implementation and docs in this folder should assume:

- this service is the formal outbound runtime surface
- new channels belong here
- the policy model should converge here
