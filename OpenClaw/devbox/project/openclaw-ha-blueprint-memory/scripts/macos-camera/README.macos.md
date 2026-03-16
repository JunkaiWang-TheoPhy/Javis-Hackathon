# macOS Camera -> OpenClaw Ambient Sidecar

This is the macOS counterpart to `scripts/windows-camera/`, but it follows the newer ambient-first model:

```text
Mac webcam
  -> local sidecar
  -> latest.jpg / latest.json in local cache
  -> POST /v1/ambient/observe
  -> optional POST /hooks/agent
  -> OpenClaw decides whether to escalate
```

## What Exists

```text
scripts/macos-camera/
  README.macos.md
  launchd/
    launchd-common.sh
    install-user-launch-agents.sh
    uninstall-user-launch-agents.sh
    status-user-launch-agents.sh
    run-openclaw-devbox-tunnel.sh
    run-rokid-bridge-gateway.sh
    run-mac-camera-sidecar.sh
    run-openclaw-app.sh
    templates/
      ai.javis.openclaw-macos-app.plist.template
      ai.javis.openclaw-devbox-tunnel.plist.template
      ai.javis.rokid-bridge-gateway.plist.template
      ai.javis.mac-camera-sidecar.plist.template
  local-macos/
    mac-camera-common.sh
    mac-camera-list
    mac-camera-shot
    mac-camera-loop
    mac-camera-start
    mac-camera-stop
    mac-camera-status
    mac-camera-emit-event
  devbox/
    localmac-camera-common.sh
    localmac-cam-snap
    localmac-cam-clip
```

## Verified State

As of `2026-03-15`:

- local `mac-camera-shot` writes:
  - `~/.openclaw/workspace/.cache/localmac-camera/latest.jpg`
  - `~/.openclaw/workspace/.cache/localmac-camera/latest.json`
  - `~/.openclaw/workspace/.cache/localmac-camera/state.json`
- local `mac-camera-emit-event` successfully posts to:
  - `POST /v1/ambient/observe`
- OpenClaw HTTP hooks were enabled on `devbox`
- direct `POST /hooks/agent` smoke test returned a real `runId`
- combined path `shot -> emit-event -> /hooks/agent` was validated
- `localmac-cam-snap` works through the local CLI to the remote gateway
- user launch agents were installed for:
  - `ai.javis.openclaw-devbox-tunnel`
  - `ai.javis.rokid-bridge-gateway`
  - `ai.javis.mac-camera-sidecar`
  - `ai.javis.openclaw-macos-app`
- launchd-managed health checks were verified:
  - `http://127.0.0.1:18789/health`
  - `http://127.0.0.1:3301/v1/health`
- runtime files are copied to:
  - `~/.openclaw/workspace/.cache/localmac-camera/launchd/runtime/`
- the SSH identity used by launchd is copied to:
  - `~/.openclaw/workspace/.config/macos-camera-launchd/devbox_id_ed25519`

## launchd Persistent Runtime

The persistent local stack is now intended to be:

```text
login
  -> ai.javis.openclaw-devbox-tunnel
  -> ai.javis.rokid-bridge-gateway
  -> ai.javis.mac-camera-sidecar
  -> ai.javis.openclaw-macos-app
```

Install or refresh the user LaunchAgents:

```bash
./scripts/macos-camera/launchd/install-user-launch-agents.sh
```

Inspect job state:

```bash
./scripts/macos-camera/launchd/status-user-launch-agents.sh
```

Remove them:

```bash
./scripts/macos-camera/launchd/uninstall-user-launch-agents.sh
```

The installer deliberately does **not** execute directly from the repo at runtime.

Why:

- this repo lives under `Documents/`
- macOS launchd background jobs hit `Operation not permitted` / `getcwd` failures when trying to execute scripts directly from protected folders
- the installer therefore copies the runtime scripts and the `devbox` SSH identity into:
  - `~/.openclaw/workspace/.cache/localmac-camera/launchd/runtime/`
  - `~/.openclaw/workspace/.config/macos-camera-launchd/`

The tunnel is now launchd-owned:

```text
127.0.0.1:18789 -> devbox:127.0.0.1:18789
```

Verified after installation:

```bash
curl http://127.0.0.1:18789/health
curl http://127.0.0.1:3301/v1/health
```

## Current Runtime Caveat

`camera.clip` was explicitly enabled on the remote gateway allowlist, but it is **not stable** on this machine/app combination.

Observed behavior:

- the command is no longer blocked by policy
- invoking `camera.clip` can disconnect the node
- macOS logs show `AVCaptureMovieFileOutput` compressor errors
- the macOS app can crash after export completes

So the current state is:

- `camera.snap`: verified and usable
- `camera.clip`: verified and usable with the locally patched macOS app bundle

## `camera.clip` Status

`camera.clip` is now working end-to-end in this environment, but only through a locally patched macOS app bundle.

Validated path:

- remote gateway policy explicitly allows:
  - `camera.snap`
  - `camera.clip`
