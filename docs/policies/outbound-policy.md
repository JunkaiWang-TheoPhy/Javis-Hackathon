# Outbound Policy

## 1. Purpose

This document defines Mira's outbound-policy architecture and the current repository layout for it.

The goal is to separate three concerns:

- what Mira should understand
- what the runtime should enforce
- what humans should maintain

This document is the human-facing explanation layer.

## 2. File Layout

The current three-layer layout is:

```text
Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md
OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml
docs/policies/outbound-policy.md
```

### `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`

Audience:

- Mira

Purpose:

- provide model-readable outbound boundaries
- refine `AGENTS.md` for actions that leave the machine
- explain what is allowed, what requires confirmation, and what is blocked

### `services/rokid-bridge-gateway/config/outbound-policy.yaml`

Audience:

- runtime code

Purpose:

- provide structured `allow / ask / block` rules
- serve as the temporary machine-enforced policy file
- prepare the later move to `services/notification-router/config/outbound-policy.yaml`

### `docs/policies/outbound-policy.md`

Audience:

- maintainers

Purpose:

- explain policy intent
- document field meanings
- record examples and future migration direction

## 3. Why This Is Separate From `AGENTS.md`

`AGENTS.md` should continue to hold Mira's broad persona and default behavioral stance.

It is not a good place to store the full outbound-governance system because outbound policy needs to be:

- more explicit
- more structured
- easier to audit
- easier to evolve independently from persona wording

So the division is:

- `AGENTS.md`: default ask-first behavior
- `OUTBOUND_POLICY.md`: model-readable outbound exceptions and boundaries
- `outbound-policy.yaml`: machine-enforced rules

## 4. Current Policy Model

The current model is intentionally conservative.

Default rule:

- outbound actions are `ask` by default

The main release-facing exception is:

- low-risk outbound messages to the user themselves may be auto-allowed on approved private channels

This preserves Mira's proactive personality without turning external communication into an unrestricted behavior surface.

## 5. Current Allowed Classes

The initial auto-allowed classes are:

- `user_self_reminder`
- `user_self_checkin`
- `user_self_summary`
- `user_self_private_alert`

These all share the same baseline constraints:

- recipient scope is `self`
- recipient is already known
- channel is private
- public surfaces are excluded
- audit logging is expected

`user_self_private_alert` is the broadest allowed class, but it is still constrained:

- it stays private
- it is intended for the user's benefit
- it should be concise
- it should avoid unnecessary sensitive detail

## 6. Current Ask Classes

The initial ask-gated classes are:

- first message to a new recipient
- messages to caregivers
- messages to groups
- third-party messages containing sensitive material

This means the system remains proactive toward the user, but conservative toward everyone else.

## 7. Current Blocked Classes

The initial blocked classes are:

- public posts
- social posting
- secret or credential exfiltration
- raw private workspace data being sent out

These are blocked rather than merely ask-gated because they sit on the wrong side of the intended trust boundary.

## 8. Quiet Hours

Current quiet hours are:

- `23:00-08:00` in `Asia/Shanghai`

Interpretation:

- low-priority reminders should wait or require confirmation
- routine emails should wait or require confirmation
- urgent private self-alerts may still be allowed through private channels

## 9. Evaluation Order

When a candidate outbound action is produced, the intended evaluation flow is:

1. Normalize the outbound intent.
2. Determine `message_kind`, `recipient_scope`, `risk_tier`, `channel`, and `content_tags`.
3. Apply hard blocks first.
4. Apply quiet-hours and private-channel requirements.
5. Match explicit allow rules.
6. If no allow rule matches, fall back to `ask`.
7. Log the decision and reason.

This keeps the system biased toward restraint while still allowing carefully chosen proactive behavior.

## 10. Current Schema Intent

The YAML file is designed around a small stable vocabulary:

- `message_kind`
- `recipient_scope`
- `risk_tier`
- `allowed_channels`
- `content_tags`
- `conditions`
- `action`

The intended actions are:

- `allow`
- `ask`
- `block`

That keeps the runtime semantics simple enough to implement incrementally.

## 11. Future Migration

The current runtime file lives under:

- `services/rokid-bridge-gateway/config/outbound-policy.yaml`

This is a temporary placement because there is no dedicated `notification-router` service in the current repo layout yet.

When that service is formalized, the machine-readable policy should move to:

- `services/notification-router/config/outbound-policy.yaml`

At that point:

- `rokid-bridge-gateway` should consume it rather than own it
- other event sources should also route through the same policy file

## 12. Change Log

### 2026-03-17

- created the first three-layer outbound-policy layout
- added model-readable outbound guidance to the workspace
- added machine-readable `allow / ask / block` rules
- linked `AGENTS.md` to `OUTBOUND_POLICY.md`
