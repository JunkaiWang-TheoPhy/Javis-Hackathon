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
OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/notification-router/config/outbound-policy.yaml
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

### `services/notification-router/config/outbound-policy.yaml`

Audience:

- runtime code

Purpose:

- provide structured `allow / ask / block` rules
- serve as the formal runtime target placement
- define the long-term canonical machine-readable policy path

### `services/rokid-bridge-gateway/config/outbound-policy.yaml`

Audience:

- runtime code during transition

Purpose:

- preserve compatibility during the gateway-to-router convergence period
- support parity checks while `rokid-bridge-gateway` still carries local evaluator logic
- avoid treating the gateway-local file as the only runtime policy source

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

It should also be read as a coexistence model:

- `notification-router/config/outbound-policy.yaml` is the formal runtime target
- `rokid-bridge-gateway/config/outbound-policy.yaml` is a transition-era compatibility copy
- this document explains both at the same time so the repository is not misread as having a single temporary placement

Default rule:

- outbound actions are `ask` by default

The main release-facing exception is:

- low-risk outbound messages to the user themselves may be auto-allowed on approved private channels

This preserves Mira's proactive personality without turning external communication into an unrestricted behavior surface.

The four core contrast rules are:

- `user_self_reminder = allow`
- `user_self_checkin = allow`
- `caregiver_escalation = ask`
- `new_recipient_requires_confirmation = ask`

These rules make the central boundary explicit:

- Mira may proactively reach the user themselves for low-risk private communication
- Mira does not automatically speak to caregivers or new non-self recipients without confirmation

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

- `new_recipient_requires_confirmation`
- `caregiver_escalation`
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

## 11. Current Runtime Ownership State

The repository now contains two runtime YAML placements at the same time:

- `services/notification-router/config/outbound-policy.yaml`
- `services/rokid-bridge-gateway/config/outbound-policy.yaml`

These should not be interpreted as equal long-term owners.

The intended reading is:

- `notification-router/config/outbound-policy.yaml`
  - formal runtime target
  - intended canonical ownership point
- `rokid-bridge-gateway/config/outbound-policy.yaml`
  - transitional compatibility placement
  - still present because the gateway has not fully collapsed to router-only policy ownership

So the repository is no longer in a pure "temporary placement only" phase.

It is now in a coexistence phase:

- the formal runtime home exists
- the transition-layer copy still exists
- the remaining architectural decision is whether the gateway should keep a compatibility copy or stop owning outbound policy entirely

## 12. Final Convergence Direction

The preferred end state remains:

- `notification-router` owns the canonical machine-readable outbound-policy file
- upstream services submit normalized outbound intents
- `rokid-bridge-gateway` no longer acts as an independent primary policy owner
- any remaining gateway-local YAML is either removed or clearly marked compatibility-only

## 13. Change Log

### 2026-03-17

- created the first three-layer outbound-policy layout
- added model-readable outbound guidance to the workspace
- added machine-readable `allow / ask / block` rules
- linked `AGENTS.md` to `OUTBOUND_POLICY.md`

### 2026-03-19

- updated this document to describe the current coexistence of formal and transition-era runtime policy YAML placements
- aligned the policy doc with the service README language used by `notification-router` and `rokid-bridge-gateway`
