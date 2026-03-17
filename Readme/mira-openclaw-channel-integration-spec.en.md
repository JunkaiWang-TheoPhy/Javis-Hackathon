# Mira OpenClaw Channel-Agnostic Communication Integration Spec

## 0. Relationship Between The Chinese And English Files

This file is the English companion to:

- `mira-openclaw-channel-integration-spec.md`

The two files should remain aligned in topic and roughly aligned in structure so they can be:

- managed together
- copied as a pair into `Mira_Released_Version`
- referenced for Chinese and English readers separately

---

## 1. Document Positioning

This document defines the communication-layer design for Mira in the release version:

- do not keep `Lark / Feishu` as a first-class module
- do not bind Mira to any single communication product
- connect to all supported communication software through `OpenClaw` native channel capabilities
- use a unified `channel contract`, `outbound policy`, and `notification-router` to support proactive messaging

This document complements:

- `messaging-lark-module-positioning.en.md`
- `mira-core-openclaw-relationship-and-proactive-capabilities.en.md`
- `docs/policies/outbound-policy.md`

---

## 2. Conclusion First

Mira's communication layer should be:

- `OpenClaw-native`
- `channel-agnostic`
- `policy-driven`

More precisely:

- `Mira` decides whether a message should be sent, what should be sent, and why
- `OpenClaw` owns channel routing, session binding, and adapter execution
- `notification-router` turns messaging intents into executable channel dispatches
- `outbound policy` decides which outbound behaviors are allowed, which require confirmation, and which must be blocked

So the recommended relationship is not:

```text
Mira -> Feishu / Lark
```

It is:

```text
Mira Core
  -> outbound intent
  -> notification-router
  -> OpenClaw channel / adapter
  -> supported communication software
```

---

## 3. Design Goals

This layer needs to satisfy five goals:

1. Mira must not be locked to any single communication product.
2. Mira should be able to use any current or future OpenClaw-supported channel through one unified interface.
3. Mira's proactive outbound behavior must be policy-governed rather than treated as unlimited by default.
4. The messaging layer must remain clearly decoupled from `Home Assistant`, `wearable`, `memory`, `Rokid`, and other modules.
5. The release directory should be easy to open-source, migrate, and extend.

---

## 4. System Relationship

### 3.1 Mira vs OpenClaw

Inside the communication layer, the responsibilities should remain clear:

- `Mira Core`
  - persona
  - memory
  - interaction policy
  - outbound decision
- `OpenClaw`
  - runtime
  - sessions
  - skills
  - channels
  - cron
  - webhooks
  - plugin host

Therefore:

- Mira is not a bot for a single messaging product
- Mira is a companion-style agent running on top of OpenClaw
- communication software is only a channel surface that OpenClaw can support

### 3.2 Channel-Agnostic Message Path

Recommended path:

```text
trigger
  -> Mira decision
  -> outbound intent
  -> outbound policy evaluation
  -> notification-router
  -> OpenClaw channel
  -> concrete communication app
```

The `trigger` may come from:

- heartbeat
- cron
- event-driven signals

---

## 5. Recommended Release Directory Layout

In `Mira_Released_Version`, the recommended communication layout is not `modules/messaging-lark/`. It is:

```text
channels/
├─ README.md
├─ contracts/
│  ├─ message-channel-contract.md
│  ├─ outbound-intent.schema.json
│  └─ inbound-event.schema.json
├─ policies/
│  └─ outbound-policy.md
├─ examples/
│  ├─ telegram.md
│  ├─ slack.md
│  ├─ discord.md
│  ├─ imessage.md
│  └─ email.md
└─ adapters/
   └─ README.md

services/
└─ notification-router/
   ├─ README.md
   ├─ config/
   │  └─ outbound-policy.yaml
   ├─ src/
   │  ├─ evaluateOutboundPolicy.ts
   │  ├─ dispatchMessageIntent.ts
   │  ├─ resolveChannel.ts
   │  └─ auditLog.ts
   └─ tests/
```

The key point is:

- `channels/` owns channel contracts and integration guidance
- `services/notification-router/` owns runtime execution
- no single communication product should be elevated into a first-class official module

---

## 6. Recommended Placement In The Current Repo

The current repo already has a reasonable transitional layout:

```text
Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md
OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml
docs/policies/outbound-policy.md
Readme/mira-openclaw-channel-integration-spec.md
```

