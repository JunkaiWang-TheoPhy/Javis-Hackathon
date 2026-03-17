# Mira OpenClaw 渠道无关通讯层集成规范

## 0. 中英文文件关系

本文件是中文版正式说明文档。对应的英文伴生文件是：

- `mira-openclaw-channel-integration-spec.en.md`

两份文件应保持主题一致、结构尽量对应，方便后续：

- 统一管理
- 成对复制到 `Mira_Released_Version`
- 面向中英文读者分别引用

---

## 1. 文档定位

这份文档定义 Mira 在发布版中的通讯层设计原则：

- 不把 `Lark / Feishu` 作为一级正式模块
- 不把 Mira 绑定到任何单一通讯软件
- 通过 `OpenClaw` 原生 channel 能力接入所有受支持的通讯软件
- 用统一的 `channel contract`、`outbound policy` 和 `notification-router` 来承载主动消息能力

这份文档与以下文档互补：

- `messaging-lark-module-positioning.md`
- `mira-core-openclaw-relationship-and-proactive-capabilities.md`
- `docs/policies/outbound-policy.md`

---

## 2. 结论先行

Mira 的通讯层应当是：

- `OpenClaw-native`
- `channel-agnostic`
- `policy-driven`

更准确地说：

- `Mira` 负责决定是否该发、发什么、为什么发
- `OpenClaw` 负责 channel routing、session binding 和 adapter execution
- `notification-router` 负责把消息意图变成可执行的 channel dispatch
- `outbound policy` 负责决定哪些外发行为允许、哪些需要确认、哪些必须阻止

因此推荐关系不是：

```text
Mira -> Feishu / Lark
```

而是：

```text
Mira Core
  -> outbound intent
  -> notification-router
  -> OpenClaw channel / adapter
  -> supported communication software
```

---

## 3. 设计目标

这层设计需要同时满足五个目标：

1. Mira 不被任何单一通讯软件绑死。
2. Mira 可以通过统一接口接入所有 OpenClaw 已支持或未来支持的 channel。
3. Mira 的主动外发能力必须受策略约束，而不是默认无限放开。
4. 消息层与 `Home Assistant`、`wearable`、`memory`、`Rokid` 等模块清晰解耦。
5. 发布版目录应便于独立开源、迁移和社区扩展。

---

## 4. 系统关系

### 3.1 Mira 与 OpenClaw 的关系

在通讯层里，二者职责应保持明确：

- `Mira Core`
  - persona
  - memory
  - interaction policy
  - outbound decision
- `OpenClaw`
  - runtime
  - sessions
  - skills
  - channels
  - cron
  - webhooks
  - plugin host

因此：

- Mira 不是某个消息软件的 bot
- Mira 是运行在 OpenClaw 上的 companion-style agent
- 通讯软件只是 OpenClaw 可以承接的 channel surface

### 3.2 渠道无关的消息路径

推荐路径：

```text
trigger
  -> Mira decision
  -> outbound intent
  -> outbound policy evaluation
  -> notification-router
  -> OpenClaw channel
  -> concrete communication app
```

其中 `trigger` 可以来自：

- heartbeat
- cron
- event-driven signals

---

## 5. 发布版目录建议

在 `Mira_Released_Version` 中，推荐的通讯层目录不是 `modules/messaging-lark/`，而是：

```text
channels/
├─ README.md
├─ contracts/
│  ├─ message-channel-contract.md
│  ├─ outbound-intent.schema.json
│  └─ inbound-event.schema.json
├─ policies/
│  └─ outbound-policy.md
├─ examples/
│  ├─ telegram.md
│  ├─ slack.md
│  ├─ discord.md
│  ├─ imessage.md
│  └─ email.md
└─ adapters/
   └─ README.md

services/
└─ notification-router/
   ├─ README.md
   ├─ config/
   │  └─ outbound-policy.yaml
   ├─ src/
   │  ├─ evaluateOutboundPolicy.ts
   │  ├─ dispatchMessageIntent.ts
   │  ├─ resolveChannel.ts
   │  └─ auditLog.ts
   └─ tests/
```

重点是：

- `channels/` 负责 channel contract 和接入说明
- `services/notification-router/` 负责机器执行
- 不把某一个具体消息软件提升为一级官方模块

---

## 6. 当前仓库落位建议

在当前仓库里，已经有一个较清晰的过渡落位：

```text
Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md
OpenClaw/devbox/project/openclaw-ha-blueprint-memory/services/rokid-bridge-gateway/config/outbound-policy.yaml
docs/policies/outbound-policy.md
Readme/mira-openclaw-channel-integration-spec.md
```

