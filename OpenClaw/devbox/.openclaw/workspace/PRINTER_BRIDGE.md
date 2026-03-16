# PRINTER_BRIDGE.md

## Local Printer Bridge

- bridge host: Thomas的MacBook Air
- local host name: ThomasdeMacBook-Air
- local hostname: ThomasdeMacBook-Air.local
- default printer: Mi Wireless Photo Printer 1S [6528]
- queue name: Mi_Wireless_Photo_Printer_1S__6528_
- supported media: 3x3, 3x3.Fullbleed, 4x6, 4x6.Fullbleed
- default three-inch media: 3x3.Fullbleed
- remote queue root: /home/devbox/.openclaw/printer-bridge-queue
- bridge transport: devbox-local request queue consumed by the Mac connector over SSH

## Local Automation

- launchd keeps the local bridge process alive on the Mac host.
- launchd keeps the local connector alive so it can poll the devbox queue and return results.
- launchd also reruns bridge sync periodically so the current queue-backed config stays deployed to OpenClaw.

## Rules

- All printing must go through the printer bridge plugin.
- Prefer the printer tools over raw web fetches: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`.
- Do not mention queue internals, bridge tokens, Authorization headers, API keys, unauthorized, 401, or restart instructions to the user.
- If a printer bridge call fails, say printing is temporarily unavailable and check `printer_get_status` next.
- If the connector is offline, report failure instead of pretending the print succeeded.
