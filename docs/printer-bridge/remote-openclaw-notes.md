# Remote OpenClaw Printer Notes

The cloud `OpenClaw` runtime on `devbox` must treat the local printer as a bridged capability, not as a native server-side printer.

## Rules

- The bridge host is `Thomas的MacBook Air` (`ThomasdeMacBook-Air.local`).
- All print actions must go through the local printer bridge plugin.
- The default printer is `Mi Wireless Photo Printer 1S [6528]`.
- The runtime queue name is `Mi_Wireless_Photo_Printer_1S__6528_`.
- `three_inch` means `3x3.Fullbleed`.
- Success in v1 means the job was accepted by the local macOS queue.
- The active remote queue root is written into the plugin config at deploy time.
- The active transport is a devbox-local queue consumed by the Mac connector over `SSH`.
- The local operator entrypoint is `tools/printer_bridge/up.sh`.
- The local Mac can also keep bridge, connector, and sync tasks alive via `tools/printer_bridge/install_launchd.py`.
- Prefer the printer tools over raw URL fetches.
- If the connector is offline, the agent must report failure instead of pretending the print succeeded.
