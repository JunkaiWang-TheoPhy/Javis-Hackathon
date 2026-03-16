# Home Assistant 模块的两种对外定位

## 1. 文档目的

这份文档整理本次对话里关于 `Home Assistant` 模块对外叙事的两种定位差异：

- `HA-first 家庭控制中心`
- `多生态家庭设备统一路由中心`

这不是简单的文案差别，而是系统中心不同。

## 2. 方案一：HA-first 家庭控制中心

这条路线的含义是：

- `Home Assistant` 是默认中枢
- Mira 主要通过 HA 来控制家庭
- 其它生态更多像 HA 的补充接入面

### 架构中心

- `HA entity`
- `HA service`
- `HA scene`

### 对外叙事

Mira 是一个建立在 Home Assistant 之上的智能控制与编排层。

### 优点

- 最容易落地
- 最接近当前已经成熟可跑的路径
- demo 表达直接
- 用户理解成本低

### 缺点

- Mira 容易被理解成“HA 上的 agent”
- 架构天然偏向单一中枢
- 以后支持更多家庭后端时边界更难保持干净

## 3. 方案二：多生态家庭设备统一路由中心

这条路线的含义是：

- Mira 面向的是家庭意图和设备能力
- `Home Assistant` 是一个重要 backend，但不是理论上的唯一中心
- 动作可以路由到 HA，也可以路由到 direct adapter、本地 bridge 或其它生态后端

### 架构中心

- `device`
- `capability`
- `intent`
- `route`

### 对外叙事

Mira 是家庭设备能力的统一编排层，而 `Home Assistant` 是当前最成熟、最强的执行后端之一。

### 优点

- 更适合长期扩展
- 更符合平台化叙事
- 不会把 Mira 的身份绑定到单一生态

### 缺点

- 前期设计复杂度更高
- 如果抽象做得不好，容易显得空泛
- 文档需要更认真地解释设备抽象和路由模型

## 4. 两者的本质区别

### `HA-first`

- 中心对象是 `Home Assistant`
- Mira 更像“智能上层”
- 设备抽象偏 `entity / service`
- 其它生态更多通过 HA 间接获得

### `多生态统一路由`

- 中心对象是 `Mira capability graph`
- Mira 更像“家庭意图编排器”
- 设备抽象偏 `intent / capability / route`
- HA 是重要 route target，而不是唯一理论中心

## 5. 当前代码更接近哪一种

从当前讨论和已有插件方向看，现状不是纯粹的 `HA-first`。

原因是：

- 现有 Home Assistant 控制层不只是裸 `service call`
- 已经出现了 typed tools、scene orchestration、wearable/presence policy 和 ecosystem registry 的结构

这说明当前实现上虽然仍以 HA 为最成熟后端，但架构方向已经在往“多生态统一路由”靠近。

## 6. 推荐定位

推荐的组合是：

- 对外定位：`多生态家庭设备统一路由中心`
- 当前实现策略：`Home Assistant 作为 first-party flagship backend`

也就是说：

- 叙事上不要把 Mira 说成 HA 的附庸
- 工程上承认 HA 目前是最强、最成熟的执行面

这是最稳的平衡。

## 7. 与现有文档的关系

如果要继续展开模块本体，请同时参考：

- `mira-home-assistant-flagship-module.md`
- `mira-core-without-home-assistant.md`
- `mira-released-version-layered-release-architecture.md`

## 8. 正式产品描述文案

下面补两版可以直接复用的正式产品描述文案。

### 8.1 文案版本 A：`HA-first 家庭控制中心`

Mira 的 Home Assistant 模块是她当前最成熟的家庭控制中心。

在这一路径下，Home Assistant 作为默认设备中枢，负责承接家庭中的实体、服务、场景与自动化；Mira 则作为上层智能编排者，通过 typed tools、scene orchestration 和 context-aware decision making，把自然语言理解、长期记忆、状态判断和家庭动作连接起来。

这意味着 Mira 不只是“能调用 Home Assistant API”，而是能在 Home Assistant 已有的设备图谱之上，理解用户状态、读取家庭上下文，并把行动落实为具体、安全、可解释的家庭控制流程。

在这个定位里，Home Assistant 是设备权威层，Mira 是智能控制与陪伴编排层。前者负责把家庭变成一个可控系统，后者负责让这个系统开始表现出理解、判断和照顾。

如果你的目标是最快落地一个真正可用、可演示、可部署的家庭陪伴系统，那么这条路线最直接，也最接近 Mira 当前已经成熟的能力面。

### 8.2 文案版本 B：`多生态家庭设备统一路由中心`

Mira 的 Home Assistant 模块不是一个单独的家居插件，而是她家庭能力图谱中的旗舰执行后端。

在这个定位里，Mira 面向的不是某一个具体家庭平台，而是用户意图、设备能力与环境状态本身。她通过 typed tools、scene orchestration、wearable and presence policies，以及 ecosystem registry，把来自不同生态、不同设备平面的能力组织成一个统一的家庭行动层。

Home Assistant 在这里扮演的是 first-party flagship backend 的角色：它是当前最成熟、最强大的执行面之一，但不是 Mira 理论上的唯一中心。Mira 的真正中心是 capability graph，是对“用户现在需要什么、家庭此刻处于什么状态、哪些动作可以安全执行”的持续理解与编排。

因此，这个模块的价值不只是控制灯光、空调、风扇或音乐，而是让 Mira 能在多生态环境中稳定地读取状态、判断风险、选择路径，并把照顾和行动落实到家庭环境里。

如果你的目标是把 Mira 做成一个长期可扩展、可开放、可连接不同硬件生态的 ambient companion system，那么这条定位更适合正式发布版。

### 8.3 推荐对外用法

如果是：

- 演示
- 合作说明
- 当前能力介绍

优先使用版本 A，会更直观。

如果是：

- 发布版 README
- 架构介绍
- 面向社区的长期叙事

优先使用版本 B，会更稳。

最推荐的实际组合是：

- 首页或演示场景用版本 A
- 架构说明和发布文档用版本 B

## 9. 一句话总结

这两种定位的根本区别在于：

- `HA-first` 是“以 Home Assistant 为主操作系统，Mira 是智能上层”
- `多生态统一路由` 是“以 Mira 为主编排层，Home Assistant 是重要执行后端”

如果目标是长期发布和开放架构，后者更合适。
