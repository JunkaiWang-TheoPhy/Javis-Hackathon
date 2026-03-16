# Should `messaging-lark` Be Kept As A First-Class Module?

## 0. Relationship Between The Chinese And English Files

This file is the English companion to:

- `messaging-lark-module-positioning.md`

The two files should remain aligned in topic and roughly aligned in structure so they can be:

- managed together
- copied as a pair into `Mira_Released_Version`
- referenced for Chinese and English readers separately

---

## 1. Purpose

This document records a release decision that has now been explicitly settled:

- whether `Mira_Released_Version` should keep `openclaw-lark / Feishu` as a first-class module
- what design should replace it if the answer is no
- how the current Lark / Feishu implementation should be positioned in the workspace

---

## 2. Final Release Decision

The formal conclusion is now:

- `Mira_Released_Version` should not keep `Lark / Feishu` as a first-class module
- the release version should not define `modules/messaging-lark/`
- Mira's communication layer should instead be `OpenClaw-native` and `channel-agnostic`
- in other words, Mira should connect to any supported communication software through OpenClaw's native channel capabilities

More precisely:

- `Mira` should not be bound to a single communication product
- `OpenClaw` should remain the layer that owns channel routing and message delivery surfaces
- communication apps are just channel / adapter surfaces for OpenClaw

---

## 3. Why It Should Not Remain A First-Class Module

### 3.1 Mira Is Fundamentally Built On Top Of OpenClaw

Mira's core identity is not an IM bot. It is:

- persona
- memory
- policy
- interaction behavior

All of that runs on top of `OpenClaw`.

So the more accurate relationship is:

- `OpenClaw = runtime + sessions + skills + channel routing`
- `Mira = a companion-style agent layer running on top of OpenClaw`

If `Lark / Feishu` is promoted into a first-class release module, Mira is too easily misframed as:

- a Feishu bot
- an agent defined by a specific enterprise communication product

That would distort the actual system boundary.

### 3.2 The Release Version Should Be Channel-Agnostic

If the goal is to spin `Mira_Released_Version` into a public standalone repository later, the communication layer should be:

- channel-agnostic
- replaceable
- extensible

rather than:

- implicitly bound to one region-specific collaboration product

From the release perspective, the following should live on the same abstraction layer:

- Telegram
- WhatsApp
- Slack
- Discord
- iMessage
- email
- and any other messaging surfaces OpenClaw supports later

### 3.3 This Keeps The Module Boundaries Clean

If `messaging-lark` remains a first-class module, the module system starts drifting away from capability boundaries:

- `home-assistant` is an environment execution module
- `rokid` is a device / interaction module
- `wearable-*` are sensing-event modules
- `printer` is an execution module
- `messaging-lark` would instead be a single-vendor communication product module

That makes the release architecture look organized around current plugin names rather than stable system boundaries.

The cleaner release boundary is:

- `core/` for Mira itself
- `modules/` for capability modules
- `channels/` or `OpenClaw native channels` for communication software integration

---

## 4. Replacement Design: Communication Through OpenClaw Native Channels

The recommended structure is not:

```text
Mira -> messaging-lark -> user
```

It is:

```text
User
  ↓
Supported communication app
  ↓
OpenClaw channel / adapter
  ↓
Mira Core
  ↓
Optional modules and actions
```

This means:

- Mira does not directly depend on Feishu
- Mira also does not directly depend on Telegram / Slack / Discord
- Mira depends on OpenClaw's channel surface
- the concrete communication product is connected through an OpenClaw channel / plugin / adapter

In this model, Mira is responsible for:

- generating messaging intents
- deciding whether a message should be sent proactively
- deciding message classes such as reminders, summaries, confirmations, and escalations

OpenClaw is responsible for:

- channel routing
- session binding
- adapter execution
- message delivery triggered by cron, heartbeat, or events

---

## 5. How The Current Lark / Feishu Implementation Should Be Treated

The current workspace already contains an explicit Lark / Feishu channel implementation:

- `OpenClaw/devbox/.openclaw/extensions/openclaw-lark/`

It still has value, but that value should be redefined as:

- an existing channel adapter in the current runtime
- a reference implementation
- a historically real communication path used in the project

It should not be defined in the release version as:

- Mira's formal first-class module
- Mira's default messaging surface
- Mira's core extension layer

The more accurate position is:

- `runtime adapter`
- `reference integration`
- `example channel implementation`

---

## 6. Recommended Placement In The Release Version

If communication-related content is later reorganized inside `Mira_Released_Version`, a more appropriate structure is:

```text
channels/
├─ README.md
├─ contracts/
│  └─ message-channel-contract.md
├─ policies/
│  └─ outbound-policy.md
└─ examples/
   ├─ telegram.md
   ├─ slack.md
   ├─ discord.md
   ├─ imessage.md
   └─ email.md
```

The point is:

- the release version should explain how Mira connects to any supported communication software
- it should not elevate one specific communication product into a first-class official module

If Lark / Feishu needs to remain documented, it fits better under:

- `channels/examples/`
- `archive/`
- `docs/integrations/`

rather than:

- `modules/messaging-lark/`

---

## 7. What This Means For Mira

This change is not mainly about deleting code. It is about correcting the system narrative:

- Mira is not a Feishu assistant
- Mira is not a bot defined by one messaging platform
- Mira is a companion-style agent built on top of OpenClaw
- communication software is only one possible ingress and egress surface

This better matches the broader principles that were already established:

- Mira depends on OpenClaw
- Mira should not be locked to a single ecosystem
- Mira's proactivity should be governed through a unified channel contract and outbound policy

---

## 8. One-Line Summary

The final recommendation is not to promote `openclaw-lark / Feishu` into a first-class release module, but to:

- omit `messaging-lark` as a first-class module in `Mira_Released_Version`
- keep a channel-agnostic design where Mira connects to any supported communication software through OpenClaw native capabilities
