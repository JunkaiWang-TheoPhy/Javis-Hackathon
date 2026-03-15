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
- `camera.clip`: allowed by policy, wrapper exists, but runtime is unstable and should be treated as experimental

## `camera.clip` Root-Cause Notes

The current failure is narrower than a generic "camera clip does not work".

Validated facts:

- `camera.clip` is accepted by the remote gateway policy
- the paired macOS node receives the command
- a `.mov` recording is produced in the user temp directory
- an `.mp4` export is also produced in the user temp directory
- the exported `mp4` is valid and readable

What fails is the macOS app after export completion:

- `OpenClaw.app` crashes with `EXC_BAD_ACCESS / SIGSEGV`
- crash reports consistently point at:
  - queue: `com.apple.coremedia.figassetexportsession.notifications`
  - frames including:
    - `AVAssetExportSession ... completion handler`
    - `CheckedContinuation.resume(returning:)`

This means the current strongest hypothesis is:

- not a gateway policy problem
- not a camera permission problem
- not a file-generation problem
- not a payload-size problem for these short test clips
- but a runtime bug in the macOS app's `camera.clip` export completion / async result bridge

Relevant source paths in the OpenClaw macOS app checkout:

- `apps/macos/Sources/OpenClaw/CameraCaptureService.swift`
- `apps/macos/Sources/OpenClaw/NodeMode/MacNodeRuntime.swift`

Until that path is fixed upstream or patched locally, use `camera.snap` for productionized flows and treat `camera.clip` as diagnostic-only.

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

Treat the clip wrapper as experimental until the macOS runtime issue is resolved.

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
