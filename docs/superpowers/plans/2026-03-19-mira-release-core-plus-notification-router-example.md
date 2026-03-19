# Mira Release Core Plus Notification Router Example Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `examples/service-notification-router` a real release-side composition example instead of a placeholder.

**Architecture:** Reuse the existing minimal-core, core plugin, notification-router, and deploy docs. Add a composition README that sequences them into one operator path.

**Tech Stack:** Markdown

---

### Task 1: Update the composition example

**Files:**
- Modify: `Mira_Released_Version/examples/service-notification-router/README.md`

- [ ] Replace the placeholder with a concrete example flow.
- [ ] Reference minimal-core, the Lingzhu core plugin package, and the notification-router deploy path together.

### Task 2: Refresh navigation

**Files:**
- Modify: `Mira_Released_Version/examples/README.md`
- Modify: `Mira_Released_Version/services/notification-router/README.md`
- Modify: `Mira_Released_Version/deploy/service-notification-router/README.md`
- Modify: `Mira_Released_Version/README.md`

- [ ] Mention the new composition example from the example index.
- [ ] Connect the service README and deploy README back to the example path.
