# OpenClaw Printer Bridge

This directory records the stable local and remote facts needed to let the cloud `OpenClaw` instance use the local macOS printer bridge.

## Local bridge host

- host role: local bridge executor for printer tools
- computer name: `Thomas的MacBook Air`
- local host name: `ThomasdeMacBook-Air`
- hostname: `ThomasdeMacBook-Air.local`
- queue owner: macOS CUPS
- default printer queue: `Mi_Wireless_Photo_Printer_1S__6528_`
- display name: `Mi Wireless Photo Printer 1S [6528]`

## Supported media

- `3x3`
- `3x3.Fullbleed`
- `4x6`
- `4x6.Fullbleed`

User-facing `three_inch` maps to `3x3.Fullbleed`.

## Remote bridge path

- remote host: `devbox`
- local bridge listen URL: `http://127.0.0.1:9771`
- active bridge URL: set at runtime from `OPENCLAW_PRINTER_BRIDGE_URL` or `~/.openclaw-printer-bridge-tunnel.json`
- tunnel style: public `HTTPS` tunnel into the local loopback bridge

## Allowed bridge actions

- get printer status
- print image
- print PDF
- cancel queued job

## Bring Up

Use [up.sh](/Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge/tools/printer_bridge/up.sh) to bring the stack back to a usable state in one command.

- local bridge: ensures the loopback printer bridge is healthy
- public tunnel: reuses the current HTTPS tunnel when healthy, otherwise starts a new one
- remote config: redeploys the current public bridge URL to `devbox`
- remote gateway: starts `openclaw gateway run --force` on `devbox` when it is not already running

The script also writes a local persisted copy of the bridge facts to:

- `~/.openclaw-printer-bridge/README.md`
- `~/.openclaw-printer-bridge/profile.json`

## Launchd

Use [install_launchd.py](/Users/thomasjwang/.config/superpowers/worktrees/Javis-Hackathon/printer-bridge/tools/printer_bridge/install_launchd.py) to install persistent user LaunchAgents on this Mac.

- `com.javis.openclaw.printer-bridge`: keeps the local bridge process alive
- `com.javis.openclaw.printer-sync`: runs `up.sh --skip-remote-gateway` every 5 minutes and at login to refresh tunnel state and redeploy the current bridge URL to `devbox`
