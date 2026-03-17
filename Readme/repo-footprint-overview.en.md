# Current Repo Footprint Overview

## File Relationship

- Chinese source: `repo-footprint-overview.md`
- English companion: `repo-footprint-overview.en.md`

This file is the English companion to the repo-footprint snapshot note. The Chinese source remains the original local snapshot record; this file exists for bilingual maintenance and later release planning.

## 1. Purpose

This document turns the conversation’s repo-size assessment into a reusable snapshot that helps answer:

- what scale the current repo is closer to
- what mainly inflates its size
- which content looks like core release material versus experiments, mirrors, or workspace artifacts

This is a local snapshot from `2026-03-17`, so the numbers will change as syncs, docs, and mirrored assets evolve.

## 2. Overall Snapshot

- total workspace disk usage: about `689M`
- `.git` object database: about `54M`
- Git-tracked file count: `1274`
- total workspace file count: `10801`
- total tracked file bytes: about `108,728,775` bytes, roughly `103.7M`

## 3. Code And Text Scale

According to `cloc --vcs=git`, the current tracked text/code set is:

- files: `960`
- total lines: `327,962`
- code lines: `276,576`
- blank lines: `15,959`
- comment lines: `35,427`

Major language composition:

- JavaScript: `152,131` lines of code
- JSON: `54,918` lines
- TypeScript: `34,176` lines of code
- Markdown: `20,863` lines
- Python: `8,304` lines of code
- Kotlin: `1,825` lines of code
- Shell: about `2,246` lines of code

## 4. Largest Directories

The biggest directories in the workspace are:

- `.worktrees`: about `305.9M`
- `0313`: about `136.1M`
- `tmp`: about `81.3M`
- `.git`: about `54.2M`
- `OpenClaw`: about `50.3M`
- `devices`: about `47.8M`
- `Readme`: about `12.3M`

This shows that repo size is influenced not just by core code, but also by:

- multiple worktree copies
- large blueprint and mirror directories
- temporary data
- exported documentation and demo materials

## 5. What This Means

From an engineering-organization perspective, this is not a single clean product repo. It is closer to a combined:

- prototype repo
- integration repo
- experiment repo
- documentation repo
- runtime mirror repo

Its value is not just line count. Its value is that it keeps Mira’s persona, runtime, plugins, skills, hardware bridges, design thinking, and devbox mirrors in one working space.

## 6. From The Release Perspective

If the repo is later reorganized into `Mira_Released_Version`, the current content can be roughly separated into three categories.

### A. Release-Core Material

- `Mira_v1`
- `0313/openclaw-ha-blueprint`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory`
- `devices/mi-band-9-pro`
- key README, docs, and specs

### B. Runtime Mirrors And Archives

- `OpenClaw/devbox/.openclaw/...`
- `openclaw/devbox/...`
- some session, memory, and workspace mirrors

### C. Repo-Inflating Items Not Necessarily Meant For Release

- `.worktrees`
- `tmp`
- large exported materials
- historical intermediate artifacts

## 7. Conclusion

The current repo is already larger than a lightweight demo repo, but it is not yet organized as a formal product repo.

The more accurate judgment is:

- it is a medium-to-large, multi-stack, multi-source prototype integration repo
- it contains both publishable core material and substantial experimental, mirrored, and workspace-inflating content

That is exactly why `Mira_Released_Version` needs to exist:

- not because the current repo lacks content
- but because it contains a lot of content that has not yet been reorganized into a public release structure
