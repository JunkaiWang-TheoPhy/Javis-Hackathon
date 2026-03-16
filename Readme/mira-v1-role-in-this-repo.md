# Mira_v1 在当前 Repo 中的角色和地位

## 1. 结论先行

`Mira_v1` 在当前 repo 里更像“产品人格层 + 运行时体验层”，而不是底层平台本体。

它的重要性很高，但它不是整个系统的最低层基础设施。

## 2. 为什么这么判断

根目录 [README.md](../README.md) 对仓库结构的描述已经把层级关系说得比较清楚：

- `0313/openclaw-ha-blueprint/` 被描述为主蓝图与生态插件目录
- `Mira_v1/` 被描述为 Mira 的 persona workspace 和 companion-style runtime materials

这意味着：

- 底盘和大规模集成蓝图主要在 `0313/...`
- Mira 作为“这个系统为什么是 Mira，而不是一个普通 OpenClaw demo”的核心材料主要在 `Mira_v1/...`

## 3. `Mira_v1` 主要承载什么

当前 `Mira_v1/` 下主要有三块：

- `openclaw-workspace/`
- `openclaw-config/`
- `lingzhu-bridge/`

### 3.1 `openclaw-workspace/`

这里是 Mira 的人格与工作区骨架，包含：

- `AGENTS.md`
- `SOUL.md`
- `IDENTITY.md`
- `MEMORY.md`
- `TOOLS.md`

它定义的是：

- Mira 是谁
- 她怎么说话
- 她何时主动、何时克制
- 她如何处理记忆和工具

这一层是“人格定义”和“陪伴式行为定义”的核心。

### 3.2 `openclaw-config/`

这里放的是 Mira 运行时相关的配置片段，例如：

- `lingzhu-system-prompt.txt`
- `lingzhu-config-snippet.json5`
- `agent-defaults-snippet.json5`

它承接的是“人格如何进入 runtime”这件事。

### 3.3 `lingzhu-bridge/`

这里更接近桥接和运行时体验实现层。

它说明 `Mira_v1` 不只是文案和人格笔记，也已经把一部分实际行为路径落到了桥接实现中。

## 4. 它不是什么

`Mira_v1` 不是：

- Home Assistant 主蓝图目录
- 大规模生态插件总目录
- 所有硬件桥接的总入口
- 底层 OpenClaw 本体

这些内容更多分布在：

- `0313/openclaw-ha-blueprint/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/`
- `devices/...`

所以不能把 `Mira_v1` 理解成“整个系统的全部”。

## 5. 它为什么仍然非常核心

因为没有 `Mira_v1`，当前仓库仍然可能是一个复杂的 OpenClaw + plugins + hardware 集成项目；
但没有了它，系统就不再天然地是“一个叫 Mira 的陪伴式 agent”。

换句话说：

- `0313/...` 更像底盘、总线和生态蓝图
- `Mira_v1` 更像把底盘真正塑造成 Mira 的那一层

它决定的不是“能不能接设备”，而是：

- 这个系统的气质是什么
- 它的陪伴感从哪里来
- 它为什么不是一个普通的工具型 assistant

## 6. 在发布版中的自然位置

如果整理 `Mira_Released_Version`，`Mira_v1` 里的内容最自然的去向是：

- `core/persona/`
- `core/workspace/`
- `core/runtime/openclaw-config/`
- `core/plugins/` 中与 Mira / Lingzhu 核心桥接直接相关的部分

也就是说，`Mira_v1` 更适合作为发布版 `core` 的主来源之一，而不是简单被视作一个孤立目录。

## 7. 一句话总结

`Mira_v1` 在这个 repo 里的地位是：

- 上层
- 核心
- 面向产品体验
- 决定 Mira 身份

它不是最大的代码目录，也不是最底层的平台目录，但它是“这个系统为什么叫 Mira”的关键来源。
