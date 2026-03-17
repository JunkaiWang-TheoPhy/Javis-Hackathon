# The Role And Position Of Mira_v1 In This Repo

## File Relationship

- Chinese source: `mira-v1-role-in-this-repo.md`
- English companion: `mira-v1-role-in-this-repo.en.md`

This file is the English companion to the Chinese note about `Mira_v1`. The Chinese source remains the original explanation; this file exists for bilingual maintenance and later release documentation.

## 1. Conclusion First

`Mira_v1` is best understood as the product-persona layer plus the runtime-experience layer of the current repo, not as the lowest-level platform body.

It is highly important, but it is not the entire infrastructure foundation of the system.

## 2. Why This Conclusion Makes Sense

The root `README.md` already distinguishes repository layers fairly clearly:

- `0313/openclaw-ha-blueprint/` is described as the main blueprint and ecosystem-plugin area
- `Mira_v1/` is described as Mira’s persona workspace and companion-style runtime materials

That means:

- the chassis and broad ecosystem integration blueprint mainly live under `0313/...`
- the core material that makes the system “Mira” rather than a generic OpenClaw demo lives under `Mira_v1/...`

## 3. What `Mira_v1` Mainly Carries

The directory is centered on three major areas:

- `openclaw-workspace/`
- `openclaw-config/`
- `lingzhu-bridge/`

### 3.1 `openclaw-workspace/`

This is the persona and workspace skeleton, including:

- `AGENTS.md`
- `SOUL.md`
- `IDENTITY.md`
- `MEMORY.md`
- `TOOLS.md`

It defines:

- who Mira is
- how she speaks
- when she is proactive and when she stays restrained
- how she handles memory and tools

This is the core of persona definition and companion-style behavior.

### 3.2 `openclaw-config/`

This area contains runtime-facing configuration fragments such as:

- `lingzhu-system-prompt.txt`
- `lingzhu-config-snippet.json5`
- `agent-defaults-snippet.json5`

It is the layer where persona enters runtime configuration.

### 3.3 `lingzhu-bridge/`

This is closer to runtime bridge implementation and interaction-path realization.

It proves that `Mira_v1` is not just a set of notes or writing files. Some of the actual runtime path has already been expressed in implementation-level bridge code.

## 4. What It Is Not

`Mira_v1` is not:

- the main Home Assistant blueprint directory
- the full ecosystem plugin directory
- the top-level hardware bridge entry point
- the OpenClaw runtime itself

Those are more distributed across:

- `0313/openclaw-ha-blueprint/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/`
- `devices/...`

So `Mira_v1` should not be read as “the whole system.”

## 5. Why It Is Still Extremely Core

Without `Mira_v1`, the repo might still be a complicated OpenClaw + plugins + hardware integration project.

But without it, the system would no longer naturally be “a companion-style agent named Mira.”

In that sense:

- `0313/...` is closer to the chassis, bus, and ecosystem blueprint
- `Mira_v1` is closer to the layer that actually shapes the system into Mira

It does not decide whether devices can be connected. It decides:

- what the system feels like
- where its companion quality comes from
- why it is not a generic tool-oriented assistant

## 6. Natural Position In The Release Version

If the repo is reorganized into `Mira_Released_Version`, the most natural destinations for `Mira_v1` material are:

- `core/persona/`
- `core/workspace/`
- `core/runtime/openclaw-config/`
- `core/plugins/` for the parts directly tied to Mira or Lingzhu core bridging

So `Mira_v1` is better understood as one of the main sources of the future release `core`, not as an isolated side directory.

## 7. One-Line Summary

`Mira_v1` is:

- upper-layer
- core
- product-experience-facing
- identity-defining

It is not the biggest code directory or the lowest platform layer, but it is the key source of why this system is called Mira.
