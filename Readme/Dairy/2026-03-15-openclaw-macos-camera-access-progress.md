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

## Final Result

这轮工作的最终结论是：

**远端 `devbox` 上的 OpenClaw 已经可以通过 macOS app node 成功访问本机 Mac 摄像头，并完成至少一次真实的 `camera.snap` 抓拍。**
