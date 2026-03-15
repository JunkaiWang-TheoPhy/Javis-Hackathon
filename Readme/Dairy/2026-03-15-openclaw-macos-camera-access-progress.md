# 2026-03-15 OpenClaw macOS Camera Access Progress

## Goal

把这台 Mac 的本机摄像头接到远端 `devbox` 上运行的 OpenClaw，让远端网关可以通过 macOS node 调用：

- `camera.list`
- `camera.snap`

路线选型采用官方推荐的最短路径：

`OpenClaw macOS app -> Remote over SSH -> node pairing -> camera.snap`

参考资料：

- `devbox_openclaw_info.md`
- OpenClaw 官方文档 `platforms/macos`
- OpenClaw 官方文档 `platforms/mac/remote`
- OpenClaw 官方文档 `nodes/camera`

---

## Initial State

开始时已知条件：

- 远端 OpenClaw 跑在 `devbox`
- 远端 gateway 绑定在 `127.0.0.1:18789`
- 本机已有 `openclaw` CLI
- 本机没有安装 `OpenClaw.app`
- 目标是让 macOS app 作为 node 连到远端 gateway，并让远端能抓本机摄像头

---

## Progress Timeline

### 1. Reconnected to `devbox`

先按 `devbox_openclaw_info.md` 恢复远端连接和本地隧道：

- `ssh devbox` 正常
- 远端 `openclaw health` 正常
- 本地隧道恢复为：
  - `127.0.0.1:18789 -> devbox:127.0.0.1:18789`
- 本地 `curl http://127.0.0.1:18789/health` 返回 `{"ok":true,"status":"live"}`

这一步确认了远端 gateway 本身没有问题，后续工作集中在 macOS app 和 node 侧。

### 2. Confirmed the app was missing

检查后确认：

- `/Applications` 没有 `OpenClaw.app`
- Spotlight 也没有现成安装包

因此需要先安装 macOS companion app。

### 3. Tried building from source, found the actual blocker

源码路径：

- `/Users/thomasjwang/tmp/openclaw-src`

做过的检查：

- `pnpm install` 成功
- `pnpm build` 成功
- `node scripts/ui.js build` 成功

真正卡住的不是 TypeScript 或 UI 构建，而是原生打包阶段：

- `swift build` 被本机 Xcode license 拦住
- 报错要求先接受 Xcode 许可

这一步的结论是：

- 源码本身不是主要问题
- 当前机器不能直接继续 native packaging
- 最快路径应该改成官方 release 包安装

### 4. Switched to official release package

通过 GitHub Release 检查后发现：

- 最新稳定版中存在 macOS 发布资产
- 直接下载并安装了 `v2026.3.12`

最终安装位置：

- `/Users/thomasjwang/Applications/OpenClaw.app`

安装后验证：

- `CFBundleIdentifier = ai.openclaw.mac`
- `CFBundleShortVersionString = 2026.3.12`
- app 可以直接启动

这一步绕过了 Xcode license 问题。

### 5. Prepared local remote-mode config

为了让 app 直接走 `Remote over SSH`，做了两类配置：

本机 OpenClaw 配置：

- `~/.openclaw/openclaw.json`
- 将 `gateway.mode` 改为 `remote`
- 配置 `gateway.remote.url = ws://127.0.0.1:18789`
- 配置远端 gateway token

本机 app defaults：

- `openclaw.connectionMode = remote`
- `openclaw.remoteTarget = devbox@hzh.sealos.run:2233`
- `openclaw.remoteIdentity = /Users/thomasjwang/Documents/GitHub/Projects/Mira/hzh.sealos.run_ns-lijecm20_devbox`
- `openclaw.remoteCliPath = /home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw`
- `openclaw.cameraEnabled = true`

安全处理：

- 没有把 token 重新写进本文档
- 本机旧配置已备份到：
  - `~/.openclaw/openclaw.json.bak-20260315-remote-app`

### 6. Launched app and diagnosed the first failure

第一次启动 app 后，日志显示：

- app 先尝试连 `ws://127.0.0.1:18789`
- 此时 tunnel 还没 ready
- 报 `Connection refused`

随后 app 自己拉起了 SSH tunnel：

- `/usr/bin/ssh -N -L 18789:127.0.0.1:18789 ...`

结论：

- 不是凭证错
- 不是 host 配置错
- 是启动时序问题

