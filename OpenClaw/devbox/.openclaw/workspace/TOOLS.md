# TOOLS.md - Local Device Notes

Use this file for device names, node IDs, helper commands, and bridge caveats.

## Local Mac Node

The user's MacBook is available through a paired OpenClaw macOS node. Treat that node path as the primary control plane.

- display name: `Thomas的MacBook Air`
- node id: `e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
- client id: `openclaw-macos`
- client mode: `node`
- access path: paired OpenClaw node, not raw SSH
- last verified in repo notes: `2026-03-15`

What was already verified:

- `openclaw nodes describe --node e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
  - expected status in healthy state: `paired · connected`
- `openclaw nodes camera list --node e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
  - expected camera label: `MacBook Air相机`
- `openclaw nodes camera snap --node e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116 --facing front --delay-ms 2000`
  - already succeeded and wrote a JPEG on `2026-03-15`

Recent live verification from the local operator path:

- verified at: `2026-03-15 10:26:29 CST`
- `openclaw nodes describe --node e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
  - current status: `paired · connected`
  - current perms include: `camera=yes`
  - current caps include: `browser, camera, canvas, screen`

Important operating rule:

- When asked whether Mira can connect to or check the MacBook, do not infer from missing SSH details.
- For a simple yes/no reachability question, prefer the most recent live verification recorded in this file if it is still recent and no newer failure is recorded.
- Only escalate into fresh troubleshooting when the user explicitly asks for a fresh re-check or when a newer failure signal exists.
- If a fresh re-check is needed, verify through `openclaw nodes describe` or `openclaw nodes camera list`.
- If those commands succeed or report connected, say the MacBook is reachable through the OpenClaw node path.
- Do not say `nodes unavailable` unless a direct `openclaw nodes ...` check actually fails.

Important distinction:

- SSH in this workspace is for the cloud devbox.
- The MacBook is normally reached through the paired OpenClaw macOS node, not through raw SSH login.
- A remote skills probe timeout is not the same thing as Mac node unavailability.
- If logs mention `remote bin probe timed out` or `CLI 工具访问不到`, treat that as an internal devbox probe failure unless a direct node check also fails.

Gateway caveat in this environment:

- this devbox runs in a container-like setup where service-style `openclaw gateway status` or `openclaw gateway restart` can say the gateway service is disabled even while the foreground gateway process is healthy
- do not treat `service disabled` as proof that the gateway is down
- prefer real liveness checks such as:
  - `curl -s http://127.0.0.1:18789/metis/agent/api/health`
  - `ss -ltnp | grep 18789`
- only say the gateway is unavailable if those direct checks fail
- when reporting back to the user, summarize the result instead of narrating every internal probe step

Current limitations:

- `camera.snap` is allowed and verified.
- `camera.clip` is still unreliable because the macOS OpenClaw app can crash during video export completion.
- Prefer `camera.snap` for live captures unless the user explicitly wants to debug `camera.clip`.
- The current primary model is expected to support image input for camera analysis. If image reasoning regresses, check the provider model catalog first before blaming the node.
## Printer Bridge

- local macOS bridge host: `Thomas的MacBook Air`
- local macOS default printer: `Mi Wireless Photo Printer 1S [6528]`
- queue name: `Mi_Wireless_Photo_Printer_1S__6528_`
- default 3-inch media: `3x3.Fullbleed`
- remote queue root: `/home/devbox/.openclaw/printer-bridge-queue`
- local automation: `launchd` bridge keepalive + connector keepalive + periodic sync
- OpenClaw printer tools: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`
- The queue is local to devbox; the Mac connector polls it over SSH and returns results back into the same queue
- Do not tell users about queue internals, bridge tokens, unauthorized, 401, API keys, or restart steps
- If the printer bridge fails, say printing is temporarily unavailable, then inspect status through the printer tools

