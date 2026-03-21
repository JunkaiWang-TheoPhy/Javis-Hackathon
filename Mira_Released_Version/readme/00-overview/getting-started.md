# Getting Started

## Purpose

This page gives the recommended reading and setup order for the current release tree.

## Recommended Onboarding Sequence

### Step 1: Understand Mira Core

Read:

- [examples/minimal-core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/minimal-core/README.md)
- [deploy/core/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/core/README.md)
- [core/openclaw-config/openclaw.example.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/openclaw-config/openclaw.example.json)
- [core/plugins/lingzhu-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/core/plugins/lingzhu-bridge/README.md)

Outcome:

- you understand the smallest release-safe Mira setup
- you know how core config, workspace, and the release-safe Lingzhu plugin fit together

### Step 2: Choose One Expansion Path

From here, choose one of two directions:

- household execution:
  [examples/home-stack/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack/README.md)
- outbound service:
  [examples/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/service-notification-router/README.md)

Use `home-stack` first if you care about Home Assistant and scene orchestration.

Use `service-notification-router` first if you care about outbound delivery, email, DM, and policy gating.

### Step 3: Follow The Matching Deploy Story

If you chose the Home Assistant path, continue with:

- [deploy/module-home-assistant/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/module-home-assistant/README.md)

If you chose the outbound service path, continue with:

- [deploy/service-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/deploy/service-notification-router/README.md)

### Step 4: Use The Advanced Combined Path

After both the Home Assistant and notification-router paths are clear, use:

- [examples/home-stack-with-notification-router/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/examples/home-stack-with-notification-router/README.md)

Outcome:

- you understand the current release-side story for `core + module + service`

## If You Are New

The shortest safe order is:

1. `minimal-core`
2. `home-stack` or `service-notification-router`
3. `home-stack-with-notification-router`

## If You Only Need One Goal

- For Mira identity and release structure, stop after `minimal-core`.
- For household execution, stop after `home-stack`.
- For outbound delivery, stop after `service-notification-router`.
- For the broadest current release-side composition story, end at `home-stack-with-notification-router`.

## If You Are Doing Migration Work

If your goal is not only to read the current release tree but also to continue migration from other repos or export-only directories, use the imported bundle layer after the main onboarding path:

- [migration-bundles/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/Mira_Released_Version/migration-bundles/README.md)

That entrypoint is especially useful when you need:

- the home ecosystem migration pack with copied source context
- the Chinese migration checklist and Codex prompt bundle
- the exported standalone release-tree snapshot as a comparison surface

Treat those bundles as migration aids, not as the live release root.
