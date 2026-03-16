# `messaging-lark` 是否保留为正式模块

## 0. 中英文文件关系

本文件是中文版正式说明文档。对应的英文伴生文件是：

- `messaging-lark-module-positioning.en.md`

两份文件应保持主题一致、结构尽量对应，方便后续：

- 统一管理
- 成对复制到 `Mira_Released_Version`
- 面向中英文读者分别引用

---

## 1. 文档目的

这份文档记录一个已经明确收敛的发布版判断：

- `Mira_Released_Version` 是否保留 `openclaw-lark / Feishu` 为一级正式模块
- 如果不保留，发布版应采用什么替代设计
- 当前工作区里的 Lark / Feishu 实现应如何定位

---

## 2. 最终发布结论

当前的正式结论是：

- `Mira_Released_Version` 不保留 `Lark / Feishu` 为一级正式模块
- 发布版不设置 `modules/messaging-lark/`
- Mira 的通讯接入应改成 `OpenClaw-native`、`channel-agnostic` 的设计
- 也就是说，Mira 通过 OpenClaw 原生 channel 能力接入所有受支持的通讯软件

更准确地说：

- `Mira` 不应绑定某一个通讯产品
- `OpenClaw` 才是 channel routing 和消息出口承载层
- 通讯软件只是 OpenClaw 的 channel / adapter surface

---

## 3. 为什么不保留为一级正式模块

### 3.1 Mira 本质上依托于 OpenClaw

Mira 的核心身份并不是某个 IM 机器人，而是：

- persona
- memory
- policy
- interaction behavior

这些能力都运行在 `OpenClaw` 之上。

因此更合理的关系是：

- `OpenClaw = runtime + sessions + skills + channel routing`
- `Mira = 运行在 OpenClaw 上的 companion-style agent layer`

如果把 `Lark / Feishu` 升格成发布版一级模块，很容易把 Mira 错误地讲成：

- 一个 Feishu bot
- 一个特定企业协作软件上的代理

这会偏离 Mira 的真实架构定位。

### 3.2 发布版需要渠道无关

如果目标是后续单独拆仓并面向开源社区发布，消息通道层更适合写成：

- 渠道无关
- 可替换
- 可扩展

而不是：

- 默认绑定某一个区域性协作产品

从发布版视角看，以下通讯软件都应在同一抽象层上：

- Telegram
- WhatsApp
- Slack
- Discord
- iMessage
- email
- 以及任何 OpenClaw 后续支持的其它消息面

### 3.3 这样更符合模块边界

如果保留 `messaging-lark` 为一级正式模块，会让模块体系出现一个不够稳定的偏差：

- `home-assistant` 是环境执行模块
- `rokid` 是设备/交互模块
- `wearable-*` 是感知事件模块
- `printer` 是执行模块
- `messaging-lark` 则会变成单一厂商通讯产品模块

这会让“模块划分按能力边界”退化成“模块划分按当前已有插件名”。

发布版更合理的边界是：

- `core/` 保留 Mira 本体
- `modules/` 保留能力模块
- `channels/` 或 `OpenClaw native channels` 负责通讯软件接入

---

## 4. 替代设计：通过 OpenClaw 原生能力接入通讯软件

推荐结构不是：

```text
Mira -> messaging-lark -> user
```

而是：

```text
User
  ↓
Supported communication app
  ↓
OpenClaw channel / adapter
  ↓
Mira Core
  ↓
Optional modules and actions
```

这意味着：

- Mira 不直接依赖 Feishu
- Mira 也不直接依赖 Telegram / Slack / Discord
- Mira 依赖的是 OpenClaw 的 channel surface
- 具体通讯软件由 OpenClaw 的 channel / plugin / adapter 接入

在这个模型里，Mira 负责：

- 生成消息意图
- 判断是否应该主动发送
- 决定提醒、摘要、确认、升级等消息类型

OpenClaw 负责：

- channel routing
- session binding
- adapter execution
- cron / heartbeat / event 驱动下的消息投递

---

## 5. 当前 Lark / Feishu 实现应该如何处理

当前工作区里已经存在一个明确的 Lark / Feishu 通道实现：

- `OpenClaw/devbox/.openclaw/extensions/openclaw-lark/`

它仍然有价值，但价值应重新定义为：

- 当前运行环境里的一个已存在 channel adapter
- 一个可以参考的实现样本
- 一个历史上真实使用过的通讯接入路径

它不应在发布版里被定义为：

- Mira 的正式一级模块
- Mira 的默认消息出口
- Mira 的核心扩展面

更准确的定位是：

- `runtime adapter`
- `reference integration`
- `example channel implementation`

---

## 6. 发布版中的推荐落位

如果后续在 `Mira_Released_Version` 里整理通讯相关内容，更推荐的结构是：

```text
channels/
├─ README.md
├─ contracts/
│  └─ message-channel-contract.md
├─ policies/
│  └─ outbound-policy.md
└─ examples/
   ├─ telegram.md
   ├─ slack.md
   ├─ discord.md
   ├─ imessage.md
   └─ email.md
```

这里的重点是：

- 发布版说明“如何接任何支持的通讯软件”
- 而不是把某个单一通讯软件写成一级官方模块

如果需要保留 Lark / Feishu，也更适合放在：

- `channels/examples/`
- `archive/`
- `docs/integrations/`

而不是：

- `modules/messaging-lark/`

---

## 7. 这对 Mira 的含义

这项调整的本质不是“删掉一段代码”，而是把系统叙事校正为：

- Mira 不是 Feishu assistant
- Mira 不是某个消息软件上的 bot
- Mira 是一个依托 OpenClaw 的 companion-style agent
- 通讯软件只是她可以借助的入口和出口

这会让发布版更符合此前已经明确的总原则：

- Mira 依托 OpenClaw
- Mira 不被单一生态绑死
- Mira 的主动性应通过统一 channel contract 和 outbound policy 管理

---

## 8. 一句话总结

最终推荐不是把 `openclaw-lark / Feishu` 升格成正式发布模块，而是：

- 在 `Mira_Released_Version` 中不保留 `messaging-lark` 为一级模块
- 保留“通过 OpenClaw 原生能力接入所有受支持通讯软件”的渠道无关设计
