# Rokid Bridge Gateway

## Purpose

`rokid-bridge-gateway` is an upstream orchestration and event-handling service.

Its broader responsibilities include:

- observation ingestion
- memory ingestion and retrieval
- sleep / forgetting orchestration
- confirmation flows
- producing outbound intents

It is not the ideal long-term home for outbound channel ownership.

## Current Outbound Role

At the current stage, the gateway does two outbound-related things:

- it still contains outbound-policy evaluation code and a local policy YAML
- it now forwards real outbound dispatch requests to `notification-router`

Relevant files:

- [server.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/server.ts)
- [notificationRouterClient.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/outbound/notificationRouterClient.ts)
- [outboundDispatch.ts](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/src/routes/outboundDispatch.ts)
- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml)

## Architectural Interpretation

This service is currently in a transition state.

That means:

- it is no longer only a local outbound-policy evaluator
- it is not yet fully reduced to a pure intent-producing client of `notification-router`

So the correct reading is:

- transitional co-ownership exists
- final ownership is not yet fully collapsed

## Open Decision

The next strict-convergence decision is:

- should `rokid-bridge-gateway` fully stop treating its own YAML as a primary runtime policy source and only call `notification-router` for outbound delivery decisions and dispatch

There are two acceptable future shapes:

- compatibility mode
  - keep a local YAML temporarily for migration safety
- strict final mode
  - make `notification-router` the only canonical runtime policy owner

## Recommended Final Direction

The preferred long-term direction is:

- `rokid-bridge-gateway` produces normalized outbound intents
- `notification-router` owns policy enforcement and channel dispatch
- the gateway keeps no independent primary outbound-policy ownership

## Documentation Use

This README exists to make future refactoring easier.

When the repository tightens the final outbound shape, this file should be updated together with:

- [outbound-policy.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/docs/policies/outbound-policy.md)
- [Notification Router README](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/README.md)
- [rokid-bridge-gateway config README](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/README.md)
