# Mira Core, OpenClaw, And The Boundaries Of Proactive Capabilities

## 0. Relationship Between The Chinese And English Files

This file is the English companion to:

- `mira-core-openclaw-relationship-and-proactive-capabilities.md`

The two files should remain aligned in topic and roughly aligned in structure so they can be:

- managed together
- copied as a pair into `Mira_Released_Version`
- referenced for Chinese and English readers separately

---

## 1. Purpose

This document answers two core questions that surfaced repeatedly in this conversation:

1. What is the relationship between `Mira Core` and `OpenClaw` when there is no `Home Assistant`?
2. Does the `OpenClaw` architecture support Mira's defining traits, including:
   - proactive sensing
   - proactive messaging
   - background smart-home control
   - proactive email sending

This document emphasizes one important boundary:

- `architectural support` is not the same as `current default policy allows automatic execution`

---

## 2. Conclusion First

### 2.1 `Mira Core` vs `OpenClaw`

Without `Home Assistant`, the relationship between `Mira Core` and `OpenClaw` is not an either-or choice. It is:

- `OpenClaw` as the runtime, control plane, and container for sessions, skills, channels, cron, and plugins
- `Mira Core` as the persona, memory, interaction, and policy layer running on top of `OpenClaw`

More precisely:

- `OpenClaw = runtime / control plane`
- `Mira Core = persona + memory + policy + interaction layer on top of OpenClaw`

### 2.2 Mira's Proactive Capabilities

The `OpenClaw` architecture does support Mira's proactive capabilities, but this has to be understood in layers:

- proactive sensing: supported
- proactive messaging: supported
- background smart-home control: supported
- proactive email sending: supported

But "supported" here means supported by the architecture. It does not automatically mean:

- the current workspace is fully configured for it
- the current persona rules already allow it unconditionally

---

## 3. The Basic Relationship Between `Mira Core` And `OpenClaw`

Based on the current system-design work, OpenClaw is best understood as:

- an orchestration shell
- a session runtime
- a skill / plugin host
- a channel-routing layer
- a node / browser / cron / notification control plane

and not as:

- a whole-home device protocol bus
- the low-level driver layer of any single hardware ecosystem

That position already appears in [openclaw-jarvis-system-design.md](./openclaw-jarvis-system-design.md):

- OpenClaw is described as `orchestration + sessions + skills + channel routing`
- it is treated as an `agent/control plane`
- not as the device protocol stack itself

So if `Home Assistant` is absent, Mira does not disappear. She still exists as a complete companion-style agent, but without a unified household execution surface.

---

## 4. How The System Should Be Layered Without `Home Assistant`

Without `Home Assistant`, a reasonable layering looks like this:

```text
User / External Input
    ↓
OpenClaw runtime
    ↓
Mira Core
    ├─ persona
    ├─ interaction
    ├─ memory
    ├─ policy
    └─ extension interface
    ↓
Optional action / channel modules
```

In other words:

- `OpenClaw` is responsible for running Mira, receiving messages, calling tools, and scheduling tasks
- `Mira Core` is what turns the agent inside that runtime into Mira
- `Home Assistant` is only one powerful future module that gives Mira stable action capability inside the household environment

The complementary background document is:

- `mira-core-without-home-assistant.en.md`

---

## 5. Which Proactive Capabilities The `OpenClaw` Architecture Supports

### 5.1 Proactive Sensing

Supported, but not as mystical model sensing. It depends on event sources, nodes, timers, or heartbeat.

The proactive sensing paths discussed so far include:

- `heartbeat`
- `cron`
- `webhooks`
- `plugins / background services`
- `nodes`
- external event ingress such as wearable / phone / ambient sidecars

In the current design work, OpenClaw is already placed at the layer of:

- `sessions`
- `skills`
- `cron`
- `webhooks`
- `channels`
- `proactive conversation`

### 5.2 Proactive Messaging

Supported.

But it should go through:

- channel routing
- notification surfaces
- or modular messaging adapters

