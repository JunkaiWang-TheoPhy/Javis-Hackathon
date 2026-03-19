# Mira Release Minimal Core Path Design

## Goal

Define the first release-side "minimal core" path so a new reader can understand how to assemble Mira Core without Home Assistant or other first-party modules.

## Scope

This pass adds:

- a release-safe `openclaw.example.json`
- a deploy-side `env.example` for core-only setup
- a real walkthrough in `examples/minimal-core/README.md`
- aligned README updates across `core/`, `core/examples/`, `deploy/core/`, and release navigation docs

This pass does not add:

- a runnable OpenClaw binary bundle
- live secrets
- module-specific setup
- service-side notification configuration

## Approach

Keep the minimal core path documentation-first and honest.

The release tree should explain:

1. which core files are required
2. which runtime values must be provided by the operator
3. how `core/workspace/` and `core/openclaw-config/` fit together
4. where to go next after the minimal path is understood

The example config should stay close to the active `openclaw.json` shape where possible, but remove private provider details and devbox paths.

## Verification

This pass is complete when:

- the example JSON parses cleanly
- the new minimal-core README points to real files
- deploy/core has a concrete env template instead of only placeholder text
- top-level release navigation acknowledges the minimal-core path
