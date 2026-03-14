# OpenClaw × Home Assistant × Rokid runnable blueprint

这个仓库现在同时覆盖两条可运行蓝图：

- `wearable -> OpenClaw ha-control plugin -> Home Assistant`
- `Rokid observation -> bridge gateway -> OpenClaw-aligned policy surface -> Home Assistant`

第一条链路保留了原有的高心率提醒、到家降温、机械开关联动。  
第二条链路新增了 Rokid 视觉观察支持，用于把“看见某个设备 -> 解释状态 -> 请求确认 -> 联动 Home Assistant”跑通。

## 架构摘要

这次合并保持了原蓝图的骨架不变：

- `homeassistant-config/` 仍然是设备执行面
- `openclaw-config/` 仍然是 OpenClaw 配置面
- `plugins/openclaw-plugin-ha-control/` 仍然负责现有 HA 控制逻辑
- 新增 `packages/contracts/`、`services/rokid-bridge-gateway/`、`apps/rokid-companion/`、`plugins/openclaw-plugin-rokid-bridge/`

### 总体架构图

```text
wearable webhook
  -> openclaw-plugin-ha-control
  -> Home Assistant

Rokid Glasses
  -> rokid-companion
  -> VisualObservationEvent
  -> rokid-bridge-gateway
  -> OpenClaw-aligned Rokid policy/plugin surface
  -> ActionEnvelope
  -> Home Assistant
```

### Rokid 路径职责边界

```text
Rokid Glasses        : 看与选择
rokid-companion      : 本地采集 / observation 编码
rokid-bridge-gateway : ingress / confirm / 幂等 / demo policy
OpenClaw plugin      : typed tools / HA dispatch surface / future agent hook
Home Assistant       : scene / switch / fan / climate 等真实动作
```

## 目录结构

```text
openclaw-ha-blueprint/
├─ README.md
├─ docker-compose.yml
├─ package.json
├─ tsconfig.json
├─ packages/
│  └─ contracts/
├─ services/
│  └─ rokid-bridge-gateway/
├─ apps/
│  └─ rokid-companion/
├─ plugins/
│  ├─ openclaw-plugin-ha-control/
│  └─ openclaw-plugin-rokid-bridge/
├─ homeassistant-config/
├─ openclaw-config/
└─ scripts/
```

### 关键模块

- `packages/contracts/`
  - 共享 `VisualObservationEvent` 与 `ActionEnvelope` schema
- `services/rokid-bridge-gateway/`
  - 提供 `POST /v1/observe`
  - 提供 `POST /v1/confirm`
  - 提供 `GET /v1/health`
  - 维护最小会话态和确认幂等
- `plugins/openclaw-plugin-rokid-bridge/`
  - 提供 `rokid_ingest_observation`
  - 提供 `rokid_dispatch_ha`
  - 提供 `rokid_bridge_status`
- `apps/rokid-companion/`
  - 提供 Rokid companion 边界骨架与 coffee demo client

## 当前版本的能力边界

### 已支持

- 原有 wearable 和 Home Assistant 流程
- Rokid 咖啡机场景的 observation -> explanation -> confirm -> HA action 最小闭环
- TypeScript contracts
- 测试覆盖 contract、plugin helper、bridge routes
- 本地脚本模拟 Rokid observation，无需真实 Rokid 硬件即可演示

### 当前刻意不做

- 连续第一视角视频流
- 真实 Rokid SDK 深度接入
- 长期记忆系统
- 完整 OpenClaw agent run API 集成

### 关于 OpenClaw 推理层

这版 Rokid 路径是“OpenClaw 对齐”的最小实现：

- repo 中已经提供 Rokid plugin 和 skill，作为 OpenClaw 内部工具面
- bridge service 当前默认使用一套确定性的咖啡机策略来生成 `ActionEnvelope`
- 后续如果你要接上真实 OpenClaw agent run，只需要替换 `services/rokid-bridge-gateway/src/orchestration/openclawClient.ts`

也就是说，这个蓝图的第一版优先保证：

`schema 稳定 + bridge 清晰 + HA 可执行 + demo 可跑`

而不是先绑定某个未稳定的运行时接口。

## 运行前必须修改的配置

### Home Assistant / OpenClaw

在 `openclaw-config/openclaw.json` 里至少替换：

