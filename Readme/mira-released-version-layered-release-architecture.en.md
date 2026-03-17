# Mira Released Version: Layered Release

## File Relationship

- Source file: `mira-released-version-layered-release-architecture.md`
- English companion: `mira-released-version-layered-release-architecture.en.md`

The source file is already English-led in structure. This companion exists mainly to keep the bilingual file-pairing convention consistent inside `Readme/` and to provide a normalized release-facing entry for later copying.

## Top-Level Release Shape

```text
Mira_Released_Version/
├─ README.md
├─ LICENSE
├─ readme/
├─ core/
├─ modules/
├─ hardware/
├─ apps/
├─ services/
├─ examples/
├─ deploy/
└─ docs/
```

## Layer Model

### 1. Core

The smallest independently deployable Mira package:

- workspace
- prompts
- baseline config
- core skills and plugins
- a minimal example

### 2. Modules

Optional capabilities grouped by domain:

- Home Assistant
- Rokid
- Printer
- Apple
- Wearable
- Local Device Bridges

### 3. Hardware

Concrete hardware-facing adapters, desktop and mobile sidecars, device-specific setup, and capability notes.

### 4. Deploy + Docs

Installation templates, environment examples, scenario walkthroughs, and English release documentation.

## Dependency Direction

```text
readme/ + docs/
        │
deploy/ examples/
        │
     modules/
        │
     hardware/
        │
       core/
```

Rules:

- `core` stands alone
- `modules` depend on `core`
- `hardware` supports modules
- `examples` and `deploy` compose from lower layers
- `readme` and `docs` explain all layers

## What Goes Where

### Inside Core

- Mira persona workspace
- OpenClaw config templates
- core Lingzhu and Mira path
- minimal deployable example
- sanitized baseline skills and plugins

### Outside Core

- Home Assistant ecosystem packs
- Rokid companion apps and services
- Mi Band and wearable bridges
- printer and camera bridges
- Apple integration assets

## Proposed Release Tree

The release tree should further expand into:

- layered `readme/`
- `core/` with workspace, config, skills, plugins, and examples
- `modules/` grouped by integration domain
- `hardware/` grouped by device-facing implementation

## Intent

This architecture exists to produce a release that is:

- cleaner than the current prototype repo
- more open-source friendly
- easier to deploy incrementally
- easier to evolve over time

It should not be treated as a copy of the current repo. It is a reorganized release architecture.