That means:

- `OUTBOUND_POLICY.md`: for Mira to read
- `outbound-policy.yaml`: for code to read
- `docs/policies/outbound-policy.md`: for maintainers to read
- this document: for architecture and release planning

Once `notification-router` becomes a formal service, the runtime file should move to:

- `services/notification-router/config/outbound-policy.yaml`

---

## 7. Channel Contract

### 6.1 Design Principle

Mira should not directly speak to:

- Telegram API
- Slack API
- Discord API
- Feishu API
- email provider APIs

Mira should only speak to a unified messaging-intent layer.

So the channel contract must answer:

- how Mira expresses "what message I want to send"
- how the runtime decides "whether this message may be sent"
- how the router decides "which channel should carry it"

### 6.2 Outbound Intent

Recommended core type:

```ts
type OutboundMessageIntent = {
  intent_id: string;
  created_at: string;
  source: "heartbeat" | "cron" | "event" | "manual";
  message_kind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
  recipient_scope: "self" | "known_contact" | "caregiver" | "group" | "public";
  risk_tier: "low" | "medium" | "high";
  privacy_level: "private" | "sensitive";
  subject?: string;
  content: string;
  preferred_channels?: string[];
  fallback_channels?: string[];
  requires_ack?: boolean;
  respect_quiet_hours?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
};
```

Semantics:

- `message_kind`
  - what kind of product-level message this is
- `recipient_scope`
  - who this message is meant for
- `risk_tier`
  - how risky the action is
- `preferred_channels`
  - which channels should be tried first
- `tags`
  - content tags for policy and audit

### 6.3 Inbound Event

If the system later supports reply loops or confirmations from communication apps, a matching inbound type is recommended:

```ts
type InboundMessageEvent = {
  event_id: string;
  received_at: string;
  channel: string;
  sender_scope: "self" | "known_contact" | "caregiver" | "group_member" | "unknown";
  conversation_id?: string;
  message_text?: string;
  attachments?: Array<Record<string, unknown>>;
  reply_to_intent_id?: string;
  metadata?: Record<string, unknown>;
};
```

### 6.4 Delivery Result

The router and adapters should return a unified result:

```ts
type ChannelDeliveryResult = {
  ok: boolean;
  channel: string;
  delivery_status: "sent" | "queued" | "blocked" | "skipped" | "failed";
  reason?: string;
  external_message_id?: string;
};
```

---

## 8. How Outbound Policy Enters The Chain

### 8.1 Principle

`AGENTS.md` should only hold Mira's broad default restraint rule:

- anything that leaves the machine is ask-first by default

If Mira is to truly send proactive outbound messages, a separate `outbound policy` is required.

### 8.2 The Three-Layer Layout

The current repo already uses a three-layer structure:

1. `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`
   - model-readable boundary
2. `services/.../config/outbound-policy.yaml`
   - machine-enforced rule file
3. `docs/policies/outbound-policy.md`
   - human-readable design explanation

### 8.3 Core Contrast Rules

The four core contrast rules should remain stable:

- `user_self_reminder = allow`
- `user_self_checkin = allow`
- `caregiver_escalation = ask`
- `new_recipient_requires_confirmation = ask`

These four rules should stay fully aligned with the following three-layer files:

- `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`
- `services/.../config/outbound-policy.yaml`
- `docs/policies/outbound-policy.md`

These rules encode a simple principle:

- Mira may proactively reach the user themselves for low-risk private communication
- but Mira should not automatically speak to third parties on the user's behalf

### 8.4 Relationship To The Channel Contract

The `outbound policy` should not care about vendor API details.  
It should only care about:

- `message_kind`
- `recipient_scope`
- `risk_tier`
- `channel class`
- `content tags`

That is what makes the same policy reusable for:

- email
- Telegram
- Slack
- Discord
- iMessage
- any future OpenClaw-supported channel

---

## 9. The Three Proactive Trigger Paths

### 8.1 `heartbeat`

Appropriate for:

- low-frequency, low-risk, context-aware checks
- light reminders
- calm check-ins
- summaries

Typical outputs:

- `user_self_checkin`
- `user_self_summary`
- `user_self_reminder`

Recommended rule:

- default to self only
- default to private channels
- default to respecting quiet hours

### 8.2 `cron`

Appropriate for:

- exact-time reminders
- scheduled summaries
- periodic status delivery
- background jobs isolated from the main session