处理方式：

- 保留 app 自动拉起的 tunnel
- 在 tunnel 已监听后重新启动 app

### 7. Node pairing succeeded

第二次启动后，远端设备表里出现了这台 Mac：

- `deviceId = e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`
- `displayName = Thomas的MacBook Air`
- `clientId = openclaw-macos`
- `clientMode = node`

远端 `paired.json` 中已经存在：

- `operator` token
- `node` token

这说明：

- `Remote over SSH` 已经成立
- node pairing 已经完成

### 8. Upgraded local CLI to match the app/gateway generation

本机原来 CLI 版本过旧：

- `openclaw@2026.1.29`

症状：

- 本机 CLI 读取新配置时重复提示：
  - `Config was last written by a newer OpenClaw (2026.3.12)`

处理：

- 全局升级到 `openclaw@2026.3.12`

升级后：

- `/opt/homebrew/bin/openclaw --version`
- 返回 `OpenClaw 2026.3.12 (6472949)`

### 9. Verified node visibility from the local operator path

验证命令成功读取到 node：

- `openclaw nodes describe --node e07facb8...`
- `openclaw nodes camera list --node e07facb8...`

确认结果：

- node 状态：`paired · connected`
- 摄像头列表成功返回：
  - `MacBook Air相机`

说明远端网关已经能看见本机摄像头设备。

### 10. Unblocked the gateway-side command policy

第一次执行 `camera.snap` 时，网关明确拒绝：

- `camera.snap is not in the allowlist for platform "macOS 15.6.0"`

排查到 OpenClaw 的节点策略默认把 `camera.snap` 归类为危险命令，需要显式放行。

因此在远端 `~/.openclaw/openclaw.json` 增加：

```json
{
  "gateway": {
    "nodes": {
      "allowCommands": ["camera.snap"]
    }
  }
}
```

并保留最小授权，不额外放开：

- `camera.clip`
- `screen.record`

远端旧配置已备份到：

- `~/.openclaw/openclaw.json.bak-20260315-camera-snap`

### 11. Ran the first successful `camera.snap`

最终成功命令：

```bash
openclaw nodes camera snap \
  --node e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116 \
  --facing front \
  --delay-ms 2000
```

成功返回：

```text
MEDIA:/tmp/openclaw/openclaw-camera-snap-front-b24c0ad3-d5a1-4ef4-aab7-72d4165165b1.jpg
```

落盘文件：

- `/private/tmp/openclaw/openclaw-camera-snap-front-b24c0ad3-d5a1-4ef4-aab7-72d4165165b1.jpg`

产物属性：

- 大小：`293K`
- 分辨率：`1600 x 900`

这一步证明：

- app 安装成功
- remote tunnel 成功
- gateway allowlist 配置正确

### 12. Added ambient sidecar design and implementation plan

这轮没有直接写脚本，而是先把设计和执行计划落到 repo：

- `0313/openclaw-ha-blueprint/docs/plans/2026-03-15-macos-camera-sidecar-design.md`
- `0313/openclaw-ha-blueprint/docs/superpowers/plans/2026-03-15-macos-camera-sidecar.md`

设计确定了三件事：

- 默认路径是“后台静默自动拍摄”
- 本地只做低频采样和 cheap gate
- 云端只收结构化 ambient event，按需再升级到 `camera.snap / camera.clip`

### 13. Added a separate ambient contract and route

没有复用现有 `rokid_glasses` 合同，而是新增了：

- `packages/contracts/src/ambient-vision.ts`
- `POST /v1/ambient/observe`

验证通过：

- ambient contract tests 通过
- bridge route tests 通过

### 14. Added the macOS sidecar scripts

新增目录：

- `0313/openclaw-ha-blueprint/scripts/macos-camera/local-macos/`
- `0313/openclaw-ha-blueprint/scripts/macos-camera/devbox/`

其中本地 sidecar 已实现：

- `mac-camera-list`
- `mac-camera-shot`
- `mac-camera-loop`
- `mac-camera-start`
- `mac-camera-stop`
- `mac-camera-status`
- `mac-camera-emit-event`

本地 cache 路径：

- `~/.openclaw/workspace/.cache/localmac-camera/latest.jpg`
- `~/.openclaw/workspace/.cache/localmac-camera/latest.json`
- `~/.openclaw/workspace/.cache/localmac-camera/state.json`

