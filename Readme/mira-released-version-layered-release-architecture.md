# Mira Released Version: Layered Release

A release architecture built around a clean core, optional modules, hardware adapters, and deployment/documentation layers.

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
- core skills/plugins
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

Concrete hardware-facing adapters, desktop/mobile sidecars, device-specific setup, and capability notes.

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
- `hardware` exists to support modules
- `examples` and `deploy` recipes compose from lower layers
- `readme` and `docs` explain all layers

## What Goes Where

### Inside Core

- Mira persona workspace
- OpenClaw config templates
- Core Lingzhu/Mira path
- Minimal deployable example
- Sanitized baseline skills/plugins

### Outside Core

- Home Assistant ecosystem packs
- Rokid companion apps/services
- Mi Band / wearable bridges
- Printer and camera bridges
- Apple integration assets

## Proposed Release Tree

```text
Mira_Released_Version/
├─ README.md
├─ LICENSE
├─ readme/
│  ├─ 00-overview/
│  ├─ 10-core/
│  ├─ 20-modules/
│  ├─ 30-hardware/
│  ├─ 40-deploy/
│  └─ 50-development/
├─ core/
│  ├─ workspace/
│  ├─ openclaw-config/
│  ├─ skills/
│  ├─ plugins/
│  └─ examples/
├─ modules/
│  ├─ home-assistant/
│  ├─ rokid/
│  ├─ wearable-mi-band/
│  ├─ printer/
│  ├─ apple/
│  └─ local-device-bridges/
├─ hardware/
│  ├─ mi-band-9-pro/
│  ├─ xiaomi-printer/
│  ├─ macos-camera/
│  └─ windows-camera/
├─ apps/
│  ├─ rokid-companion/
│  └─ rokid-android-companion/
├─ services/
│  ├─ ecosystem-auth-gateway/
│  └─ rokid-bridge-gateway/
├─ examples/
│  ├─ minimal-core/
│  ├─ home-stack/
│  ├─ rokid-stack/
│  └─ full-demo/
├─ deploy/
│  ├─ core/
│  ├─ module-home/
│  ├─ module-rokid/
│  ├─ module-wearable/
│  └─ env-templates/
└─ docs/
   ├─ architecture/
   ├─ migration/
   └─ release-notes/
```

## Intent

This layered release model is designed to make `Mira_Released_Version`:

- independently deployable
- easier to split into a standalone repository later
- clearer for open-source contributors to understand
- safer to publish than a raw runtime snapshot
- easier to extend across software, hardware, skills, and plugins

The key principle is that Mira should keep a clean core while exposing richer ecosystem abilities through explicit modules instead of mixing everything into one undifferentiated release package.
