# Mira Release Core Plugin Lingzhu Bridge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first release-safe Lingzhu core plugin package to `Mira_Released_Version/core/plugins/lingzhu-bridge`.

**Architecture:** Create a small standalone TypeScript package that keeps first-turn opening logic, memory-context helpers, and shared Lingzhu types, while explicitly excluding the live HTTP bridge entrypoint.

**Tech Stack:** TypeScript, Node.js, `tsx`, Markdown

---

### Task 1: Create the release-side package and failing tests

**Files:**
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/package.json`
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/.gitignore`
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/tests/first-turn-opening.test.mts`
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/tests/memory-context.test.mts`

- [ ] Add a minimal package manifest and test script.
- [ ] Copy the first-turn and memory-context tests into the release package.
- [ ] Run the package tests and confirm they fail because the source files are missing.

### Task 2: Add the release-safe source files

**Files:**
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/src/first-turn-opening.ts`
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/src/memory-context.ts`
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/src/types.ts`

- [ ] Copy the transport-neutral source files into the release package.
- [ ] Keep imports and module format compatible with package-local tests.
- [ ] Run the package tests and confirm they pass.

### Task 3: Document the migrated boundary

**Files:**
- Create: `Mira_Released_Version/core/plugins/lingzhu-bridge/README.md`
- Modify: `Mira_Released_Version/core/plugins/README.md`
- Modify: `Mira_Released_Version/core/README.md`
- Modify: `Mira_Released_Version/readme/10-core/README.md`

- [ ] Document what the release-side Lingzhu bridge package owns.
- [ ] Document what remains intentionally excluded from release core.
- [ ] Update release-side navigation to mention the new plugin package.
