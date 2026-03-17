# Mira Release Strategy Options

## File Relationship

- Chinese source: `mira-release-strategy-options.md`
- English companion: `mira-release-strategy-options.en.md`

This file is the English companion to the Chinese release-strategy comparison. The Chinese source remains the original design note; this file is intended for bilingual planning and later release-facing reuse.

## Purpose

This document summarizes the three release strategies discussed for `Mira_Released_Version`.

It answers one core question:

- should the release start as a minimal Mira core
- should it try to mirror the current full system
- or should it become a layered, extensible, long-term release architecture

Conclusion first:

- `Core only` is the lightest
- `Full deployable` is the most complete
- `Layered release` is the most appropriate formal open-source release architecture

## 1. Option One: Core Only

`Core only` aims to publish the smallest version of Mira that still clearly exists as Mira.

It usually includes:

- Mira persona workspace
- OpenClaw configuration templates
- minimal skill and plugin skeletons
- the smallest deployable path
- a small number of examples

### Advantages

- the cleanest structure
- easiest for the community to understand
- easiest to split into a standalone repo later
- least likely to drag private runtime state into the release

### Disadvantages

- the surrounding ecosystem becomes much lighter
- many real capabilities become interface stubs, examples, or documentation only
- it behaves more like a core framework release than a full system release

### Best Fit

- when the goal is to publish Mira as a clean open-source product concept first
- when a stable low-burden foundation matters more than breadth

## 2. Option Two: Full Deployable

`Full deployable` aims to carry as much of the currently working repo as possible into the release.

It usually includes:

- Mira persona and workspace
- OpenClaw configuration and bridging
- Home Assistant capability
- Rokid path
- wearable and Mi Band path
- printer bridge
- Apple-related support
- apps, services, scripts, and deployment instructions

### Advantages

- closest to “move the current system out as a whole”
- shortest path for demos, showcases, and partner explanation
- shortest path for external full-experience reproduction

### Disadvantages

- significantly heavier directory structure
- environment and hardware dependencies grow quickly
- higher maintenance cost
- easier to drag in content that only makes sense in the current private environment

### Best Fit

- when the goal is system-level handoff
- when “full reproduction” matters more than elegant open-source structure

## 3. Option Three: Layered Release

`Layered release` is not just a compromise. It is a formal system where:

- `core` must stand on its own
- `modules` are official extension layers
- `hardware` is the device-facing layer
- `apps / services` contain only independently runnable components
- `deploy / readme / docs` are also structured by layer

### Advantages

- best fit for a standalone future repo
- easiest for the community to understand and adopt incrementally
- strongest overall system shape
- easiest to maintain and extend over time

### Disadvantages

- highest up-front organization cost
- requires sharper boundary design
- cannot be produced by simple file copying alone

### Best Fit

- when the goal is a formal public release
- when the system is expected to keep growing across new hardware, plugins, and modules
- when long-term maintainability matters

## 4. Relationship Between `3` and `1`

`3` can be understood as being built around `1` as its kernel, but it is not just a simple increment on top of `1`.

More precisely:

- `1` is the smallest publishable core
- `3` is a formal release system designed around that core from day one

## 5. Recommendation

The recommended choice is:

- `Layered release`

Reason:

- it best matches the stated goal of a clean, open, deployable, extensible, community-friendly Mira release

## 6. Relationship To Other Documents

This document should be read together with:

- `mira-released-version-layered-release-architecture.md`
- `mira-core-without-home-assistant.md`
- `mira-home-assistant-flagship-module.md`