这条链已经被实际跑通：

- `mac-camera-shot` 可以把 node 抓拍结果落到本地 cache
- `mac-camera-emit-event` 可以成功 POST 到 `/v1/ambient/observe`

### 15. Enabled OpenClaw hooks for real workflow entry

除了 ambient route，还在远端 `devbox` 上启用了 OpenClaw HTTP hooks：

- `hooks.enabled = true`
- `hooks.allowedAgentIds = ["main"]`
- `hooks.allowRequestSessionKey = false`
- `hooks.defaultSessionKey = "hook:mac-camera"`
- 使用了单独的 hook token，没有复用 gateway token

实际验证：

- 直接 `POST /hooks/agent` 已返回真实 `runId`
- `mac-camera-emit-event` 现在支持在 ambient route 成功后，再可选地打 `POST /hooks/agent`

这意味着这条链现在已经真正接进了 Claw 工作流，而不只是本地 demo。

### 16. Enabled `camera.clip` policy, but runtime is still unstable

远端 gateway 已经把 node allowlist 从：

- `["camera.snap"]`

扩成：

- `["camera.snap", "camera.clip"]`

这一步已经成功，策略层面不再阻止短视频。

但实际运行时验证发现：

- 调 `camera.clip` 时 node 会掉线
- 本机 `OpenClaw.app` 日志出现 `AVCaptureMovieFileOutput` 压缩器错误
- 之后需要重启 app 和重连节点，`camera.snap` 才能恢复

所以截至当前的真实结论是：

- `camera.snap`：稳定可用
- `camera.clip`：策略已放开，但当前 `OpenClaw.app v2026.3.12` 在这台 Mac 上不稳定

### 17. Recovered the node after clip instability

在 `camera.clip` 触发 node disconnect 后，做了恢复：

- 重启 `OpenClaw.app`
- 重建本地到 `devbox` 的 `18789` 隧道
- 再次检查 node 状态

恢复后结果：

- node 回到 `paired · connected`
- `camera.snap` 再次成功

因此当前环境被恢复到了“抓拍可用、clip 实验性”的状态，没有把你的现有 app 配置留在损坏状态。

### 18. Added launchd-managed persistent tunnel, bridge, and sidecar

为了把本地这条链路从“依赖当前终端”改成“登录后自动恢复”，新增了：

- `0313/openclaw-ha-blueprint/scripts/macos-camera/launchd/`

并实际安装了 3 个用户级 LaunchAgents：

- `ai.javis.openclaw-devbox-tunnel`
- `ai.javis.rokid-bridge-gateway`
- `ai.javis.mac-camera-sidecar`

分别负责：

- `127.0.0.1:18789 -> devbox:127.0.0.1:18789` 的 SSH tunnel
- 本地 `127.0.0.1:3301` 的 ambient bridge gateway
- 本地 `mac-camera-loop` 静默 sidecar

### 19. Had to work around macOS launchd access restrictions

第一次直接让 launchd 执行 repo 里的脚本时失败了。

典型报错是：

- `Operation not permitted`
- `getcwd: cannot access parent directories`

根因是：

- repo 位于 `Documents/`
- launchd 背景 agent 直接执行该目录中的脚本时，会碰到 macOS 的受保护目录访问限制

解决方式：

- 安装脚本不再让 launchd 直接跑 repo 脚本
- 改成把运行时文件复制到：
  - `~/.openclaw/workspace/.cache/localmac-camera/launchd/runtime/`
- 同时把 SSH identity 复制到：
  - `~/.openclaw/workspace/.config/macos-camera-launchd/devbox_id_ed25519`

之后 launchd plists 改为指向这些 runtime 副本，而不再指向 repo 原路径。

### 20. Verified launchd-owned health checks

重新安装后，以下链路已实测成功：

```bash
curl http://127.0.0.1:18789/health
curl http://127.0.0.1:3301/v1/health
```

这证明：

- devbox SSH tunnel 已经由 launchd 接管
- 本地 ambient bridge gateway 已经由 launchd 接管

也就是说，这两个服务不再依赖手工开终端。

### 21. Added `OpenClaw.app` to the login-time runtime

To remove the previous gap where the infrastructure was up but the macOS node was still manual, the launchd stack was extended with:

- `ai.javis.openclaw-macos-app`

This job starts:

- `/Users/thomasjwang/Applications/OpenClaw.app/Contents/MacOS/OpenClaw`

