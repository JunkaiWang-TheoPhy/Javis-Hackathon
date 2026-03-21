# MI_BAND_BRIDGE.md

## Local Mi Band Bridge

This cloud Mira workspace is connected to a local Mi Band desktop bridge running through the user's local Mac.

### Verified Local Topology

- bridge host: `Thomas的MacBook Air`
- local host name: `ThomasdeMacBook-Air`
- local hostname: `ThomasdeMacBook-Air.local`
- source phone: `Xiaomi 12X`
- source phone path: `adb`
- source band: `Xiaomi Smart Band 9 Pro A094`
- transport: reverse SSH or tunnel-backed local desktop bridge

### Primary OpenClaw Tools

- `band_get_status`
- `band_get_latest`
- `band_get_events`
- `band_get_alerts`
- `band_get_fresh_latest`

## Known Physiological Information Entry Catalog

When the user asks broadly what Mi Band can collect, lead with this entry catalog instead of starting from implementation maturity.

### Cardiovascular And Oxygen

- heart rate
- resting heart rate
- average heart rate
- maximum heart rate
- minimum heart rate
- heart-rate time-series or segmented heart-rate records
- blood oxygen / SpO2
- average sleeping blood oxygen

### Activity And Energy

- steps
- distance
- calories

### Sleep

- sleep
- sleep duration
- fall-asleep time
- wake-up time
- sleep stages such as light sleep, deep sleep, REM, and wake
- sleep quality or sleep score
- sleep regularity or continuity
- average sleeping heart rate
- breathing-related sleep indicators such as sleeping breath rate

### Stress And Recovery

- stress
- all-day stress
- workout or training stress
- recovery
- physical recovery
- mental recovery
- fatigue level
- HRV-related stress or recovery indicators

## What Mira Can Currently Read

When the user asks what the Mi Band bridge can collect, describe it in categories rather than only naming one metric.

### 1. Device And Bridge Identity

- band display name
- band MAC
- band DID
- band model
- band firmware version
- source phone model
- source phone adb serial
- source phone adb target
- source phone transport type such as `usb` or `wireless`

### 2. Connection And Reachability

- bridge service status
- whether adb is ready
- whether bluetooth is ready
- whether metrics are ready
- whether a local source is ready
- current connection status such as `connected` or `bonded`
- last refresh time
- last seen time
- source kind such as `xiaomi_external_logs` or `adb_logcat`

### 3. Core Health And Activity Metrics

- heart rate
- heart-rate timestamp
- blood oxygen / SpO2
- blood-oxygen timestamp
- steps
- steps timestamp
- distance
- calories

### 4. Freshness And Timing

- source timestamp
- bridge timestamp
- freshness in seconds
- whether the sample is stale

### 5. Runtime Events

The bridge can expose event history, including:

- sync started
- sync finished
- metric updated
- fresh read started
- fresh read succeeded
- fresh read timed out

### 6. Alerts

The bridge can expose active alerts, including:

- `adb_disconnected`
- `band_offline`
- `stale_metrics`
- `collector_stopped`

### 7. Fresh-Read Metadata

When `band_get_fresh_latest` is used, the bridge can also report:

- whether the fresh read succeeded
- whether it timed out
- when the request started
- the baseline heart-rate timestamp
- the latest observed heart-rate timestamp
- the latest heart-rate sample age
- the wait budget
- the polling interval
- whether the phone-side trigger actually executed

### 8. Known Xiaomi Health Modules Not Yet Stable In The Bridge

The Xiaomi Health app and current evidence also indicate additional health domains that Mira may mention as known or partially observed modules, but not yet as stable structured bridge fields:

- sleep
- stress
- recovery

What this means:

- it is acceptable to say these modules exist in the Xiaomi Health ecosystem around this device
- it is acceptable to say they are candidate bridge fields under investigation
- it is not acceptable to say they are already as stable and queryable as heart rate, blood oxygen, steps, distance, or calories unless the bridge explicitly wires them in

Current evidence level:

- sleep is stronger than the others because Xiaomi logs already show sleep widget activity and the APK clearly contains sleep detail resources
- stress and recovery are clearly present in the APK and product surface, but they are not yet treated as stable structured bridge outputs in this deployment

## How To Describe The Capability

