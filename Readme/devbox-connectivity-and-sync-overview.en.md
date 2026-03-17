# Devbox Connectivity And Sync Archive Overview

## File Relationship

- Chinese source: `devbox-connectivity-and-sync-overview.md`
- English companion: `devbox-connectivity-and-sync-overview.en.md`

This file is the English companion to the Chinese overview of devbox connectivity and sync results. The Chinese source remains the original note; this file is intended for later reuse in bilingual release documentation.

## Purpose

This document summarizes two kinds of information related to the cloud devbox:

- connectivity checks
- archiving and sync results for Mira and OpenClaw assets

It is meant to provide release-facing background rather than replace the sensitive connection-information file.

Sensitive connection details remain in:

- `devbox_openclaw_info.md`

This file intentionally keeps only explanatory conclusions and excludes credentials and tokens.

## Connectivity Findings

During the conversation, the cloud devbox was verified as reachable and healthy.

Confirmed points included:

- SSH connectivity works
- remote `hostname` and `whoami` return correctly
- the OpenClaw health endpoint responds normally
- key directories exist
- `openclaw health` can run successfully

The repository root README also treats the current prototype state as one where the devbox and gateway are reachable and healthy.

## Sync Goal

The sync objective was not to clone the entire devbox byte-for-byte. It was to preserve the high-value assets directly related to Mira and OpenClaw, including:

- workspace
- extensions and plugins
- skills
- memory
- devices
- identity
- selected project-side extension directories

The sync intentionally excluded:

- the OpenClaw runtime itself and large binaries
- `node_modules`
- `.git`
- caches
- temporary files
- logs
- runtime queue artifacts such as print queues

## Archived Scope

According to the sync manifest, the following major paths were preserved:

- `/home/devbox/.openclaw/workspace/`
- `/home/devbox/.openclaw/extensions/`
- `/home/devbox/.openclaw/agents/main/`
- `/home/devbox/.openclaw/memory/`
- `/home/devbox/.openclaw/devices/`
- `/home/devbox/.openclaw/identity/`
- `/home/devbox/.openclaw/cron/jobs.json`
- `/home/devbox/.openclaw/openclaw.json`
- `/home/devbox/.openclaw/lingzhu-public/`
- `/home/devbox/project/openclaw-ha-blueprint-memory/`
- `/home/devbox/project/Openclaw-With-Apple/`

The local mirror root is recorded as:

- `openclaw/devbox/`

## Sync Snapshot

The manifest records the sync result as roughly:

- mirror size: about `11M`
- file count: `720`

The sync method was:

- `tar over ssh`

instead of `rsync`, because the remote devbox did not have `rsync` installed.

## Completeness Judgment

The completeness conclusion has two layers.

### Complete For The Defined Sync Scope

Within the explicitly defined whitelist, the result was complete:

- remote and local file counts matched
- there were no missing local files
- there were no extra local files
- there were no mismatches

### Not A Literal Full Cold Backup

It was not a literal “everything except the OpenClaw binary” cold backup.

That was due to explicit scope exclusions, not missed transfers. Excluded categories included:

- backups
- logs
- exec approvals
- completions
- canvas
- printer queue
- other small runtime metadata

So the accurate statement is:

- this is a high-value Mira/OpenClaw asset mirror
- not a total backup of every runtime fragment

## What This Means For The Release Version

For `Mira_Released_Version`, this mirror is useful as:

- a source of runtime structure references
- a source of plugin, workspace, and memory templates
- a source of deployment and integration assets

It should not be treated as:

- a release-ready clean repo
- a public archive of raw secrets or live state

## Relationship To Other Documents

This document is best read together with:

- `mira-v1-role-in-this-repo.md`
- `repo-footprint-overview.md`
- `mira-released-version-layered-release-architecture.md`

## One-Line Summary

The cloud devbox is reachable and healthy, and the local sync captured the defined Mira/OpenClaw asset scope completely, but not every piece of low-value runtime metadata.
