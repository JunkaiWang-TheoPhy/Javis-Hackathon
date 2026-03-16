# Mira Core、OpenClaw 关系与主动能力边界

## 0. 中英文文件关系

本文件是中文版正式说明文档。对应的英文伴生文件是：

- `mira-core-openclaw-relationship-and-proactive-capabilities.en.md`

两份文件应保持主题一致、结构尽量对应，方便后续：

- 统一管理
- 成对复制到 `Mira_Released_Version`
- 面向中英文读者分别引用

---

## 1. 文档目的

这份文档回答两个在本次对话中反复出现的核心问题：

1. 没有 `Home Assistant` 时，`Mira Core` 和 `OpenClaw` 到底是什么关系
2. `OpenClaw` 架构是否支持 Mira 的核心特色，例如：
   - 主动感知
   - 主动发消息
   - 后台主动控制智能家居
   - 主动发邮件

这份文档特别强调一条边界：

- `架构支持` 不等于 `当前默认策略已经允许自动执行`

---

## 2. 结论先行

### 2.1 关于 `Mira Core` 与 `OpenClaw`

没有 `Home Assistant` 时，`Mira Core` 和 `OpenClaw` 的关系不是二选一，而是：

- `OpenClaw` 是运行时、控制平面、session / skill / channel / cron / plugin 容器
- `Mira Core` 是运行在 `OpenClaw` 之上的人格、记忆、交互与策略层

更准确地说：

- `OpenClaw = runtime / control plane`
- `Mira Core = persona + memory + policy + interaction layer on top of OpenClaw`

### 2.2 关于 Mira 的主动能力

`OpenClaw` 架构是支持 Mira 的主动能力路线的，但要分层理解：

- 主动感知：支持
- 主动发消息：支持
- 后台智能家居控制：支持
- 主动发邮件：支持

但这些“支持”都是架构意义上的支持，不自动等于：

- 当前 workspace 已经完整配置好了
- 当前默认人格策略已经无条件放行

---

## 3. `Mira Core` 与 `OpenClaw` 的基本关系

从现有系统设计讨论看，OpenClaw 更适合被理解为：

- orchestration shell
- session runtime
- skill / plugin host
- channel routing layer
- node / browser / cron / notification control plane

而不是：

- 全屋设备协议总线
- 某个厂商生态的底层设备驱动层

这一点在 [openclaw-jarvis-system-design.md](./openclaw-jarvis-system-design.md) 中已经有很清楚的表述：

- OpenClaw 主要扮演 `orchestration + sessions + skills + channel routing` 的认知外壳
- 它更像 `agent/control plane`
- 而不是各类设备协议栈本身

所以如果不接 `Home Assistant`，Mira 并不会消失。她仍然可以作为一个完整的 companion-style agent 存在，只是暂时没有统一的家庭设备执行面。

---

## 4. 没有 `Home Assistant` 时，系统如何分层

在没有 `Home Assistant` 时，合理的分层应当是：

```text
User / External Input
    ↓
OpenClaw runtime
    ↓
Mira Core
    ├─ persona
    ├─ interaction
    ├─ memory
    ├─ policy
    └─ extension interface
    ↓
Optional action / channel modules
```

换句话说：

- `OpenClaw` 负责让 Mira 运行、接消息、调工具、跑任务
- `Mira Core` 负责让这个 runtime 里的 agent 成为“米拉”
- `Home Assistant` 只是未来让 Mira 能在家庭环境中稳定行动的一个强模块，不是 Mira 身份本体

与这份说明互补的背景文档是：

- `mira-core-without-home-assistant.md`

---

## 5. `OpenClaw` 架构支持哪些 Mira 主动能力

### 5.1 主动感知

支持，但依赖事件源、节点、定时器或 heartbeat，而不是模型凭空“感觉到”。

当前讨论里合理的主动感知路径包括：

- `heartbeat`
- `cron`
- `webhooks`
- `plugins / background services`
- `nodes`
- 外部事件输入，例如 wearable / phone / ambient sidecar

从现有设计稿中可以看到，`OpenClaw` 已被明确放在：

- `sessions`
- `skills`
- `cron`
- `webhooks`
- `channels`
- `proactive conversation`

这一层。

