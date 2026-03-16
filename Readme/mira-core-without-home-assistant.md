# 没有 Home Assistant 时的 Mira Core

## 1. 结论先行

没有 `Home Assistant` 时，Mira 仍然应该是一个完整成立的系统。

它只是失去了“家庭执行面”，并没有失去“作为 Mira 存在”的核心。

更准确地说：

- 没有 `Home Assistant`，Mira 仍然是 Mira
- 没有人格、runtime、interaction、memory、extension interface，Mira 就不是 Mira

## 2. 核心定义

没有 Home Assistant 时，Mira Core 可以定义为：

`Persona Engine + Agent Runtime + Interaction Surface + Memory Lifecycle + Extension Contract`

这五层共同构成一个独立成立的 companion-style agent runtime。

## 3. 五个核心层

### 3.1 Persona Engine

职责：

- 定义 Mira 是谁
- 定义 Mira 的说话风格和语气
- 定义主动关怀、沉默和边界策略
- 定义她为什么是“陪伴式 agent”，而不是普通工具型 assistant

典型来源：

- `Mira_v1/openclaw-workspace/SOUL.md`
- `Mira_v1/openclaw-workspace/AGENTS.md`
- `Mira_v1/openclaw-workspace/IDENTITY.md`

### 3.2 Agent Runtime

职责：

- 承载 Mira 的最小 OpenClaw 运行路径
- 装载 workspace
- 注入配置和 prompt
- 完成 session 和 runtime 初始化

这层的要求是：

- 不依赖 Home Assistant
- 不依赖特定硬件
- 只要有 OpenClaw + workspace + config 就能把 Mira 启动起来

### 3.3 Interaction Surface

职责：

- 承接文本对话
- 承接首轮开场
- 承接轻量主动提醒
- 为多模态输入预留上下文插槽
- 为桥接层定义统一交互接口

注意：

- 交互层属于 core
- 具体设备实现不一定属于 core

也就是说，core 应该定义“怎么交互”，但不需要内置所有终端实现。

### 3.4 Memory Lifecycle

职责：

- working memory
- episodic memory
- semantic memory
- routine memory
- sleep
- forgetting
- retrieval / injection

没有这一层，Mira 只能像一次性聊天机器人，看起来像陪伴，但无法形成连续性。

### 3.5 Extension Contract

职责：

- 给可选模块提供标准挂接点
- 约束 plugins / skills / services / hardware 的边界
- 确保 core 不被某个具体生态绑死

没有这一层，core 会被外围集成不断侵蚀。

## 4. 建议目录

如果把“没有 Home Assistant 的 Mira Core”整理成正式目录，我会建议这样组织：

```text
core/
├─ persona/
│  ├─ SOUL.md
│  ├─ AGENTS.md
│  ├─ IDENTITY.md
│  └─ USER_MODEL.example.md
├─ workspace/
│  ├─ MEMORY.md
│  ├─ TOOLS.md
│  ├─ HEARTBEAT.md
│  └─ memory/
├─ runtime/
│  ├─ openclaw-config/
│  ├─ bootstrap/
│  ├─ session/
│  └─ env-templates/
├─ interaction/
│  ├─ text/
│  ├─ multimodal/
│  ├─ bridge-contracts/
│  └─ first-turn/
├─ memory/
│  ├─ schemas/
│  ├─ retrieval/
│  ├─ sleep/
│  ├─ forgetting/
│  └─ examples/
├─ extensions/
│  ├─ plugin-contracts/
│  ├─ skill-contracts/
│  ├─ module-hooks/
│  └─ capability-registry/
└─ examples/
   ├─ minimal-core/
   └─ core-with-memory/
```

## 5. 各目录职责边界

### `core/persona/`

负责：

- Mira 的人格定义
- 开场风格
- 关怀原则
- 沉默和边界策略

不应该负责：

- vendor API
- 设备驱动
- Home Assistant entity / service

### `core/workspace/`

负责：

- Mira 的工作区骨架
- memory 文件位置和组织方式
- workspace 内运行规则

不应该负责：

- 重型第三方服务实现
- 某个模块的完整业务逻辑

### `core/runtime/`

负责：

- 配置模板
- 启动流程
- session lifecycle
- 基础 plugin / skill load 逻辑

不应该负责：

- 家居生态配置
- 某个硬件专属部署流程

### `core/interaction/`

负责：

- turn model
- 文本输入输出
- first-turn 注入机制
- 多模态上下文接口
- bridge contract

不应该负责：

- 具体眼镜 SDK 细节
- Home Assistant routing
- wearable parser 细节

### `core/memory/`

负责：

- memory schema
- retrieval
- injection
- sleep
- forgetting
- runtime memory state

不应该负责：

- 设备原始健康流
- 家庭自动化场景本体
- 模块专属 memory projection

### `core/extensions/`

负责：

- module interface
- plugin contract
- skill contract
- capability registration

不应该负责：

- 某个具体模块的全部实现

## 6. 没有 HA 时，Mira 仍然能做什么

### 6.1 Companion conversation

- 文本交流
- 情绪识别后的克制回应
- 首轮人格开场
- 工作陪伴和轻量支持

### 6.2 Context-aware response

- 结合近期记忆和长期偏好生成连续回应
- 不让每轮对话都像第一次见面

### 6.3 Low-risk proactive behavior

- heartbeat 式轻量关怀
- 低风险提醒
- 信息整理
- 下一步建议

### 6.4 Memory maintenance

- 事件入账
- 睡眠整合
- 遗忘
- 偏好提升

### 6.5 Extension-ready runtime

- 能接 `home-assistant`
- 能接 `rokid`
- 能接 `wearable-mi-band`
- 能接 `printer`
- 能接 `apple`
- 能接 OpenClaw 原生支持的通讯软件 channel

## 7. 为什么 Home Assistant 不该进入 Core

因为 `Home Assistant` 的本质不是 Mira 的身份层，而是她的一个“家庭环境执行层”。

如果把它放进 core，会带来几个问题：

- core 被单一生态绑住
- 最小可运行路径变重
- 后续接别的家庭中枢时边界变乱
- Mira 的产品叙事会被“能调空调”这一类能力偷走重心

更准确的定位应该是：

- Mira Core 决定 Mira 是谁
- Home Assistant 让 Mira 获得家庭环境中的行动能力

## 8. 与模块层的关系

建议的依赖方向是：

```text
Mira Persona
    ↓
Agent Runtime
    ↓
Interaction
    ↓
Memory
    ↓
Extension Interface
    ↓
Optional Modules
    ├─ Home Assistant
    ├─ Rokid
    ├─ Wearable
    ├─ Printer
    ├─ Apple
    └─ Messaging
```

这表示：

- `core` 先闭合
- `modules` 再扩展能力面
- Home Assistant 是重要模块，但不是核心身份来源

## 9. 一句话总结

没有 Home Assistant 时，Mira Core 仍然是一个完整的陪伴式 agent 系统。

它的核心不是家庭控制，而是：

- 人格
- agent runtime
- interaction
- memory
- extension interface

Home Assistant 只是把 Mira 从“会理解和陪伴的 agent”进一步扩展成“能通过家庭环境执行照顾和行动的系统”。
