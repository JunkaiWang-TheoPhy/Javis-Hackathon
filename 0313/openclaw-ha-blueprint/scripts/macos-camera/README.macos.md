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
