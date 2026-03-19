# Policies

## Purpose

This folder is the human-facing policy documentation layer.

It exists to explain:

- why a policy exists
- which runtime or workspace file enforces it
- whether the repository is still in a transition state
- what the intended final placement should be

It is not the machine-enforced policy directory.

## Current Outbound Policy State

The outbound-policy system currently exists in both transitional and formalized forms.

The relevant files are:

- [outbound-policy.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/docs/policies/outbound-policy.md)
- [OUTBOUND_POLICY.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md)
- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml)
- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)

Interpretation:

- `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`
  - model-readable outbound rules for Mira
- `services/rokid-bridge-gateway/config/outbound-policy.yaml`
  - transition-era machine-readable policy placement
- `services/notification-router/config/outbound-policy.yaml`
  - formal target runtime placement
- `docs/policies/outbound-policy.md`
  - maintainer explanation and migration narrative

## Why This README Exists

The repository has moved past the earlier state where outbound policy only lived under `rokid-bridge-gateway`.

That means future edits should no longer describe the system as:

- "temporary until notification-router exists"

Instead, future edits should describe it as:

- "a transitional period where both the gateway-era policy file and the notification-router policy file coexist"

## Final Target

The intended final shape is:

- `notification-router` owns the machine-readable outbound policy
- `rokid-bridge-gateway` becomes a client of `notification-router`
- this `docs/policies/` folder explains that ownership clearly

## Open Decision

The main unresolved architecture decision is:

- whether `rokid-bridge-gateway` should fully stop treating its own YAML as a primary runtime input and only dispatch through `notification-router`

That decision should be captured in both:

- [outbound-policy.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/docs/policies/outbound-policy.md)
- the service README files under `notification-router/` and `rokid-bridge-gateway/`

## Next Documentation Step

When the repository is ready to tighten the final architecture wording:

1. Update [outbound-policy.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/docs/policies/outbound-policy.md) so it explicitly says both transitional and formal runtime placements currently exist.
2. Decide whether `rokid-bridge-gateway` still owns a local policy file or only proxies to `notification-router`.
3. Once that decision is made, update the service READMEs and config READMEs together.