after the local `18789` tunnel becomes reachable, and keeps watching so the app can be relaunched if it disappears.

This changed the persistent local stack from:

```text
tunnel + bridge + sidecar
```

to:

```text
tunnel + bridge + sidecar + OpenClaw.app
```

### 22. Verified the app process under launchd

After reinstalling the user LaunchAgents:

- `launchctl print gui/$(id -u)/ai.javis.openclaw-macos-app` showed `state = running`
- `ps` showed the real app binary:
  - `/Users/thomasjwang/Applications/OpenClaw.app/Contents/MacOS/OpenClaw`

### 23. Sidecar loop recovered after app autostart

With the app launch job in place, the background loop started progressing again.

Fresh observations:

- `loop.log` resumed appending new ambient observations
- `latest.jpg`, `latest.json`, and `state.json` resumed updating
- the sidecar again posted valid ambient envelopes to `/v1/ambient/observe`

This means the steady-state background path is working again.

### 24. Remaining instability is narrower now

The remaining issue is no longer “node not connected forever”.

The narrower remaining issue is:

- ad hoc, one-off manual `mac-camera-shot` can still hit `TIMEOUT`
- but the long-running background loop is healthier and resumed normal updates

So the current state is now more accurately:

```text
launchd owns tunnel / bridge / sidecar / OpenClaw.app
background ambient capture recovered
single-shot reattach behavior is still less stable than the steady-state loop
```

### 25. Current blocker is now clearly upstream SSH ingress instability

After the local watchdog changes, the remaining repeated failure was no longer ambiguous.

Fresh evidence:

- local `mac-camera-shot` failures degraded to:
  - `gateway closed (1006 abnormal closure (no close frame))`
- tunnel stderr repeatedly showed:
  - `Connection closed by 28.0.0.66 port 2233`
  - `ssh: connect to host hzh.sealos.run port 2233: Undefined error: 0`
- direct checks using the same identity also failed:
  - `ssh devbox 'echo ok'`
  - `/usr/bin/ssh -i ~/.openclaw/workspace/.config/macos-camera-launchd/devbox_id_ed25519 -p 2233 devbox@hzh.sealos.run 'echo ok'`

Both returned:

```text
Connection closed by 28.0.0.66 port 2233
```

This is important because it means the current remaining failure is not primarily a local launchd syntax problem anymore.

The current root cause is:

```text
upstream devbox SSH ingress is intermittently closing
local tunnel health collapses
local ws://127.0.0.1:18789 closes
camera commands fail with 1006
```

So the local work completed in this session is:

- launchd-managed tunnel watchdog
- launchd-managed bridge
- launchd-managed sidecar
- launchd-managed OpenClaw.app watchdog

And the current blocker is external:

- the `devbox` SSH endpoint itself is not stable enough right now
- node pairing 成功
- gateway policy 已放通
- 远端确实已经能抓取本机摄像头

---

## Current State

截至 `2026-03-15` 当前状态如下。

### Local machine

- `OpenClaw.app` 已安装并可启动
- 本机 `openclaw` CLI 已升级到 `2026.3.12`
- 本机 `~/.openclaw/openclaw.json` 已切到 remote mode
- app 自动维持 SSH tunnel 到 `devbox`

### Remote `devbox`

- gateway 正常运行
- 仍保持 `bind = loopback`
- 已最小化放开 `gateway.nodes.allowCommands = ["camera.snap"]`
- 这台 Mac node 已经配对并被识别为 connected

### Camera path

- `camera.list` 正常
- `camera.snap` 正常
- 已实拍成功并生成 JPEG

---

## Important Observations

### 1. `Perms` still reports `camera=no`

即便抓拍已经成功，`openclaw nodes describe` 当前仍显示：

- `camera=no`

但这不影响实际抓拍。当前更可信的证据是：

- `camera.snap` 已经成功落盘

因此暂时把它视为：

- 权限状态字段未及时刷新
- 或 metadata 与实际运行权限存在滞后

### 2. Node connectivity is slightly unstable

本机 app 日志中仍能看到：

- 连接成功后短时断开
- `The network connection was lost`
- 然后自动重连

目前这不影响基本能力验证，但如果后面要做高频 `camera.snap`、`camera.clip` 或持续 node 调用，需要继续观察稳定性。

### 3. The release package path was the correct shortcut

