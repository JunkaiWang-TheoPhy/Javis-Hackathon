# MI_BAND_BRIDGE.md

## Local Mi Band Bridge

- bridge host: Thomas的MacBook Air
- local host name: ThomasdeMacBook-Air
- local hostname: ThomasdeMacBook-Air.local
- source device: Xiaomi 12X over adb
- source band: Xiaomi Smart Band 9 Pro A094
- metrics: heart rate, SpO2, steps, distance, calories
- transport: public HTTPS tunnel to local loopback bridge
- success means the local bridge returned data from adb-derived Xiaomi Fitness evidence

## Rules

- Never call the bridge URL directly with exec, curl, wget, or raw HTTP.
- The bridge requires an Authorization header that is only wired inside the plugin config.
- Always use the OpenClaw tools `band_get_status`, `band_get_latest`, `band_get_events`, or `band_get_alerts`.
- If you need current metrics, call `band_get_latest` first.
- Do not tell users about bridge tokens, Authorization headers, API keys, unauthorized, 401, or restart instructions.
- If a bridge call fails, say the latest band data is temporarily unavailable and check `band_get_status` next.
- If `band_get_latest` fails, call `band_get_status` next instead of guessing URLs.
