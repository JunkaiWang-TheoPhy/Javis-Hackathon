# Mira Release Getting Started Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a release-side getting-started page that turns the current docs and examples into one ordered onboarding path.

**Architecture:** Create one overview-level page and wire it from the top-level README, docs portal, quick-start page, and the core/modules/deploy docs.

**Tech Stack:** Markdown

---

### Task 1: Add the getting-started page

**Files:**
- Create: `Mira_Released_Version/readme/00-overview/getting-started.md`

- [ ] Write an ordered onboarding path from `minimal-core` to optional module/service expansion.
- [ ] Include the advanced `home-stack-with-notification-router` path as the last step.

### Task 2: Update navigation

**Files:**
- Modify: `Mira_Released_Version/README.md`
- Modify: `Mira_Released_Version/readme/README.md`
- Modify: `Mira_Released_Version/readme/00-overview/README.md`
- Modify: `Mira_Released_Version/readme/00-overview/quick-start.md`
- Modify: `Mira_Released_Version/readme/10-core/README.md`
- Modify: `Mira_Released_Version/readme/20-modules/README.md`
- Modify: `Mira_Released_Version/readme/40-deploy/README.md`

- [ ] Add stable links to the new onboarding page.
- [ ] Keep the distinction clear between "choose a path" and "follow the ordered setup sequence".