Typical outputs:

- timed schedule reminders
- nightly summaries
- standing reminders

Recommended rule:

- cron should generate outbound intents
- cron should not bypass outbound policy

### 8.3 `event-driven`

Appropriate for:

- high heart rate
- arriving home / leaving home
- sensor changes
- Home Assistant state changes
- internal memory-state changes

Typical outputs:

- `alert`
- `escalation`
- `summary`
- post-action user notifications

Recommended rule:

- event-driven triggers should pass through a policy engine / confirmation policy first
- if outbound communication is needed, then pass through outbound policy
- if device action is needed, then coordinate with the action router

---

## 10. `notification-router` Responsibility Boundary

### 9.1 What It Should Do

`notification-router` should:

- receive `OutboundMessageIntent`
- load and apply `outbound-policy.yaml`
- decide `allow / ask / block`
- choose preferred and fallback channels
- call the appropriate OpenClaw channel / adapter
- write audit logs
- return a unified delivery result

### 9.2 What It Should Not Do

`notification-router` should not:

- define Mira's persona
- decide what emotional response the user needs
- own long-term memory
- read device truth state
- replace Home Assistant or other action planes
- re-reason from scratch about whether a message is valuable

In short:

- Mira decides whether the message is worth sending
- policy decides whether it may be sent
- router decides how to send it

### 9.3 Boundaries With Other Layers

With `Mira Core`:

- `Mira Core` produces outbound intents
- `notification-router` does not rewrite Mira's persona logic; it only handles policy and delivery

With `Home Assistant`:

- `Home Assistant` should not own general-purpose message routing
- it owns the device authority and action plane

With `memory`:

- `notification-router` may write audit events
- but it does not own long-term memory semantics

---

## 11. Example Flows

### 10.1 Heartbeat Reminder

```text
heartbeat
  -> Mira notices calendar event <2h
  -> build outbound intent(kind=reminder, recipient_scope=self)
  -> outbound policy = allow
  -> notification-router
  -> OpenClaw direct-message channel
  -> user
```

### 10.2 User Private Alert After High Heart Rate

```text
wearable event
  -> policy engine
  -> Mira decides a private alert is needed
  -> build outbound intent(kind=alert, recipient_scope=self, risk=medium)
  -> outbound policy = allow on private channels
  -> notification-router
  -> mobile_notify / DM
  -> user
```

### 10.3 Caregiver Escalation

```text
event
  -> Mira decides escalation may be needed
  -> build outbound intent(kind=escalation, recipient_scope=caregiver)
  -> outbound policy = ask
  -> confirmation flow
  -> if confirmed, notification-router dispatches
```

### 10.4 First Email To A New Recipient

```text
manual or proactive decision
  -> build outbound intent(channel=email, recipient_scope=known_contact)
  -> policy sees first_contact = true
  -> action = ask
  -> no automatic send
```

---

## 12. Current Reality In This Repo

As of the current repo state:

- `openclaw-lark` should be treated only as an existing runtime adapter, not as a release-facing first-class module
- the three-layer outbound-policy structure has already been created
- `notification-router` has not yet been split out into a formal service
- so what is complete today is:
  - the architectural boundary
  - the policy placement
  - the channel-agnostic release narrative
- what is not yet complete is:
  - a real router service that consumes `outbound-policy.yaml`
  - a unified adapter invocation layer for OpenClaw channels

---

## 13. Non-Goals

This spec does not try to:

- write a product spec for every messaging app
- define vendor-specific API details
- put email, Slack, or Telegram directly inside Mira Core
- turn `notification-router` into a device-control center

---

## 14. Recommended Next Steps

Recommended order:

1. create the formal `notification-router` service skeleton
2. wire the current `outbound-policy.yaml` into real `allow / ask / block` evaluation
3. define the actual TypeScript types for `OutboundMessageIntent` and `ChannelDeliveryResult`
4. connect one minimal channel first
   - for example `email` or `OpenClaw private DM`
5. then connect the three trigger sources
   - `heartbeat`
   - `cron`
   - `event-driven`

---

## 15. One-Line Summary

Mira's communication layer should not be a single messaging-product module. It should be:

- Mira produces messaging intents
- OpenClaw owns channels
- outbound policy governs automatic outbound behavior
- notification-router performs unified routing and delivery

That is the channel-agnostic communication architecture that fits `Mira_Released_Version`.
