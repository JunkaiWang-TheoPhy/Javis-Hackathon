# OpenClaw Printer Bridge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local macOS printer bridge plus a remote OpenClaw printer plugin so the cloud agent can discover and use `Mi Wireless Photo Printer 1S [6528]` through the local Mac.

**Architecture:** Run a loopback-only HTTP bridge on the Mac, expose it to `devbox` over a reverse `SSH` tunnel, and register bounded printer tools in the remote OpenClaw runtime. Persist the local Mac and printer facts in both repo docs and the remote OpenClaw workspace.

**Tech Stack:** Python 3 standard library, shell scripts, Node-compatible OpenClaw plugin files, reverse SSH, macOS CUPS commands, Python `unittest`.

---

## Chunk 1: Local Bridge Files And Repo Knowledge

### Task 1: Add local bridge docs and static printer metadata

**Files:**
- Create: `docs/printer-bridge/README.md`
- Create: `docs/printer-bridge/device-profile.json`
- Create: `docs/printer-bridge/remote-openclaw-notes.md`
- Test: `tests/printer-bridge/test_repo_docs.py`

- [ ] **Step 1: Write the failing test**

Add a Python unit test that asserts the new docs exist and the JSON metadata contains the expected printer queue and supported media values.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_repo_docs
```

Expected: FAIL because the docs and metadata do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the docs and metadata with:
- local Mac bridge role
- remote `devbox` bridge entrypoint
- queue name `Mi_Wireless_Photo_Printer_1S__6528_`
- media aliases and supported values

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_repo_docs
```

Expected: PASS

### Task 2: Add the local macOS printer bridge service

**Files:**
- Create: `tools/printer-bridge/bridge_server.py`
- Create: `tools/printer-bridge/bridge_config.json`
- Test: `tests/printer-bridge/test_bridge_server.py`

- [ ] **Step 1: Write the failing test**

Add Python unit tests for:
- media alias resolution
- file type validation
- request auth validation
- print command construction

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_bridge_server
```

Expected: FAIL because the module and handlers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement a small HTTP server that:
- serves `/health`
- returns default printer status
- accepts `print-image`, `print-pdf`, and `cancel`
- shells out only to allowlisted CUPS commands for the configured queue

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_bridge_server
```

Expected: PASS

## Chunk 2: Tunnel Scripts And Remote Plugin

### Task 3: Add local tunnel and service management scripts

**Files:**
- Create: `tools/printer-bridge/start_bridge.sh`
- Create: `tools/printer-bridge/start_tunnel.sh`
- Create: `tools/printer-bridge/stop_tunnel.sh`
- Test: `tests/printer-bridge/test_scripts.py`

- [ ] **Step 1: Write the failing test**

Add tests that assert the scripts exist and include the expected reverse `SSH` and bridge command structure.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_scripts
```

Expected: FAIL because the scripts do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create scripts that:
- launch the local bridge on loopback
- create an `ssh -R` tunnel from the Mac to `devbox`
- provide a stop path for the tunnel

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_scripts
```

Expected: PASS

### Task 4: Add the remote OpenClaw printer plugin files

**Files:**
- Create: `tools/printer-bridge/openclaw-printer-plugin/openclaw.plugin.json`
- Create: `tools/printer-bridge/openclaw-printer-plugin/package.json`
- Create: `tools/printer-bridge/openclaw-printer-plugin/index.mjs`
- Test: `tests/printer-bridge/test_remote_plugin.py`

- [ ] **Step 1: Write the failing test**

Add tests that assert:
- plugin metadata exists
- the plugin defines the four printer tools
- the plugin reads bridge URL and token from config or environment

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_remote_plugin
```

Expected: FAIL because the plugin files do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement a remote plugin that:
- registers `printer_get_status`
- registers `printer_print_image`
- registers `printer_print_pdf`
- registers `printer_cancel_job`
- forwards requests to the bridge with bearer auth

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && python3 -m unittest tests.printer-bridge.test_remote_plugin
```

Expected: PASS

## Chunk 3: Remote Runtime Wiring And End-To-End Verification

### Task 5: Write remote OpenClaw knowledge files and install the plugin

**Files:**
- Create on remote: `/home/devbox/.openclaw/workspace/TOOLS.md` append printer bridge notes if absent
- Create on remote: `/home/devbox/.openclaw/workspace/PRINTER_BRIDGE.md`
- Create on remote: `/home/devbox/.openclaw/extensions/openclaw-printer-bridge/openclaw.plugin.json`
- Create on remote: `/home/devbox/.openclaw/extensions/openclaw-printer-bridge/package.json`
- Create on remote: `/home/devbox/.openclaw/extensions/openclaw-printer-bridge/index.mjs`
- Modify on remote: `/home/devbox/.openclaw/openclaw.json`

- [ ] **Step 1: Write the failing test**

Verify the remote plugin path and workspace doc do not exist yet.

Run:

```bash
ssh devbox 'bash -lc "test -f /home/devbox/.openclaw/workspace/PRINTER_BRIDGE.md && test -f /home/devbox/.openclaw/extensions/openclaw-printer-bridge/index.mjs"'
```

Expected: non-zero exit code

- [ ] **Step 2: Run test to verify it fails**

Record the failure and inspect the existing remote config before modifying it.

- [ ] **Step 3: Write minimal implementation**

Copy the plugin files to the remote extension directory, append printer bridge facts to the remote workspace docs, and update remote OpenClaw config so the plugin is allowlisted and enabled.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
ssh devbox 'bash -lc "test -f /home/devbox/.openclaw/workspace/PRINTER_BRIDGE.md && test -f /home/devbox/.openclaw/extensions/openclaw-printer-bridge/index.mjs"'
```

Expected: exit code `0`

### Task 6: Verify the live bridge and remote plugin end to end

**Files:**
- No new files required

- [ ] **Step 1: Start the local bridge**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && tools/printer-bridge/start_bridge.sh
```

Expected: local bridge responds on loopback.

- [ ] **Step 2: Start the reverse tunnel**

Run:

```bash
cd /Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge && tools/printer-bridge/start_tunnel.sh
```

Expected: remote loopback port is bound on `devbox`.

- [ ] **Step 3: Verify local and remote health**

Run:

```bash
curl http://127.0.0.1:4771/health
ssh devbox 'bash -lc "curl -s http://127.0.0.1:4771/health"'
```

Expected: both return a healthy JSON response.

- [ ] **Step 4: Verify a real status call and print submission**

Run the bridge endpoints directly and then check the local queue:

```bash
ssh devbox 'bash -lc "curl -s -H \"Authorization: Bearer $OPENCLAW_PRINTER_BRIDGE_TOKEN\" http://127.0.0.1:4771/v1/printers/default"'
lpstat -W not-completed -o Mi_Wireless_Photo_Printer_1S__6528_
```

Expected: remote status call returns the printer metadata and local queue reflects any submitted test job.

- [ ] **Step 5: Verify OpenClaw integration**

Run:

```bash
ssh devbox 'bash -lc "/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw gateway status"'
```

Then inspect the runtime or plugin registration output and confirm the printer bridge plugin is loaded without errors.
