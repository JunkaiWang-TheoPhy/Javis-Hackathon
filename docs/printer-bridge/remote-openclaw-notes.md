# Remote OpenClaw Printer Notes

The cloud `OpenClaw` runtime on `devbox` must treat the local printer as a bridged capability, not as a native server-side printer.

## Rules

- The bridge host is `Thomas的MacBook Air` (`ThomasdeMacBook-Air.local`).
- All print actions must go through the local printer bridge.
- The default printer is `Mi Wireless Photo Printer 1S [6528]`.
- The runtime queue name is `Mi_Wireless_Photo_Printer_1S__6528_`.
- `three_inch` means `3x3.Fullbleed`.
- Success in v1 means the job was accepted by the local macOS queue.
- The active bridge URL is written into the plugin config at deploy time.
- The local operator entrypoint is `tools/printer_bridge/up.sh`.
- The local Mac can also keep bridge and sync tasks alive via `tools/printer_bridge/install_launchd.py`.
- If the bridge is offline, the agent must report failure instead of pretending the print succeeded.