### 5.2 主动发消息

支持，但它应走：

- channel routing
- notification surface
- 或模块化消息适配器

而不是把 Mira 绑定死在某一个通讯软件上。

对发布版更准确的落位是：

- 不把 `openclaw-lark / Feishu` 升格成一级正式模块
- 而是让 Mira 通过 OpenClaw 原生 channel 能力接入所有受支持的通讯软件

在现有系统讨论里，消息出口已经被明确视为：

- OpenClaw channel
- `notify.mobile_app_*`
- Telegram / WhatsApp / Slack / iMessage 等消息面

### 5.3 后台主动控制智能家居

支持，但需要设备执行面。

最稳的执行面通常是：

- `Home Assistant`

如果没有 `HA`，也仍然存在 host-operator path：

- `browser`
- `system.run`
- 本机脚本
- vendor API

但这条路通常更像补充路径，而不是长期最稳的主路径。

### 5.4 主动发邮件

支持，但它本质上属于：

- outbound action
- external communication

所以在当前 Mira workspace 规则下，它不是默认无条件自动放行的动作。

---

## 6. `heartbeat`、`cron`、`event-driven` 三条主动路径

### 6.1 `heartbeat`

`heartbeat` 适合：

- 低频、低风险、上下文相关的主动检查
- 多项轻量检查批量执行
- 不要求精确时间点

当前 Mira workspace 已经明确说明：

- 收到 heartbeat poll 时，不要机械地只回复 `HEARTBEAT_OK`
- 可以利用 heartbeat 做邮箱、日历、提醒、记忆维护等低风险主动工作

但当前 devbox 上的 [HEARTBEAT.md](../OpenClaw/devbox/.openclaw/workspace/HEARTBEAT.md) 仍然是空白占位状态，说明：

- heartbeat 机制存在
- 但还没有被完整配置成生产态主动检查清单

### 6.2 `cron`

`cron` 适合：

- 精确时间任务
- 独立于主会话历史的后台任务
- 直接把输出投递到 channel
- 一次性提醒或固定时点提醒

当前 Mira workspace 已经明确区分：

- `heartbeat` 用于轻量、可批处理、时间可漂移的主动工作
- `cron` 用于精确调度和独立输出

但当前 devbox 上的 [jobs.json](../OpenClaw/devbox/.openclaw/cron/jobs.json) 仍然为空，说明：

- cron 能力面是成立的
- 当前运行环境里还没有正式登记的常驻任务

### 6.3 `event-driven`

`event-driven` 路径是 Mira 真正变成 ambient companion system 的关键。

事件源可以来自：

- Apple Watch / iPhone
- Android / Mi Band
- Home Assistant presence / state change
- 本地电脑或摄像头 sidecar
- 记忆系统内部状态变化

合理的事件链应当是：

```text
sensor / device event
  -> context / policy evaluation
  -> Mira decision
  -> notification or action
```

这也是当前 Jarvis system 设计稿里最核心的一条路线。

---

## 7. “支持自动外发”与“当前默认策略放行”不是一回事

这是本次对话里最需要说清的一点。

从技术能力层面：

- Mira / OpenClaw 可以主动发消息
- Mira / OpenClaw 可以主动发邮件
- Mira / OpenClaw 可以主动触发外部动作

但从当前 workspace 策略层面：

- 这些动作默认并不是“无限制自动放行”

原因很简单：[AGENTS.md](../Mira_v1/openclaw-workspace/AGENTS.md) 已经明确规定：

- `Sending emails, tweets, public posts`
- `Anything that leaves the machine`

默认都属于：

- `Ask first`

所以必须区分两件事：

### 7.1 能力层

指架构是否有能力做到这件事。

在这个层面，答案是：

- 能做到

### 7.2 行为策略层

指在当前人格规则和运行规则下，是否默认允许 Mira 自动做这件事。

在这个层面，当前默认答案是：

- 不默认放行

这就是为什么“要真正上线自动外发，必须加一层 `outbound policy`”。

---

## 8. 为什么需要 `outbound policy`

如果没有 `outbound policy`，系统就只剩两种极端：

1. 全都不能自动发
2. 全都默认能自动发

这两种都不适合 Mira。

Mira 的正确状态应该是：

