# Windows Camera -> Cloud OpenClaw

This is the Windows-specific terminal-script version of the local camera bridge.

It is designed for this flow:

```text
Windows Integrated Camera
  -> local PowerShell capture loop
  -> latest.jpg / latest.json on the Windows PC
  -> devbox wrapper pulls latest.jpg into ~/.openclaw/workspace/.cache/localpc-camera/
  -> OpenClaw reads the freshest frame from the cloud workspace
```

## Layout

```text
scripts/windows-camera/
  README.windows.md
  local-windows/
    win-camera-common.ps1
    win-camera-list.ps1
    win-camera-shot.ps1
    win-camera-loop.ps1
    win-camera-start-loop.ps1
    win-camera-stop-loop.ps1
    win-camera-status.ps1
  devbox/
    localpc-pwsh
    localpc-camera-common.sh
    localpc-cam-list
    localpc-cam-start
    localpc-cam-status
    localpc-cam-pull
    localpc-cam-stop
```

## What Was Validated

- Local Windows camera device: `Integrated Camera`
- FFmpeg installed locally
- Local loop writes:
  - `C:\Users\14245\AppData\Local\Temp\openclaw-camera\latest.jpg`
  - `C:\Users\14245\AppData\Local\Temp\openclaw-camera\latest.json`
- Devbox pull writes:
  - `~/.openclaw/workspace/.cache/localpc-camera/latest.jpg`
  - `~/.openclaw/workspace/.cache/localpc-camera/latest.json`

## Install On The Windows PC

Copy the `local-windows/` scripts into:

```text
C:\Users\14245\.local\bin\
```

You also need FFmpeg available locally. The tested path was a WinGet install of `Gyan.FFmpeg.Essentials`.

## Install On The Devbox

Copy the `devbox/` scripts into:

```text
~/bin/
```

The devbox side assumes:

- SSH alias `localpc` already works
- `localpc-pwsh` can execute PowerShell on the Windows PC
- the OpenClaw workspace exists under `~/.openclaw/workspace`

## Recommended Runtime Flow

Start the Windows capture loop:

```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.local\bin\win-camera-start-loop.ps1" -IntervalMs 1000
```

Check local loop status:

```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\.local\bin\win-camera-status.ps1"
```

From the devbox, pull the freshest frame:

```bash
~/bin/localpc-cam-start 1000
~/bin/localpc-cam-pull
cat ~/.openclaw/workspace/.cache/localpc-camera/latest.json
```

## Notes

- This is optimized for Claw ingestion, not human-facing video preview.
- Prefer the loop-and-pull flow. One-off snapshots are less stable when the camera is already in use.
- The scripts are intentionally Windows-only on the local side. A macOS version should live in a separate sibling directory.