rather than binding Mira to a single communication product.

For the release version, the more accurate position is:

- do not promote `openclaw-lark / Feishu` into a first-class module
- instead let Mira connect to any supported communication software through OpenClaw native channel capabilities

The current system discussion already treats communication outputs as:

- OpenClaw channels
- `notify.mobile_app_*`
- messaging surfaces such as Telegram / WhatsApp / Slack / iMessage

### 5.3 Background Smart-Home Control

Supported, but it requires an execution plane.

The most stable execution plane is usually:

- `Home Assistant`

Without `HA`, there is still a host-operator path through:

- `browser`
- `system.run`
- local scripts
- vendor APIs

But that path is usually a supplement, not the strongest long-term primary route.

### 5.4 Proactive Email Sending

Supported, but it belongs to:

- outbound action
- external communication

So under the current Mira workspace rules, it is not a capability that should be treated as unconditionally auto-allowed by default.

---

## 6. The Three Proactive Paths: `heartbeat`, `cron`, And `event-driven`

### 6.1 `heartbeat`

`heartbeat` is appropriate for:

- low-frequency, low-risk, context-aware checks
- bundling multiple light checks together
- workflows that do not require exact timing

The current Mira workspace already states that:

- when a heartbeat poll arrives, the agent should not mechanically return `HEARTBEAT_OK` every time
- heartbeat can be used for low-risk proactive work such as inbox, calendar, reminders, and memory maintenance

But the current devbox [HEARTBEAT.md](../OpenClaw/devbox/.openclaw/workspace/HEARTBEAT.md) is still an empty placeholder, which means:

- the heartbeat mechanism exists
- but it has not yet been configured as a real production proactive checklist

### 6.2 `cron`

`cron` is appropriate for:

- exact-time tasks
- background tasks isolated from main session history
- directly delivering output to a channel
- one-shot reminders or fixed-schedule reminders

The current Mira workspace already distinguishes:

- `heartbeat` for lightweight, batchable, timing-flexible proactive work
- `cron` for precise scheduling and isolated output

But the current devbox [jobs.json](../OpenClaw/devbox/.openclaw/cron/jobs.json) is empty, which means:

- the cron capability surface exists
- but no formal recurring tasks are currently registered

### 6.3 `event-driven`

The `event-driven` path is what truly turns Mira into an ambient companion system.

Event sources may include:

- Apple Watch / iPhone
- Android / Mi Band
- Home Assistant presence / state change
- local-computer or camera sidecars
- changes inside the memory system itself

A reasonable event chain should look like:

```text
sensor / device event
  -> context / policy evaluation
  -> Mira decision
  -> notification or action
```

This is also one of the most important routes in the current Jarvis-system design work.

---

## 7. Why “Supports Automatic Outbound Action” Is Not The Same As “Currently Allowed By Default”

This is the single most important distinction in this topic.

From the technical capability layer:

- Mira / OpenClaw can proactively send messages
- Mira / OpenClaw can proactively send emails
- Mira / OpenClaw can proactively trigger external actions

But from the current workspace policy layer:

- these actions are not treated as unconditionally auto-allowed

The reason is explicit in [AGENTS.md](../Mira_v1/openclaw-workspace/AGENTS.md):

- `Sending emails, tweets, public posts`
- `Anything that leaves the machine`

are both categorized under:

- `Ask first`

So two levels must be kept separate.

### 7.1 Capability Layer

This asks whether the architecture is capable of doing the thing.

At this layer, the answer is:

- yes

### 7.2 Behavior Policy Layer

This asks whether Mira is currently allowed to do it automatically under the existing persona and runtime rules.

At this layer, the current default answer is:

- no, not by default

This is exactly why "if you want real automatic outbound behavior in production, you must add an explicit `outbound policy`."

---

## 8. Why An `outbound policy` Is Required

Without an `outbound policy`, the system collapses into two bad extremes:

1. nothing can ever be sent automatically
2. everything is allowed to be sent automatically