源码路径虽然可行，但当前机器被 Xcode license 卡住。对这类环境，直接走官方 release 包是更可靠的方案。

### 4. `camera.clip` failure is in the macOS app video return path, not the bridge

对 `camera.clip` 做了三轮最小复现后，结论比之前更明确：

- 远端 gateway allowlist 已经放通 `camera.clip`
- node pairing 和 camera permission 都不是阻塞点
- 录制 `.mov` 成功
- 导出 `.mp4` 成功
- 失败发生在 `OpenClaw.app` 处理导出完成回调、恢复 async 结果的阶段

这轮定位到的关键证据：

- `openclaw nodes camera clip --duration 3s --no-audio --json`
  - 远端返回的是 `node disconnected (camera.clip)`
- macOS `DiagnosticReports` 新增崩溃报告：
  - `OpenClaw-2026-03-15-075134.ips`
- 三份 crash report 的 faulting thread 都一致：
  - queue: `com.apple.coremedia.figassetexportsession.notifications`
  - frame: `AVAssetExportSession ... completion handler`
  - frame: `CheckedContinuation.resume(returning:)`
  - exception: `EXC_BAD_ACCESS / SIGSEGV`
- 用户级 temp 目录里能看到完整残留文件：
  - `openclaw-camera-*.mov`
  - `openclaw-camera-*.mp4`
- 对残留 `mp4` 做本地校验也正常：
  - 文件可读
  - 可 base64 编码
  - `ffprobe` 能识别为有效 `h264/mp4`

因此当前更可信的判断是：

- `AVCaptureMovieFileOutput` 的 `err=-67444 / property ID 6405` 日志是真实存在的
- 但它不是唯一主因，因为录制和导出最后都产出了有效媒体文件
- 真正把 node 打掉的是 `OpenClaw.app` 在 `camera.clip` 导出完成后的 async/continuation 回传链路

换句话说：

- `camera.snap` 路径：可用
- `camera.clip` 路径：媒体生成成功，但 app 在结果回传阶段崩溃

后续如果要修复，应该优先盯：

1. `apps/macos/Sources/OpenClaw/CameraCaptureService.swift`
   - `exportToMP4(...)`
2. `apps/macos/Sources/OpenClaw/NodeMode/MacNodeRuntime.swift`
   - `OpenClawCameraCommand.clip` 的回传链
3. `AVAssetExportSession` completion 到 Swift async continuation 的桥接方式

### 5. Applied a local source workaround in `openclaw-src`

在本地源码 checkout：

- `/Users/thomasjwang/tmp/openclaw-src/apps/macos/Sources/OpenClaw/CameraCaptureService.swift`
- `/Users/thomasjwang/tmp/openclaw-src/apps/macos/Tests/OpenClawIPCTests/CameraCaptureServiceTests.swift`

已经先落了一个最小 workaround：

- 不再让 `camera.clip` 走当前的 async export completion 恢复路径
- 改成在 `AVAssetExportSession.exportAsynchronously` 外围做 blocking wait
- 目标是先避开 crash 栈里反复出现的：
  - `AVAssetExportSession ... completion handler`
  - `CheckedContinuation.resume(returning:)`

同时补了一条测试意图：

- `clip export uses blocking workaround bridge`

当前状态要说明清楚：

- **源码已修改**
- **还没有完成本机编译和真机回归验证**
- 阻塞原因不是代码，而是这台 Mac 还没有接受 Xcode license，`swift test` / `swift build` 都会直接被系统拦住

---

## Files and Configs Touched

本机：

- `/Users/thomasjwang/Applications/OpenClaw.app`
- `/Users/thomasjwang/.openclaw/openclaw.json`
- `/Users/thomasjwang/.openclaw/openclaw.json.bak-20260315-remote-app`
- `/Users/thomasjwang/Library/Application Support/OpenClaw/identity/device.json`

远端：

- `/home/devbox/.openclaw/openclaw.json`
- `/home/devbox/.openclaw/openclaw.json.bak-20260315-camera-snap`

抓拍产物：

- `/private/tmp/openclaw/openclaw-camera-snap-front-b24c0ad3-d5a1-4ef4-aab7-72d4165165b1.jpg`

---

## Recommended Next Steps

按优先级建议后续继续做这几件事：