这意味着：

- `OUTBOUND_POLICY.md`：给 Mira 读
- `outbound-policy.yaml`：给程序读
- `docs/policies/outbound-policy.md`：给维护者读
- 本文：给架构设计和发布整理读

当 `notification-router` 正式独立后，程序侧配置应迁移到：

- `services/notification-router/config/outbound-policy.yaml`

---

## 7. Channel Contract

### 6.1 设计原则

Mira 不应直接面向：

- Telegram API
- Slack API
- Discord API
- Feishu API
- email provider API

Mira 只应面向统一的消息意图层。

因此 channel contract 要解决的是：

- Mira 如何表达“我要发一条什么消息”
- runtime 如何判断“这条消息能不能发”
- router 如何决定“该往哪个 channel 发”

### 6.2 Outbound Intent

推荐的核心类型如下：

```ts
type OutboundMessageIntent = {
  intent_id: string;
  created_at: string;
  source: "heartbeat" | "cron" | "event" | "manual";
  message_kind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
  recipient_scope: "self" | "known_contact" | "caregiver" | "group" | "public";
  risk_tier: "low" | "medium" | "high";
  privacy_level: "private" | "sensitive";
  subject?: string;
  content: string;
  preferred_channels?: string[];
  fallback_channels?: string[];
  requires_ack?: boolean;
  respect_quiet_hours?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
};
```

语义解释：

- `message_kind`
  - 这条消息从产品语义上是什么
- `recipient_scope`
  - 这条消息发给谁
- `risk_tier`
  - 这条消息的动作危险度
- `preferred_channels`
  - 如果允许发，优先走哪些 channel
- `tags`
  - 给 policy 和 audit 用的内容标签

### 6.3 Inbound Event

如果后续要支持从通讯软件回流消息或确认动作，推荐配套事件结构：

```ts
type InboundMessageEvent = {
  event_id: string;
  received_at: string;
  channel: string;
  sender_scope: "self" | "known_contact" | "caregiver" | "group_member" | "unknown";
  conversation_id?: string;
  message_text?: string;
  attachments?: Array<Record<string, unknown>>;
  reply_to_intent_id?: string;
  metadata?: Record<string, unknown>;
};
```

### 6.4 Delivery Result

router 和 channel adapter 应统一返回：

```ts
type ChannelDeliveryResult = {
  ok: boolean;
  channel: string;
  delivery_status: "sent" | "queued" | "blocked" | "skipped" | "failed";
  reason?: string;
  external_message_id?: string;
};
```

---

## 8. Outbound Policy 如何进入这条链路

### 8.1 原则

`AGENTS.md` 只定义 Mira 的默认克制原则：

- 任何离开机器的动作默认 ask first

要让 Mira 真正自动外发，必须引入单独的 `outbound policy`。

### 8.2 三层落位

当前已采用三层结构：

1. `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`
   - 模型可理解边界
2. `services/.../config/outbound-policy.yaml`
   - 机器强制执行规则
3. `docs/policies/outbound-policy.md`
   - 设计说明

### 8.3 Core Contrast Rules

当前最关键的四条对照规则应保持稳定：

- `user_self_reminder = allow`
- `user_self_checkin = allow`
- `caregiver_escalation = ask`
- `new_recipient_requires_confirmation = ask`

这四条规则应与以下三层文件保持完全一致：

- `Mira_v1/openclaw-workspace/OUTBOUND_POLICY.md`
- `services/.../config/outbound-policy.yaml`
- `docs/policies/outbound-policy.md`

这四条规则体现的核心原则是：

- Mira 可以对用户本人做低风险主动触达
- 但不默认替用户向第三方自动说话

### 8.4 与 channel contract 的关系

`outbound policy` 不直接关心某个 vendor API 细节。  
它只关心：

- `message_kind`
- `recipient_scope`
- `risk_tier`
- `channel class`
- `content tags`

这保证同一套规则可以复用到：

- email
- Telegram
- Slack
- Discord
- iMessage
- 任何 OpenClaw 未来支持的 channel

---

## 9. 三条主动触发路径

### 8.1 `heartbeat`

适合：

- 低频、低风险、上下文相关的主动检查
- 轻量 reminder
- calm check-in
- summary 生成

典型输出：

- `user_self_checkin`
- `user_self_summary`
- `user_self_reminder`

推荐规则：

- 默认只给用户本人
- 默认走私有 channel
- 默认尊重 quiet hours

### 8.2 `cron`

适合：

- 精确时间提醒
- 固定时间摘要
- 周期性状态报告
- 与主会话隔离的后台任务

典型输出：