- 低风险外发可自动
- 中风险外发要确认
- 高风险外发必须受更严格规则约束

典型例子：

- 给用户本人发低风险提醒：可自动
- 给新的收件人首次发邮件：应确认
- 给 caregiver 发健康异常消息：应确认或只在高风险阈值下自动
- 夜间非紧急主动消息：应静默

所以 `outbound policy` 的职责不是“阻止主动性”，而是：

- 把主动性变成有纪律的主动性

---

## 9. 后台智能家居控制：架构上已经有真实例子

这不是纯理论。

当前 HA 控制插件已经体现出：

- 高心率事件触发通知
- 到家且心率高时自动降温
- 机械开关联动

在 [openclaw-plugin-ha-control](../OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/src/index.ts) 中可以看到：

- `notify(...)` 负责调用已配置的通知 service
- `home_handle_hr_event` 工具明确写着会触发高心率策略与 cooling / notification actions
- 到家时如果检测到 recent high HR，会发出 `Arrival cooling` 通知并执行降温响应

所以对于“后台主动控制智能家居”这个问题，准确回答是：

- `OpenClaw + Mira + HA plugin` 这条链已经证明这类主动行为在架构上成立

---

## 10. 主动发邮件应该怎样理解

主动发邮件属于 Mira 的能力面，但不应该被视为“默认无条件外发”的基础行为。

更合理的设计方式是：

- 邮件属于单独模块或 adapter
- Mira 只产生 typed intent
- policy 决定是否允许直接发送

所以推荐拆分为：

- `draft_email`
- `send_approved_email`
- `summarize_inbox`
- `send_user_checkin_email`

而不是让人格层直接“自由发邮件”。

这也符合 Mira 依托 OpenClaw 的本质：

- `OpenClaw` 负责 runtime / channels / tools / scheduling
- `Mira` 负责判断是否该发、何时该发、发给谁、语气如何

---

## 11. 当前状态：架构已成立，但配置仍偏骨架

截至当前仓库状态，更准确的现实判断是：

### 已成立的部分

- OpenClaw 作为 runtime / control plane 的定位
- Mira 作为 persona + memory + policy layer 的定位
- 主动感知的三条路径：heartbeat / cron / event-driven
- HA 路径上的后台通知与自动控制示例
- 记忆 sleep / forgetting 机制

### 仍偏骨架或待配置的部分

- heartbeat 清单仍为空
- cron jobs 仍为空
- 通用 outbound policy 尚未正式写成单独配置
- 邮件模块尚未被独立整理为 release-facing module

所以当前不是“做不到”，而是：

- 框架已经成立
- 但若要作为正式发布能力，需要继续把策略层和配置层补齐

---

## 12. 推荐的最终表述

如果要把这个判断压缩成一句对外或对内都准确的话，我建议写成：

> `OpenClaw` is the runtime and control plane that hosts Mira.  
> `Mira Core` is the persona, memory, interaction, and policy layer running on top of it.  
> The architecture supports proactive sensing, proactive messaging, and proactive action, but these capabilities must be governed by explicit outbound and risk policies rather than being treated as unlimited default behavior.

中文可以写成：

> `OpenClaw` 是承载 Mira 的运行时与控制平面，`Mira Core` 是运行在其上的人格、记忆、交互与策略层。  
> 这套架构支持 Mira 的主动感知、主动发消息与主动行动，但这些能力必须受到明确的外发策略与风险策略约束，而不是默认无限放开。

---

## 13. 最终结论

这份文档的核心结论是：

- 没有 `Home Assistant` 时，Mira 仍然可以完整成立
- `OpenClaw` 是平台，`Mira Core` 是其上的 Mira 化上层系统
- `OpenClaw` 架构支持 Mira 的主动感知、主动消息和主动行动
- 但“支持”是能力层结论，不是默认策略放行结论
- 若要正式上线自动外发或后台主动行动，必须补齐：
  - `outbound policy`
  - `risk policy`
  - heartbeat / cron / event-driven 的正式配置

所以最准确的判断不是：

- “Mira 现在已经默认可以无限主动”

而是：

- “Mira 所依托的 OpenClaw 架构已经足以支撑主动系统，但她的主动性必须被正式策略化、模块化和可审计化。”
