# Mira 的 Home Assistant 家庭控制旗舰模块

## 1. 模块定位

`Home Assistant` 模块应被定义为：

> Mira 的家庭控制旗舰模块。  
> Home Assistant 作为设备权威层，Mira 通过 typed tools、scene orchestration、wearable/presence policies 和 ecosystem registry 来理解家庭状态并安全执行动作。

这个定义有两个关键点：

1. `Home Assistant` 是 **Mira 最强、最成熟的家庭控制后端**
2. `Mira` 本身不是 Home Assistant 的附庸，而是站在更高一层的 **理解、编排与决策层**

因此，这个模块不应被描述成“一个普通 HA 插件”，而应被描述成 Mira 在家庭环境中的 **第一方官方旗舰模块**。

---

## 2. 为什么它是旗舰模块

在当前 Mira 体系里，Home Assistant 是最适合作为家庭设备权威层的基础设施，因为它同时具备：

- 统一设备抽象
- 大量现成生态接入
- 稳定的 entity / service / scene 模型
- automation 与状态订阅能力
- 对家庭环境状态的集中表达能力

这意味着 Mira 不需要直接和每一个品牌云 API、每一个局部设备协议、每一个独立 app 分别耦合，而是可以优先通过 Home Assistant 获得：

- 家中设备当前状态
- 设备可执行能力
- 预定义场景
- presence / climate / lighting / media 等统一语义

从系统设计上看，Home Assistant 负责的是 **device authority**，而 Mira 负责的是：

- 理解用户意图
- 结合上下文判断是否该行动
- 按风险等级选择执行路径
- 组织多步场景
- 决定是否需要确认、延迟或抑制动作

---

## 3. 在整体架构中的角色

在 Mira 的分层发布架构中，这个模块应位于：

```text
Mira_Released_Version/
└─ modules/
   └─ home-assistant/
```

它不应该进入 `core/`，因为：

- Mira Core 的本质是人格、runtime、interaction、memory、extension interface
- Home Assistant 是 Mira 获得“家庭环境执行能力”的模块，不是 Mira 身份本体

更准确地说：

- `core/` 定义 Mira 是谁
- `modules/home-assistant/` 定义 Mira 如何在家庭环境中行动

所以它的系统角色应该是：

- `Mira Core` 之上的第一方家庭控制模块
- Mira 当前对外最强的环境执行面
- Mira 未来多生态家庭能力的旗舰实现

---

## 4. 架构中心：不是单个 API，而是家庭控制平面

这个模块的真正中心不是单个 `service call`，而是一个完整的家庭控制平面。

它应包含四个核心支柱：

1. `typed tools`
2. `scene orchestration`
3. `wearable/presence policies`
4. `ecosystem registry`

这四者共同决定了 Mira 不是“会发开关命令”，而是“能理解家庭状态并安全行动”。

---

## 5. Typed Tools

### 5.1 定义

`typed tools` 是 Mira 和家庭控制系统交互的标准化工具接口。

它们的价值在于：

- 把自然语言意图映射成可验证的结构化调用
- 让 Mira 能明确知道自己在读取什么、控制什么、影响什么
- 让风险判断、日志审计和回归测试变得可行

### 5.2 应承担的职责

这一层至少应覆盖：

- 读取设备状态
- 调用 Home Assistant service
- 查询场景和能力
- 触发预定义场景
- 处理身体状态或 presence 驱动的家庭动作

它的关键不是“工具数量多”，而是工具边界清晰：

- 每个工具有明确输入
- 每个工具有明确输出
- 每个工具有明确副作用范围
- 每个工具有明确风险等级

### 5.3 为什么重要

没有 typed tools，Mira 很容易退化成：

- 直接把语言生成塞进 HA API
- 无法稳定测试
- 无法做安全确认
- 无法区分读状态和执行动作

有了 typed tools，Mira 才能在家庭场景中做到：

- 读写分离
- 风险分级
- 审批链插入
- 行为可追踪

---

## 6. Scene Orchestration

### 6.1 定义

`scene orchestration` 不是单设备控制，而是把多个动作组织成一个有上下文的家庭场景执行单元。

比如：

- 回家后降温
- 运动后进入恢复模式
- 晚间安静陪伴模式
- 工作专注环境切换

### 6.2 为什么 Mira 需要场景层

如果只有单个开关命令，Mira 看起来只是一个“自然语言遥控器”。

但 Mira 的目标不是做遥控器，而是做：

- 上下文感知的陪伴式 agent
- 能把理解转化成环境行动的系统

场景层让 Mira 能从：

- “打开空调”

升级到：

- “根据当前状态切换到合适的家庭环境”

### 6.3 场景编排的输入

场景不应只由一句话触发，而应由多维上下文共同决定：

- 用户显式请求
- 当前身体状态
- presence 状态
- 时间段
- 最近交互记忆
- 风险和打扰成本

### 6.4 场景编排的输出

场景执行结果应不只是一个 service 调用，而应是：

- 组合动作
- 执行理由
- 风险判断
- 是否需要确认
- 执行后状态摘要

---

## 7. Wearable / Presence Policies

### 7.1 定义

`wearable/presence policies` 是把身体状态和空间存在状态变成家庭行为判断条件的策略层。

它连接的是：

