# Notification Router Config

## Purpose

This folder holds machine-readable configuration for the formal outbound-delivery service.

For outbound policy, this folder is the intended final runtime location.

## Current State

The repository currently contains two policy YAML placements:

- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml)
- [outbound-policy.yaml](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml)

This should be read as:

- `notification-router/config/outbound-policy.yaml`
  - formal target placement
- `rokid-bridge-gateway/config/outbound-policy.yaml`
  - transitional compatibility placement

## Final Target

The intended end state is:

- this directory is the canonical machine-readable outbound-policy home
- other services call into `notification-router`
- duplicate gateway-local policy ownership is removed or explicitly marked as compatibility-only

## Future Editing Rule

If policy semantics change, the next maintainer should decide whether the change is:

- a formal runtime policy change
- a transition-compatibility change

If it is a formal runtime policy change, this directory should be treated as the primary update point.
