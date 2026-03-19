# Mira Release Minimal Core Lingzhu Plugin Integration Design

## Goal

Wire the newly migrated release-safe `core/plugins/lingzhu-bridge` package into the documented `minimal-core` path.

## Scope

This step updates release-safe configuration and onboarding docs so the minimal core story no longer stops at persona, workspace, and config templates. It now explicitly includes a core plugin path.

## Design

The integration will use the existing `plugins.allow` and `plugins.entries.lingzhu` shape already present in current OpenClaw runtime configs.

`openclaw.example.json` will include a release-safe Lingzhu plugin entry with:

- `enabled: true`
- inline placeholder for the release-safe system prompt
- memory-context settings that match the existing release-safe snippet

The surrounding docs will make one boundary explicit:

- the config example shows how the plugin is enabled
- the release tree does not yet prescribe one final plugin installation method

## Non-Goal

This step does not migrate the live Lingzhu transport handler into release core, and does not claim that the release package already contains a full OpenClaw extension installer flow.