Neither fits Mira.

Mira should instead behave like this:

- low-risk outbound actions may be automatic
- medium-risk outbound actions should require confirmation
- high-risk outbound actions should be governed by stricter rules

Examples:

- low-risk reminders to the user: may be automatic
- first email to a new recipient: should require confirmation
- caregiver notification about a health event: should require confirmation, or only auto-send above a high threshold
- non-urgent nighttime messages: should be suppressed

So the purpose of `outbound policy` is not to suppress Mira's proactivity. It is:

- to turn proactivity into disciplined proactivity

---

## 9. Background Smart-Home Control Already Has A Real Example

This is not only theoretical.

The current HA control plugin already demonstrates:

- notification on high heart-rate events
- automatic cooling when arriving home after elevated heart rate
- mechanical-switch linkage

In [openclaw-plugin-ha-control](../OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/src/index.ts), you can see:

- `notify(...)` calling the configured notification service
- the `home_handle_hr_event` tool explicitly describing high-HR policy evaluation plus cooling / notification actions
- arrival-home logic that emits an `Arrival cooling` notification and runs cooling response

So for the question of "background proactive smart-home control," the accurate answer is:

- the `OpenClaw + Mira + HA plugin` chain already proves that this class of proactive behavior is architecturally valid

---

## 10. How Proactive Email Should Be Understood

Proactive email belongs to Mira's capability surface, but it should not be treated as a default, unrestricted outbound behavior.

The better design is:

- email is a separate module or adapter
- Mira only produces typed intents
- policy decides whether direct sending is allowed

So the cleaner split is:

- `draft_email`
- `send_approved_email`
- `summarize_inbox`
- `send_user_checkin_email`

rather than letting the persona layer "freely send email."

This also matches Mira's dependence on OpenClaw:

- `OpenClaw` owns runtime, channels, tools, and scheduling
- `Mira` owns whether something should be sent, when, to whom, and in what tone

---

## 11. Current State: The Architecture Exists, But Configuration Is Still Skeleton-Level

At the current repository state, the more accurate real-world assessment is:

### What Already Exists

- OpenClaw as runtime / control plane
- Mira as persona + memory + policy layer
- the three proactive paths: heartbeat / cron / event-driven
- background notification and automation examples on the HA path
- memory sleep / forgetting mechanisms

### What Is Still Skeleton-Level Or Pending

- the heartbeat checklist is still empty
- cron jobs are still empty
- a generic outbound policy has not yet been formalized as its own config
- the email module has not yet been separated into a release-facing module

So the current state is not "it cannot be done." The current state is:

- the framework already exists
- but strategy and configuration still need to be completed for a formal release capability

---

## 12. Recommended Final Wording

If this judgment needs to be compressed into one sentence that is accurate both internally and externally, the recommended version is:

> `OpenClaw` is the runtime and control plane that hosts Mira.  
> `Mira Core` is the persona, memory, interaction, and policy layer running on top of it.  
> The architecture supports proactive sensing, proactive messaging, and proactive action, but these capabilities must be governed by explicit outbound and risk policies rather than being treated as unlimited default behavior.

---

## 13. Final Conclusion

The core conclusions of this document are:

- without `Home Assistant`, Mira can still remain a complete system
- `OpenClaw` is the platform, while `Mira Core` is the Mira-specific upper layer running on top of it
- the `OpenClaw` architecture supports proactive sensing, proactive messaging, and proactive action
- but "supports" is a capability-layer conclusion, not a default policy-allowance conclusion
- if you want real production-grade automatic outbound action or background proactive action, you must still formalize:
  - `outbound policy`
  - `risk policy`
  - the real configuration of heartbeat / cron / event-driven paths

So the most accurate judgment is not:

- "Mira is already allowed to act proactively without limit"

It is:

- "The OpenClaw architecture Mira depends on is already sufficient to support a proactive system, but her proactivity still needs to be formalized, modularized, and made auditable through explicit policy."
