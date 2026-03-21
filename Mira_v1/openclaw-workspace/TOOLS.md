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

## Local Mi Band Bridge

This workspace can also reach the user's Mi Band data through a local desktop bridge.

- bridge host: `Thomas的MacBook Air`
- local host names: `ThomasdeMacBook-Air`, `ThomasdeMacBook-Air.local`
- source phone: `Xiaomi 12X`
- source band: `Xiaomi Smart Band 9 Pro A094`
- transport path: local desktop bridge exposed to the cloud runtime
- primary tools: `band_get_status`, `band_get_latest`, `band_get_events`, `band_get_alerts`, `band_get_fresh_latest`

Known physiological information entry catalog to mention when the user asks broadly:

- cardiovascular: heart rate, resting heart rate, average heart rate, maximum heart rate, minimum heart rate
- oxygen: blood oxygen / SpO2, including sleeping blood-oxygen style entries in the Xiaomi Health surface
- activity: steps, distance, calories
- sleep: sleep duration, fall-asleep time, wake-up time, sleep stages, sleep score or quality, sleep regularity or continuity, average sleeping heart rate, average sleeping blood oxygen, breathing-related sleep indicators
- stress and recovery: stress, all-day stress, workout or training stress, recovery, physical recovery, mental recovery, fatigue level, HRV-related indicators

What is currently structured and queryable:

- band identity and firmware
- phone identity and adb transport
- connection status and last-seen timing
- heart rate
- blood oxygen / SpO2
- steps
- distance
- calories
- source timestamp
- bridge timestamp
- freshness in seconds
- runtime status
- event history
- active alerts
- fresh-read success or timeout metadata

Known Xiaomi Health modules that may be mentioned but should not be overstated as stable bridge outputs:

- sleep
- stress
- recovery

Current stance:

- sleep is a known module with stronger evidence in logs and APK resources
- stress and recovery are known modules in the Xiaomi app surface and APK resources
- none of these should be described as stable structured bridge fields unless `MI_BAND_BRIDGE.md` explicitly says they are wired in

Important operating rules:

- for "current heart rate right now", prefer `band_get_fresh_latest`
- for a cached snapshot or summary of wearable state, use `band_get_latest`
- for debugging or health of the bridge itself, use `band_get_status`, `band_get_events`, and `band_get_alerts`
- do not collapse `available` and `fresh` into the same claim; a readable sample can still be stale
- if the user only wants the list of physiological entry types, give the broader catalog first instead of starting with bridge maturity caveats
- do not imply sleep, stress, recovery, or similar Xiaomi Health modules are stable bridge fields unless `MI_BAND_BRIDGE.md` says they are wired in
