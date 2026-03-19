# Core Deploy

## Purpose

This directory will hold deployment notes for the smallest Mira core runtime.

## Owns

- core-only deployment guidance
- environment expectations for core
- release-safe deploy entrypoints

## Does Not Own

- module-specific setup
- service internals
- private devbox procedures

## Planned Contents

- local core setup
- required config references
- minimal service dependencies

## Current Status

This directory now marks the first concrete deploy path for a core-only release setup.

Unified deploy comparison:

- [../deploy-paths-overview.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/deploy-paths-overview.md)

## Minimal Core Deploy Inputs

Use these two files together:

- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/env.example)
- [core/plugins/lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)

The config example defines:

- provider placeholder shape
- workspace path
- timezone
- compaction mode
- baseline tool profile
- the release-safe `lingzhu` core plugin entry

The env template defines:

- where the OpenClaw runtime should read config from
- which workspace path the release core expects
- which provider secret still needs operator input

## Core-Only Deployment Story

This is the intended order:

1. install and prepare an OpenClaw runtime outside this release tree
2. copy and adapt [openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
3. make [core/plugins/lingzhu-bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge) available to the target OpenClaw runtime
4. copy and adapt [env.example](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/env.example)
5. point the runtime at [core/workspace](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/workspace)
6. verify the runtime loads Mira core and the release-safe `lingzhu` plugin without any first-party modules

## Current Non-Goals

This path still does not provide:

- a bundled OpenClaw binary/runtime
- a single mandated plugin installation method
- provider credential automation
- process supervisors or container packaging
- module setup