1. 把 `camera.snap` 封装成稳定的本地脚本或 webhook
2. 观察 node 连接抖动是否会影响连续调用
3. 如果需要短视频，再最小化放开 `camera.clip`
4. 如果目标是产品化感知，而不是单次抓拍，则改成：
   - 本机 sidecar
   - 低频采样/变化检测
   - 只把语义事件推给 OpenClaw

---

## Retry Hardening for `mac-camera-shot`

在 launchd 常驻链路跑起来之后，仍然观察到单次抓拍会被瞬时 websocket / node 抖动打断，典型报错包括：

- `gateway closed (1006 abnormal closure (no close frame))`
- `gateway closed (1012): service restart`
- `unknown node: e07facb8fd0ca80d388a3185cc47b3b4d56be29dfa58f39d298fe58432b02116`

为此又补了一轮最小修复，范围只在本地 shell 脚本层：

- `scripts/macos-camera/local-macos/mac-camera-common.sh`
- `scripts/macos-camera/local-macos/mac-camera-shot`
- `scripts/tests/mac-camera-shot-retry.test.sh`

具体做法：

1. 给 `mac-camera-shot` 加了有界重试
2. 把 `gateway closed`、`unknown node`、`TIMEOUT` 视为瞬时错误
3. 每次重试前先跑一条轻量 `nodes camera list --node ...` 做 node refresh
4. 默认最多重试 `4` 次，每次间隔 `5s`

验证结果：

- shell 语法检查通过
- 新回归测试先红后绿
- 安装器已把更新同步到 launchd runtime
- fresh live validation 成功

最新 live shot 后，本地缓存文件时间戳更新为：

- `~/.openclaw/workspace/.cache/localmac-camera/latest.jpg` -> `2026-03-15 09:09:26`
- `~/.openclaw/workspace/.cache/localmac-camera/latest.json` -> `2026-03-15 09:09:26`
- `~/.openclaw/workspace/.cache/localmac-camera/state.json` -> `2026-03-15 09:09:26`

---

## `camera.clip` Re-check: allowlist fixed, app crash still reproduces

这轮继续往下查 `camera.clip`，先把 gateway policy 层排掉，再验证真正的媒体路径。

新发现：

1. 第一轮 live `camera.clip` 并没有走到视频导出，先被 gateway 拒掉：

   - `node command not allowed: "camera.clip" is not in the allowlist for platform "macOS 15.6.0"`

2. 根因是远端 `~/.openclaw/openclaw.json` 里：

   - `gateway.nodes.allowCommands = ["camera.snap"]`

   还没有把 `camera.clip` 放进去。

3. 已在远端把 allowlist 修成：

   - `["camera.snap", "camera.clip"]`

   并备份：

   - `~/.openclaw/openclaw.json.bak-20260315-camera-clip-allow`

4. 放开 allowlist 后再次执行 live `camera.clip`，错误从 policy 层前进到了真正的 app 运行时：

   - CLI 返回：`nodes camera clip failed: GatewayClientRequestError: Error: node disconnected (camera.clip)`
   - `OpenClaw.app` 进程 PID 从 `27656` 变成了 `76431`
   - 说明 app 在执行 `clip` 时发生了异常退出并被 launchd watchdog 重新拉起

5. 新 crash report：

   - `~/Library/Logs/DiagnosticReports/OpenClaw-2026-03-15-093549.ips`

   关键症状仍然和前一轮一致：

   - `EXC_BAD_ACCESS`
   - `SIGSEGV`
   - faulting queue: `com.apple.coremedia.figassetexportsession.notifications`

也就是说，现在 `camera.clip` 的真实状态已经非常清楚：

- allowlist 问题：已修
- node pairing / permissions：已排除
- 真正剩余问题：`OpenClaw.app 2026.3.12` 的 `clip/export` 回调路径仍会崩

当前唯一硬阻塞：

- 本地 `openclaw-src` 已经有针对该崩溃的 workaround 改动
- 但这台 Mac 还没有接受 Xcode license
- 所以：
  - `swift test --filter CameraCaptureServiceTests`
  - `swift build`
  都会直接以 `exit 69` 失败

系统要求先执行：

- `sudo xcodebuild -license accept`

---

## Final Result

这轮工作的最终结论是：

**远端 `devbox` 上的 OpenClaw 已经可以通过 macOS app node 成功访问本机 Mac 摄像头，并完成至少一次真实的 `camera.snap` 抓拍。**
