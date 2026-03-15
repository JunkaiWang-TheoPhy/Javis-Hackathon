# OpenClaw Printer Bridge

This directory records the stable local and remote facts needed to let the cloud `OpenClaw` instance use the local macOS printer bridge without relying on a public tunnel URL.

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
- remote bridge reference: `queue://devbox/home/devbox/.openclaw/printer-bridge-queue`
- transport style: `OpenClaw` plugin writes queue entries on `devbox`, then this Mac connector polls that queue over `SSH`

## Allowed bridge actions

- get printer status
- print image
- print PDF
- cancel queued job

## Bring Up

Use [up.sh](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/printer_bridge/up.sh) to bring the stack back to a usable state in one command.

- local bridge: ensures the loopback printer bridge is healthy
- remote deploy: refreshes the queue-backed plugin config and helper files on `devbox`
- local connector: ensures the Mac queue connector is polling `devbox` and returning results
- remote gateway: starts `openclaw gateway run --force` on `devbox` when it is not already running

The script also writes a local persisted copy of the bridge facts to:

- `~/.openclaw-printer-bridge/README.md`
- `~/.openclaw-printer-bridge/profile.json`

## High-Level Print Command

Use [print_image.py](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/printer_bridge/print_image.py) to submit one image print job without manually calling the bridge API.

- default media alias: `three_inch`
- bridge selection: prefer the local loopback bridge
- self-healing: if no healthy local bridge URL is available, it can call `up.sh --skip-remote-gateway`
- safety: `--dry-run` shows the resolved bridge URL and request metadata without sending a print job

## Launchd

Use [install_launchd.py](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/printer_bridge/install_launchd.py) to install persistent user LaunchAgents on this Mac.

- `com.javis.openclaw.printer-bridge`: keeps the local bridge process alive
- `com.javis.openclaw.printer-tunnel`: keeps the queue connector alive so `devbox` requests continue to be drained over `SSH`
- `com.javis.openclaw.printer-sync`: runs `up.sh --skip-remote-gateway` every 5 minutes and at login to refresh the remote plugin config
- launchd runs a staged copy under `~/.openclaw-printer-bridge/runtime` so background jobs do not depend on direct execution from `~/Documents`

## Health Checks

- local bridge liveness lives at `/health`
- the remote connector health is represented by queue heartbeat freshness on `devbox`
- OpenClaw should prefer `printer_get_status`, `printer_print_image`, `printer_print_pdf`, and `printer_cancel_job` over raw bridge fetches