- 手环、手表、健康事件
- 用户是否在家 / 是否回家 / 是否正在活动
- 家居环境动作是否应该发生

### 7.2 为什么这是 Mira 的特色

普通 Home Assistant 自动化更像：

- if this then that

而 Mira 需要的是：

- context-aware care policy

也就是：

- 用户刚运动完且到家，是否要先降温
- 用户夜间已疲惫，是否应避免强提醒
- 用户长期偏好安静回家，是否应抑制某些自动化

### 7.3 这层不能只是设备数据透传

这层的职责不是简单传入：

- 心率
- presence
- 睡眠

而是要定义：

- 哪些状态重要
- 哪些组合允许触发场景
- 哪些组合必须抑制场景
- 哪些动作要先确认

### 7.4 它的工程地位

这一层实际上是 Mira 从“家庭控制器”走向“家庭陪伴系统”的关键层。

没有它，Mira 只是：

- 会控制家电

有了它，Mira 才像：

- 在理解你状态后调整家庭环境

---

## 8. Ecosystem Registry

### 8.1 定义

`ecosystem registry` 是一个统一能力注册层，用来描述家庭设备和生态系统的：

- 设备身份
- 别名
- 能力
- 路由方式
- 风险等级

### 8.2 为什么需要它

如果没有 registry，系统会很快变成：

- 每个品牌一套逻辑
- 每个设备一套命名
- 每个场景一堆硬编码 entity id

那样的系统不可扩展，也不适合发布版。

### 8.3 它的作用

registry 应把设备从“厂商实现细节”提升成 Mira 可以理解的统一能力对象，例如：

- `device`
- `aliases`
- `capabilities`
- `route`
- `risk tier`

这样 Mira 面对的是：

- “风扇”
- “降温”
- “夜间安静模式”

而不是低层协议细节。

### 8.4 它和 Home Assistant 的关系

在当前阶段，registry 可以以 Home Assistant 为主要设备权威层；
但从长期架构看，registry 不应只服务于 HA，也应为未来的 direct adapter、多生态后端预留空间。

所以这个模块当前是：

- `HA-first backend`

但更长远的方向应是：

- `Mira-centric capability registry`

---

## 9. 安全执行原则

因为这是 Mira 的家庭控制旗舰模块，所以它必须把“安全执行”写进定义，而不是事后补救。

### 9.1 基本原则

- 读取状态与执行动作分离
- 高风险动作必须可确认
- 模块不应默认等于“全设备最高权限”
- 不要因为 Mira 能理解上下文，就让她跳过执行边界

### 9.2 风险分层

建议至少区分：

- `inform`
  - 只读、提示、低风险说明
- `confirm`
  - 有副作用，需要确认
- `side_effect`
  - 已执行或明确会影响环境

### 9.3 为什么这很关键

家庭控制不是普通 UI 操作。

它影响的是：

- 温度
- 光线
- 声音
- 门锁 / 摄像头 / 安防
- 老人照护与独居者陪伴环境

因此它必须是一个：

- 有 typed tools 的系统
- 有 scene orchestration 的系统
- 有 policy 的系统
- 有风险纪律的系统

---

## 10. 它与 Mira Core 的边界

这个模块应明确依赖 `Mira Core`，但不反向定义 Core。

### Mira Core 负责

- persona
- agent runtime
- interaction
- memory
- extension interface

### Home Assistant 模块负责

- 家庭状态读取
- 家庭动作执行
- 家庭场景编排
- 身体状态 / presence 驱动的家庭策略
- 家庭生态能力注册

### 不应放在这个模块里的内容

- Mira 基础人格定义
- Mira 第一轮品牌开场规则本体
- Mira 通用记忆系统本体
- 与家庭环境无关的通用交互逻辑

这条边界非常重要，因为它决定了这个模块是：

- 一个强大的官方模块

而不是：

- Mira 本体被 Home Assistant 反向吞掉

---

## 11. 对外叙事建议

如果要写对外发布文案，我建议这样描述：

> `modules/home-assistant/` is Mira’s flagship home control module.  
> Home Assistant acts as the device authority layer, while Mira interprets household state and safely executes actions through typed tools, scene orchestration, wearable and presence policies, and a unified ecosystem registry.

如果用中文：

> `modules/home-assistant/` 是 Mira 的家庭控制旗舰模块。  
> Home Assistant 作为设备权威层，Mira 不只是发出命令，而是通过 typed tools、scene orchestration、wearable/presence policies 和 ecosystem registry 来理解家庭状态并安全执行动作。

这个说法的好处是：

- 强调 Home Assistant 的基础设施地位
- 保留 Mira 作为更高层智能编排者的地位
- 不会把模块说成“只是 HA 插件”
- 也不会夸大成脱离 HA 就完全成熟的多生态家庭总线

---

## 12. 最终结论

这份模块说明的核心结论是：

- 这不是一个普通的 Home Assistant 插件目录
- 这是 Mira 在家庭环境中的第一方旗舰模块
- Home Assistant 负责设备权威层
- Mira 负责理解、编排、策略与安全执行

因此，这个模块最准确的定位是：

**Mira 的家庭控制旗舰模块。**

它让 Mira 从一个会理解和陪伴的 agent，进一步成为一个能够通过家庭环境执行照顾、调节氛围、并安全行动的系统。
