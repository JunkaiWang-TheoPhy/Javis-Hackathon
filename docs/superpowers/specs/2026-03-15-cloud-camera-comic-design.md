# Cloud Camera Comic Design

**Date:** 2026-03-15

## Goal

Configure the cloud devbox so explicit one-shot camera captures from either the Windows PC or the MacBook are turned into comic-style images with a prominent lobster motif, then saved under the cloud `comic/` folder.

## Scope

This design covers cloud-side implementation only:

- one-shot Windows capture flow
- one-shot Mac capture flow
- a shared comic renderer
- output storage under `~/.openclaw/workspace/comic/`

It does not add background listeners, cron jobs, OpenClaw plugins, or automatic processing for continuous camera loops.

## Constraints

- The user wants both `localpc-camera` and `localmac-camera` supported.
- The trigger must be explicit single-photo capture only.
- The output folder lives on the devbox.
- The current devbox does not expose an image-generation API key in shell config.
- The current devbox does not have Pillow installed yet.

Because the cloud does not currently have a ready image-generation credential, the first implementation should use a deterministic local renderer instead of depending on a remote image API.

## Desired Outcome

After the change:

- a Windows one-shot command captures a fresh photo, syncs it to the devbox cache, renders a comic version, and writes the result to the cloud `comic/` folder
- a Mac one-shot command uses OpenClaw node camera capture, syncs the photo into the devbox cache, renders a comic version, and writes the result to the same `comic/` folder
- each render adds a clearly visible lobster element in a prominent position
- each output includes machine-readable metadata for verification

## Design

### Shared comic renderer

Add a cloud-side Python renderer that:

- reads a captured source image from either cache directory
- converts it into a comic-like look using local image processing
- overlays a prominent lobster illustration near the top-right area
- writes the final image and a JSON sidecar into `~/.openclaw/workspace/comic/`

The renderer should be deterministic and local:

- no external image model required
- no hidden dependency on OpenAI credentials
- easy to verify and debug from the devbox

### Windows one-shot flow

Add a devbox wrapper that:

1. triggers the existing Windows one-shot camera PowerShell script through `localpc-pwsh`
2. pulls the resulting `latest.jpg` and `latest.json` into `~/.openclaw/workspace/.cache/localpc-camera/`
3. invokes the shared comic renderer with source `localpc`

This keeps Windows support aligned with the current SSH-based bridge.

### Mac one-shot flow

Add a devbox wrapper that:

1. calls OpenClaw `nodes camera snap` against the paired local Mac node
2. copies the returned `MEDIA:` file into `~/.openclaw/workspace/.cache/localmac-camera/latest.jpg`
3. writes a small metadata JSON for the capture
4. invokes the shared comic renderer with source `localmac`

This keeps Mac support aligned with the existing OpenClaw node camera flow.

### Output layout

All generated comics should be stored in:

- `~/.openclaw/workspace/comic/`

For each successful render, write:

- `<timestamp>-<source>-comic.png`
- `<timestamp>-<source>-comic.json`

The JSON sidecar should include:

- source
- capture path
- output path
- render mode
- created timestamp

### Error handling

The wrappers should fail fast when:

- the camera capture does not produce a file
- the cache sync fails
- the renderer dependency is missing
- the renderer does not write an output

Failures should be surfaced directly in the shell so the devbox operator can see whether the problem is capture, sync, or render.

## Verification

Verification should confirm:

- the Python renderer passes a focused local test suite
- the devbox can create `~/.openclaw/workspace/comic/`
- a real OpenClaw Mac camera capture succeeds
- the comic renderer writes at least one output file and JSON sidecar
- the output file is present on the devbox under the `comic/` folder

## Future upgrade path

If the devbox later gets a dedicated image-generation credential, the shared renderer can be swapped behind the same wrapper commands without changing the capture flows or output contract.