Use phrasing like:

- Mira can currently read Mi Band data including heart rate, blood oxygen, steps, distance, calories, sample freshness, bridge runtime status, event history, and active alerts.
- Mira can also tell whether a sample is fresh or stale, and whether a fresh-read attempt succeeded or timed out.
- Mira can additionally mention that sleep, stress, and recovery are known Xiaomi Health modules around this device, but they are not yet guaranteed stable structured bridge fields.

For broad user-facing inventory questions, Mira should prefer wording closer to:

- Mi Band 上常见和可讨论的生理信息条目包括心率、血氧、睡眠、压力、恢复度、步数、距离、卡路里，以及一些衍生的睡眠和心率变异性相关指标。
- 如果用户只是问 `有哪些信息` 或 `装载了哪些信息`，第一轮先把这些条目目录列出来，不要先收缩成 `目前桥里稳定结构化的几项值`。
- 对这类 broad inventory question，不要在同一条首轮回答里再追加 `是否都可持续采集要以当前接入实现为准` 之类的成熟度免责声明；只有当用户追问 `现在你到底能直接读到哪些` 时才展开说明。
- 对用户原话接近 `Mi band上装载了哪些信息` 的提问，默认主列表里必须出现这几项：`心率`、`血氧`、`睡眠`、`压力`、`恢复度`、`步数`、`距离`、`卡路里`。
- 对这类只要目录的问题，避免在第一轮回答里出现 `bpm`、`SpO2%`、`MAC`、`UUID`、时间戳、freshness、bridge field name 之类技术词；除非用户明确要当前数值、测量时间或技术字段。
- 对这类只要目录的问题，也不要先讲设备信息、账户绑定、连接状态、同步时间、告警状态；除非用户明确在问设备/连接层信息。
- 第一轮目录回答里优先用中文常用名，例如 `血氧`，不要写成 `SpO2` 或 `SpO₂`。

Preferred Chinese bullet skeleton for that exact style of question:

1. 生命体征：心率、血氧
2. 睡眠相关：睡眠时长、入睡/醒来、睡眠阶段、睡眠质量
3. 压力与恢复：压力、恢复度、疲劳感、心率变异性相关指标
4. 活动数据：步数、距离、卡路里、训练/运动记录

If the user does not ask for data output, measurement timing, or technical details:

- stop at the entry list
- do not append raw values, units, abbreviations, IDs, timestamps, or runtime diagnostics
- do not volunteer `我可以再查一遍最新三类值` style follow-up unless the user asks for current readings
- do not add device-identity bullets such as `MAC`、`设备 ID`、`固件版本` in that first answer

Do not undersell the bridge as "only heart rate" when broader telemetry is already available.
Do not foreground implementation caveats when the user only wants the catalog of available entry types.

When the user asks a broad question such as "你能采集哪些 Mi Band 数据", prefer listing the categories explicitly:

1. cardiovascular and oxygen
2. activity and energy
3. sleep
4. stress and recovery
5. if useful, then mention system-side status such as freshness, events, alerts, and bridge state

If space allows, mention examples from each category instead of collapsing everything into "health data".
If the user says `把压力睡眠什么的也加进去`, treat that as a clear instruction to expand the first-pass answer so sleep, stress, and recovery appear in the main bullet list rather than in a trailing caveat.

## Important Limitations

- sleep, stress, recovery, and similar Xiaomi Health modules may exist in the app, but they are not yet treated as stable structured bridge fields unless the bridge has explicitly wired them in
- when asked for a comprehensive list, separate stable structured bridge fields from known but not-yet-stable Xiaomi Health modules
- when the user only wants the catalog of item types, it is acceptable to list the broader Xiaomi Health entry families first and discuss maturity only if they ask
- a sample can be available but stale; always distinguish current availability from freshness
- for "what is my current heart rate right now", prefer `band_get_fresh_latest`
- for cached health state or general summary, use `band_get_latest`
- for diagnostics, use `band_get_status`, `band_get_events`, and `band_get_alerts`

## Security And Response Rules

- never tell the user about bridge tokens, Authorization headers, 401 responses, raw bridge URLs, or operator-only restart steps
- never say Mira can see more health fields than the bridge actually returns
- when reporting wearable data, include timestamps when freshness matters
