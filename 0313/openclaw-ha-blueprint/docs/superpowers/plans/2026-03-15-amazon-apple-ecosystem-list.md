# Amazon Alexa and Apple Ecosystem Listing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Amazon Alexa` and `Apple Home / HomeKit` to the repo's support documentation and create a simple ecosystem overview file under `Readme/`.

**Architecture:** Keep the change documentation-only. Update the blueprint README and progress doc so the repo's current smart-home ecosystem list is broader and clearer, then add a compact `Readme` overview file that lists supported ecosystems without implementation detail.

**Tech Stack:** Markdown, JSON-aware repo docs workflow

---

## Chunk 1: Documentation Updates

### Task 1: Update the repo support lists

**Files:**
- Modify: `0313/openclaw-ha-blueprint/README.md`
- Modify: `docs/openclaw-ha-ecosystem-progress-2026-03-15.md`

- [ ] **Step 1: Add `Amazon Alexa` to the existing ecosystem lists**
- [ ] **Step 2: Expand the Apple listing from `homekit` alone to `Apple Home / HomeKit` where appropriate**
- [ ] **Step 3: Keep the wording honest and avoid claiming new direct runtime support**

## Chunk 2: Support Inventory File

### Task 2: Add the new Readme overview file

**Files:**
- Create: `Readme/支持的智能家居品牌生态一览.md`

- [ ] **Step 1: Write a compact list of supported smart-home ecosystems only**
- [ ] **Step 2: Avoid implementation detail, caveats, or setup notes**

## Chunk 3: Verification

### Task 3: Verify the edited files

**Files:**
- Test: documentation files only

- [ ] **Step 1: Re-read the updated files to confirm the new names appear as intended**
- [ ] **Step 2: Run `git diff --stat` for the touched files**
- [ ] **Step 3: Report exact file changes and the official sources used for naming**