- the paired macOS node remains:
  - `e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
- the locally patched app bundle runs from:
  - `~/.openclaw/workspace/.cache/localmac-camera/OpenClaw-patched.app`
- `camera.snap` still succeeds
- `camera.clip` now succeeds and returns a real `MEDIA:` mp4 path instead of crashing the app

Root cause of the original failure:

- stock `OpenClaw.app 2026.3.12` crashed in the `camera.clip` export completion path
- crash reports consistently pointed at:
  - queue: `com.apple.coremedia.figassetexportsession.notifications`
  - frames involving the `AVAssetExportSession` completion bridge
- the local fix keeps export completion off the direct async resumption path and waits from a separate utility queue before reading final export state

Relevant source paths in the local OpenClaw macOS checkout:

- `apps/macos/Sources/OpenClaw/CameraCaptureService.swift`
- `apps/macos/Sources/OpenClaw/CronModels.swift`
- `apps/macos/Tests/OpenClawIPCTests/CameraCaptureServiceTests.swift`
- `apps/macos/Tests/OpenClawIPCTests/CronModelsTests.swift`

Operational note:

- if the remote `devbox` config drifts back to `allowCommands: ["camera.snap"]`, `camera.clip` will fail at the gateway policy layer again
- the patched app is launched by the existing `launchd` stack through:
  - `ai.javis.openclaw-macos-app`

## Prerequisites

- `OpenClaw.app` installed and running
- the paired node id remains:

```text
e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116
```

- local tunnel to the remote gateway:

```bash
ssh -fN -L 18789:127.0.0.1:18789 devbox
```

- local CLI configured to point at `ws://127.0.0.1:18789`

## Local Commands

List the node camera:

```bash
./scripts/macos-camera/local-macos/mac-camera-list
```

Take one local sidecar snapshot:

```bash
./scripts/macos-camera/local-macos/mac-camera-shot
```

Inspect local sidecar state:

```bash
./scripts/macos-camera/local-macos/mac-camera-status
```

Run one ambient emission:

```bash
./scripts/macos-camera/local-macos/mac-camera-emit-event
```

Start the loop:

```bash
./scripts/macos-camera/local-macos/mac-camera-start
```

Stop the loop:

```bash
./scripts/macos-camera/local-macos/mac-camera-stop
```

## Hooking Into OpenClaw

`mac-camera-emit-event` can optionally trigger a real OpenClaw agent run after ambient route success.

Environment variables:

```bash
export OPENCLAW_HOOK_URL=http://127.0.0.1:18789/hooks/agent
export OPENCLAW_HOOK_TOKEN=...
export OPENCLAW_HOOK_AGENT_ID=main
export OPENCLAW_HOOK_NAME=MacCamera
export OPENCLAW_HOOK_WAKE_MODE=now
```

Then:

```bash
MAC_CAMERA_FORCE_EMIT=1 ./scripts/macos-camera/local-macos/mac-camera-emit-event
```

## Devbox-Targeted Wrapper Commands

Force a snapshot through the paired node:

```bash
./scripts/macos-camera/devbox/localmac-cam-snap
```

Try a short clip through the paired node:

```bash
./scripts/macos-camera/devbox/localmac-cam-clip
```

The clip wrapper is now expected to work as long as:

- the patched app bundle is the one launchd starts
- the remote gateway still allows `camera.clip`

## launchd Caveat: `OpenClaw.app` is now started automatically, but ad hoc capture is still less stable than the loop

The launchd stack now also runs a watchdog-style `OpenClaw.app` starter on login, which means the paired macOS node is no longer purely manual.

Current verified behavior:

- `SSH tunnel`: persistent and verified
- `ambient bridge gateway`: persistent and verified
- `camera sidecar loop`: persistent and verified
- `OpenClaw.app`: persistent and verified as a launchd-managed process
- background sidecar loop resumed writing `latest.jpg`, `latest.json`, and `state.json`
- background sidecar loop resumed posting ambient events to `/v1/ambient/observe`

Current remaining instability:

- the local websocket/node path can still flap with errors such as:
  - `gateway closed (1006 abnormal closure (no close frame))`
  - `gateway closed (1012): service restart`
  - `unknown node: <mac-node-id>`
- `mac-camera-shot` now retries those transient failures with a lightweight `nodes camera list` refresh before giving up
- a fresh live validation after that retry hardening completed successfully and updated:
  - `~/.openclaw/workspace/.cache/localmac-camera/latest.jpg`
  - `~/.openclaw/workspace/.cache/localmac-camera/latest.json`
  - `~/.openclaw/workspace/.cache/localmac-camera/state.json`
- if the upstream `devbox` SSH ingress on `hzh.sealos.run:2233` starts closing connections for longer than the retry window, local camera commands will still fail because the local `ws://127.0.0.1:18789` path depends on that SSH tunnel remaining healthy

So the current state is:

```text
launchd now owns tunnel + bridge + sidecar + OpenClaw.app
the background loop is working again
single ad hoc camera invocations are now more resilient to short gateway and node flaps
prolonged upstream SSH or gateway outages still break both paths
```
