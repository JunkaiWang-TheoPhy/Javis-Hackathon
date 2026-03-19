# Mira Release Minimal Core Path Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first honest minimal-core onboarding path to `Mira_Released_Version`.

**Architecture:** Keep the path documentation-first. Use a release-safe OpenClaw config example and a small set of aligned README files so the release tree can explain how `core/` stands alone.

**Tech Stack:** Markdown, JSON, release-side config templates

---

## Chunk 1: Config And Deploy Templates

### Task 1: Add minimal core config artifacts

**Files:**
- Create: `Mira_Released_Version/core/openclaw-config/openclaw.example.json`
- Create: `Mira_Released_Version/deploy/core/env.example`

- [ ] **Step 1: Add release-safe OpenClaw config example**

Include:

- provider placeholder
- workspace path
- timezone
- compaction mode
- basic tool profile

- [ ] **Step 2: Add deploy-side env template**

Document the minimum operator-supplied values needed for a core-only setup.

## Chunk 2: Walkthrough Docs

### Task 2: Turn placeholder README files into a coherent minimal-core path

**Files:**
- Modify: `Mira_Released_Version/examples/minimal-core/README.md`
- Modify: `Mira_Released_Version/deploy/core/README.md`
- Modify: `Mira_Released_Version/core/examples/README.md`
- Modify: `Mira_Released_Version/examples/README.md`
- Modify: `Mira_Released_Version/core/README.md`
- Modify: `Mira_Released_Version/readme/10-core/README.md`
- Modify: `Mira_Released_Version/README.md`

- [ ] **Step 1: Update minimal-core example README**

Explain required files, setup order, and next-step navigation.

- [ ] **Step 2: Update deploy/core README**

Explain how to use `env.example` and `openclaw.example.json`.

- [ ] **Step 3: Update release navigation**

Add the minimal-core path to core and top-level release docs.

## Chunk 3: Verification

### Task 3: Verify the minimal-core path artifacts

**Files:**
- Verify: `Mira_Released_Version/core/openclaw-config/openclaw.example.json`
- Verify: `Mira_Released_Version/examples/minimal-core/README.md`

- [ ] **Step 1: Validate JSON syntax**

Run:

```bash
python3 -m json.tool Mira_Released_Version/core/openclaw-config/openclaw.example.json >/dev/null
```

- [ ] **Step 2: Check README references**

Run:

```bash
rg -n "openclaw.example.json|deploy/core|examples/minimal-core" Mira_Released_Version/README.md Mira_Released_Version/core/README.md Mira_Released_Version/examples/minimal-core/README.md Mira_Released_Version/deploy/core/README.md Mira_Released_Version/readme/10-core/README.md
```