- 定时日程提醒
- 每日晚间 summary
- 站立提醒

推荐规则：

- cron 直接生成 outbound intent
- 不直接越过 outbound policy

### 8.3 `event-driven`

适合：

- 高心率
- 到家/离家
- 传感器变化
- Home Assistant 状态变化
- memory system 内部状态变化

典型输出：

- `alert`
- `escalation`
- `summary`
- 背景动作后的用户通知

推荐规则：

- event-driven 先经过 policy engine / confirmation policy
- 若产生外发，再进入 outbound policy
- 若产生动作执行，再与 action/router 协同

---

## 10. `notification-router` 的职责边界

### 9.1 它应该做什么

`notification-router` 应当负责：

- 接收 `OutboundMessageIntent`
- 读取并执行 `outbound-policy.yaml`
- 判定 `allow / ask / block`
- 选择 `preferred channel` 与 `fallback channel`
- 调用具体 OpenClaw channel / adapter
- 记录 audit log
- 返回统一 delivery result

### 9.2 它不应该做什么

`notification-router` 不应该负责：

- 定义 Mira 的人格
- 决定用户此刻情绪需要什么
- 维护长期记忆
- 读取设备真值状态
- 代替 Home Assistant 或其它 action plane
- 重新推理一遍是否该发消息

换句话说：

- Mira 决定是否值得发
- policy 决定能不能发
- router 决定怎么发

### 9.3 与其它层的边界

和 `Mira Core` 的关系：

- `Mira Core` 产出 outbound intent
- `notification-router` 不修改 Mira 的人格语气目标，只做策略和投递层处理

和 `Home Assistant` 的关系：

- `Home Assistant` 不承担通用消息路由
- 它只承担设备权威层和动作执行面

和 `memory` 的关系：

- `notification-router` 可以写 audit event
- 但不拥有长期记忆语义层

---

## 11. 示例流程

### 10.1 Heartbeat 自发提醒

```text
heartbeat
  -> Mira notices calendar event <2h
  -> build outbound intent(kind=reminder, recipient_scope=self)
  -> outbound policy = allow
  -> notification-router
  -> OpenClaw direct-message channel
  -> user
```

### 10.2 高心率后用户提醒

```text
wearable event
  -> policy engine
  -> Mira decides a private alert is needed
  -> build outbound intent(kind=alert, recipient_scope=self, risk=medium)
  -> outbound policy = allow on private channels
  -> notification-router
  -> mobile_notify / DM
  -> user
```

### 10.3 caregiver 升级

```text
event
  -> Mira decides escalation may be needed
  -> build outbound intent(kind=escalation, recipient_scope=caregiver)
  -> outbound policy = ask
  -> confirmation flow
  -> if confirmed, notification-router dispatches
```

### 10.4 新收件人邮件

```text
manual or proactive decision
  -> build outbound intent(channel=email, recipient_scope=known_contact)
  -> policy sees first_contact = true
  -> action = ask
  -> no automatic send
```

---

## 12. 当前仓库的现实状态

截至当前仓库状态：

- `openclaw-lark` 只应被视为已有 runtime adapter，不应进入发布版一级模块
- 三层 `outbound policy` 文件已经落位
- `notification-router` 还没有独立成正式服务
- 因此当前完成的是：
  - 设计边界
  - policy 落位
  - channel-agnostic 叙事收束
- 尚未完成的是：
  - 一个真正消费 `outbound-policy.yaml` 的 router service
  - OpenClaw channel adapter 的统一调用层

---

## 13. 非目标

这份规范不打算做以下事情：

- 不为每个消息软件单独写产品 spec
- 不定义各家 vendor API 的调用细节
- 不把 email、Slack、Telegram 直接塞进 Mira Core
- 不把 `notification-router` 扩展成设备控制中心

---

## 14. 下一步建议

建议按这个顺序往下做：

1. 正式创建 `notification-router` 服务骨架
2. 把当前 `outbound-policy.yaml` 接进真实 `allow / ask / block` 判定
3. 定义 `OutboundMessageIntent` 和 `ChannelDeliveryResult` 的实际 TS 类型
4. 先接一条最小 channel 路径
   - 例如 `email` 或 `OpenClaw private DM`
5. 再接入 `heartbeat / cron / event-driven` 三种来源

---

## 15. 一句话总结

Mira 的通讯层不应该是某个消息软件模块，而应该是：

- Mira 产出消息意图
- OpenClaw 承接 channel
- outbound policy 约束自动外发
- notification-router 负责统一路由和投递

这才是适合 `Mira_Released_Version` 的渠道无关通讯架构。
