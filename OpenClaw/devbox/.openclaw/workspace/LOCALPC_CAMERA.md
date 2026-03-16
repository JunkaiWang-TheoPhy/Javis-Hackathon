# Local PC Camera

This workspace can pull live camera frames from the user's Windows PC.

## Flow

1. On the local Windows PC, run `win-camera-start-loop.ps1`
2. The loop writes `latest.jpg` and `latest.json` under `C:\Users\14245\AppData\Local\Temp\openclaw-camera`
3. On the devbox, pull the freshest frame into the workspace cache with `~/bin/localpc-cam-pull`

## Preferred Commands

```bash
~/bin/localpc-cam-list
~/bin/localpc-cam-start 1000
~/bin/localpc-cam-status
~/bin/localpc-cam-pull
~/bin/localpc-cam-stop
```

## Cache Paths

- Local Windows camera output: `C:\Users\14245\AppData\Local\Temp\openclaw-camera`
- Devbox cache: `~/.openclaw/workspace/.cache/localpc-camera/latest.jpg`
- Devbox metadata: `~/.openclaw/workspace/.cache/localpc-camera/latest.json`

## Notes

- This setup is optimized for Claw ingestion, not human video preview.
- `localpc-cam-start` is the normal entrypoint. Avoid one-off snapshots while the loop is already using the camera.
- `localpc-cam-pull` is safe to call repeatedly; it just refreshes the cached latest frame on the devbox.