- `REPLACE_ME_HA_LONG_LIVED_TOKEN`
- `switch.third_reality_wall_switch`
- `switch.switchbot_bot`
- 可选地把 `scene.demo_cooling_after_workout` 改成真实 `scene.*`
- 可选地加上真实 `fanEntityId` / `climateEntityId`

### Rokid bridge

在 `docker-compose.yml` 里至少替换：

- `rokid-bridge-gateway.environment.HA_TOKEN`
- 可选地把 `ROKID_COFFEE_SCENE_ENTITY_ID` 改成真实 `scene.*` 或者在后续实现里改成 `button.*`

### 时区

当前默认时区已经调整为 `Asia/Shanghai`。

## Bring-up

### 1. 启动服务

```bash
docker compose up -d
```

这会启动：

- `homeassistant`
- `ollama`
- `rokid-bridge-gateway`
- `openclaw-gateway`
- `openclaw-cli`

### 2. 在 Home Assistant 里创建 long-lived token

- 打开 `http://127.0.0.1:8123`
- 在 profile 中生成 token
- 写入：
  - `openclaw-config/openclaw.json`
  - `docker-compose.yml` 中 `rokid-bridge-gateway.environment.HA_TOKEN`

### 3. 安装 OpenClaw plugins

```bash
./scripts/bootstrap-openclaw-plugin.sh
```

这会安装：

- `openclaw-plugin-ha-control`
- `openclaw-plugin-rokid-bridge`

然后重启 `openclaw-gateway`。

### 4. 拉取 Ollama 模型

```bash
docker compose exec ollama ollama pull glm-4.7-flash
```

### 5. 打开 OpenClaw UI

OpenClaw gateway 监听在 `18789`：

```bash
docker compose exec openclaw-cli openclaw dashboard --no-open
```

## Demo 1：wearable -> HA

```bash
HA_TOKEN=YOUR_TOKEN ./scripts/demo-sequence.sh
```

这条路径会执行：

```text
high heart-rate webhook
  -> plugin memory update
  -> Home Assistant mirror state
  -> presence changes to home
  -> cooling response
```

## Demo 2：Rokid coffee machine -> HA

确保 `rokid-bridge-gateway` 已启动并且 `HA_TOKEN` 正确后运行：

```bash
./scripts/demo-rokid-coffee-sequence.sh
```

这条脚本会：

1. 把 `scripts/rokid-observation.sample.json` 包装成 `POST /v1/observe`
2. 打印解释性 `ActionEnvelope`
3. 发送确认 `POST /v1/confirm`
4. 打印 side-effect `ActionEnvelope`

### Rokid coffee 流程序列图

```text
capture
  -> observation
  -> explanation panel
  -> confirm
  -> HA service
  -> HUD success
```

### 当前 demo 的默认动作

默认会尝试执行：

```text
scene.turn_on -> scene.morning_coffee
```

你可以通过 `docker-compose.yml` 中的：

```text
ROKID_COFFEE_SCENE_ENTITY_ID
```

替换成真实 scene，或者后续改成 `button.press` / `script.turn_on`。

## 本地测试

第一次在宿主机运行测试前：

```bash
npm install
```

然后执行：

```bash
npm test
```

当前覆盖：

- contract schema tests
- Rokid plugin helper tests
- Rokid bridge route tests

## 重要文件

- `packages/contracts/src/visual-observation.ts`
- `packages/contracts/src/action-envelope.ts`
- `plugins/openclaw-plugin-rokid-bridge/src/index.ts`
- `services/rokid-bridge-gateway/src/server.ts`
- `services/rokid-bridge-gateway/src/orchestration/openclawClient.ts`
- `scripts/demo-rokid-coffee-sequence.sh`

## 后续升级路线

如果你要把 Rokid 路径升级为真实 OpenClaw agent 驱动：

1. 保持 `VisualObservationEvent / ActionEnvelope` 不变
2. 替换 `services/rokid-bridge-gateway/src/orchestration/openclawClient.ts`
3. 让 bridge 调用真实 OpenClaw agent run
4. 保持 Home Assistant 执行面不变

这个仓库现在的目标不是把所有部分一次做满，而是先把：

`contract -> bridge -> explanation -> confirm -> HA action`

这条最小闭环稳定下来。
