# Mira Home Ecosystem Migration Pack

## Quick Links

- [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-home-ecosystem-migration-pack/README.md)
- [CHECKLIST.zh-CN.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-home-ecosystem-migration-pack/CHECKLIST.zh-CN.md)
- [PROMPTS.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-home-ecosystem-migration-pack/PROMPTS.md)
- [FILE_INDEX.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-home-ecosystem-migration-pack/FILE_INDEX.txt)

## 1. 这个导出包是什么

这个文件夹是一个**迁移辅助包（migration pack）**，用于把当前 `Javis-Hackathon` 仓库中与 **Mira 家居生态支持** 相关的内容，增量迁移到另一个已经部署了 Mira 的独立仓库中。

它不是一个可直接替代目标仓库的完整 release repo，也不是一个可直接运行的 monorepo。它的作用是：

- 把当前原型仓里与 **12 个智能家居名称条目**相关的原始材料单独抽出来
- 把当前 `Mira_Released_Version` 里已经成形的 **Home Assistant 模块** 与 **notification-router** 一并带过去
- 给 Codex 一套足够完整、足够接近原始上下文的“迁移参考面”
- 在**记忆无法直接迁移**的前提下，仍然能够让 Codex 在另一个仓库里逐波次完成增量复制、安装和接线

如果你的实际情况是：

- Mira 已经在另一个 repo 中部署
- 你不想重新从零讲一遍设计背景
- 但当前这次对话中的“记忆”和临时上下文并不会自动进入另一个 repo

那么这个导出包就是给这种场景准备的。

## 2. 这个导出包不是什么

它**不是**：

- 最终发布版仓库
- 自动化一键安装器
- 帮你把目标仓库直接改好的 patch
- 可替代长期项目记忆的持久知识库

它更准确的定位是：

- `source bundle`
- `migration context bundle`
- `Codex-readable delta pack`

也就是说，它是给你和 Codex 一起使用的，而不是给最终用户直接使用的。

## 3. 目录结构说明

这个导出包分成两大块：

### 3.1 `prototype-source/`

这一部分保存的是**原型仓的真实来源文件**，让 Codex 在目标仓库里仍然能看到你现在这套设计和实现是从哪里来的。

主要包括：

- `Readme/supported-smart-home-ecosystems.md`
- `Readme/supported-smart-home-ecosystems.en.md`
- `docs/openclaw-ha-ecosystem-progress-2026-03-15.md`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-ha-control/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-alexa/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-google-home/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-hue/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-lutron/`
- `OpenClaw/devbox/project/openclaw-ha-blueprint-memory/plugins/openclaw-plugin-smartthings/`

这些文件的价值在于：

- 它们保留了当前原型仓的**真实插件边界**
- 保留了每个生态的 `package.json`、`openclaw.plugin.json`、`src/`、`skills/`、`tests/`
- 让目标仓库里的 Codex 不需要重新猜测“你当时到底打算怎么支持这个生态”

### 3.2 `release-source/`

这一部分保存的是当前 `Mira_Released_Version` 中**已经收敛出来的 release-side 资料**。

主要包括：

- `Mira_Released_Version/modules/home-assistant/`
- `Mira_Released_Version/services/notification-router/`
- `Mira_Released_Version/examples/home-stack/README.md`
- `Mira_Released_Version/examples/home-stack-with-notification-router/README.md`
- `Mira_Released_Version/examples/service-notification-router/README.md`
- `Mira_Released_Version/deploy/module-home-assistant/README.md`
- `Mira_Released_Version/deploy/service-notification-router/README.md`
- `Mira_Released_Version/core/workspace/AGENTS.md`
- `Mira_Released_Version/core/workspace/MEMORY.md`
- `Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- `Mira_Released_Version/core/openclaw-config/openclaw.example.json`
- `Mira_Released_Version/core/openclaw-config/minimal-runtime-contract.md`
- `Mira_Released_Version/docs/migration/source-to-release-mapping.md`
- `Mira_Released_Version/docs/migration/release-baseline.md`
- `Mira_Released_Version/docs/migration/repository-split-checklist.md`

这些文件的价值在于：

- 它们代表了“你已经收敛好的 release 结构”
- 它们能告诉目标仓库里的 Codex：**不是只迁原型实现，而是要迁成 release 结构**
- 它们能约束 Codex 不要把目标仓库重新做回一个 demo/lab repo

## 4. 为什么记忆不能直接迁移

这是这次迁移里最重要的现实边界。

Codex 在当前会话里的理解，包含两部分：

1. **文件里的持久上下文**
   - 例如 README、spec、config、source、tests、docs、policy

2. **对话里的瞬时上下文**
   - 例如你刚刚说过的话
   - 我刚刚帮你形成的判断
   - 这次会话中不断累积的偏好、立场和临时结论

第二部分并不会自动跟着仓库走。  
也就是说，把 Mira 部署到另一个 repo 之后，**会话记忆（conversation memory）不会自动跨仓迁移**。

因此，正确做法不是期待“记忆被复制过去”，而是把真正重要的长期上下文**外化成文件**，再让 Codex 在目标仓库里重新读取这些文件。

这个 migration pack 做的正是这件事：

- 把应该持久化的设计上下文，尽可能变成文件
- 把原型来源与 release 目标同时带过去
- 让 Codex 在另一个 repo 中通过“重新阅读”来恢复理解，而不是依赖这次会话记忆

## 5. 哪些“记忆”应该迁，哪些不应该迁

### 应该迁的

应该迁的是**结构化、稳定、面向长期的系统记忆**：

- 工作区规则（workspace rules）
- 安全边界（safety boundaries）
- 外发规则（outbound policy）
- 最小运行契约（runtime contract）
- 模块边界（module boundaries）
- 生态支持矩阵（support matrix）
- 迁移映射（source-to-release mapping）
- 配置模板（config templates）
- 示例注册表（registry examples）

这些已经被放进：

- `release-source/Mira_Released_Version/core/workspace/`
- `release-source/Mira_Released_Version/core/openclaw-config/`
- `release-source/Mira_Released_Version/modules/home-assistant/`
- `release-source/Mira_Released_Version/services/notification-router/`
- `release-source/Mira_Released_Version/docs/migration/`

### 不应该迁的

不应该迁的是**会污染新仓上下文或无法稳定复用的瞬时记忆**：

- 当前会话本身
- 一次性的对话推演
- dated daily logs
- 临时机器路径
- live secrets
- 旧环境状态
- 旧仓库中的临时调试结论

因此，在目标仓库中，你不应该要求 Codex “恢复这次对话的全部记忆”，而应该要求它：

- 阅读这个 migration pack
- 从文件中恢复长期上下文
- 在新仓库里重建 release-safe 的工作区知识

## 6. 推荐的使用方式

### 6.1 把整个导出包放进目标仓库

推荐放在目标仓库的一个**明确的迁移上下文目录**中，例如：

```text
<target-repo>/
├─ _migration/
│  └─ mira-home-ecosystem-migration-pack/
```

或者：

```text
<target-repo>/
├─ vendor/
│  └─ mira-home-ecosystem-migration-pack/
```

不建议把里面的文件一开始就散着复制到目标仓库各处。  
先保留这整个 bundle，让 Codex 先读，再按波次迁移。

### 6.2 在目标仓库里启动 Codex

进入目标仓库后，再开启新的 Codex 会话。  
第一句话不要直接说“去实现”，而是先让它建立迁移上下文。

建议的第一条指令：

```text
请阅读 _migration/mira-home-ecosystem-migration-pack/README.md，
然后系统性检查这个 bundle 里的 prototype-source 和 release-source，
告诉我应该如何把 Home Assistant 旗舰模块、notification-router、
以及 12 个智能家居名称条目，增量迁移到当前仓库。
要求：不要推翻当前仓库结构，不要假设旧会话记忆仍然存在。
```

这一步非常关键。  
你要先让新的 Codex 会话知道：

- 它现在是在一个**新的 repo**
- 旧会话记忆已经断开
- 它的上下文来源应该是这个 bundle，而不是猜测

## 7. 推荐的增量迁移顺序

不要一次性让 Codex “把 12 个生态全部搬完”。  
最稳的方式是按波次（waves）推进，每一波都让它在目标仓库里做**可提交、可验证、可回退**的一小段。

### Wave 0：建立迁移基线

目标：

- 让 Codex 读懂 bundle
- 对比目标仓库现状
- 明确哪些目录已经存在
- 明确哪些内容只能增量复制，不能覆盖

建议提示词：

```text
请基于 _migration/mira-home-ecosystem-migration-pack，
对当前仓库做一次 source-to-target mapping。
只列出增量迁移方案，不要直接修改文件。
```

### Wave 1：先迁 release-side 家庭模块骨架

目标：

- 先把 `modules/home-assistant/` 的 release-side 结构放进目标仓库
- 不急着上 direct adapter
- 不急着上 12 个生态的全部实现

优先读取：

- `release-source/Mira_Released_Version/modules/home-assistant/`
- `release-source/Mira_Released_Version/examples/home-stack/README.md`
- `release-source/Mira_Released_Version/deploy/module-home-assistant/README.md`

建议提示词：

```text
请先只迁 release-side 的 modules/home-assistant 骨架，
包括 docs、config、registry、plugin package shell。
要求保持当前仓库结构，不要覆盖现有部署逻辑。
```

### Wave 2：扩到 12 个名称条目

目标：

- 先把“12 个名称条目支持面”补齐
- 但先以 `HA-first` 为主
- 不要一开始追求 12 个 direct adapter 全可运行

优先读取：

- `prototype-source/Readme/supported-smart-home-ecosystems.md`
- `prototype-source/docs/openclaw-ha-ecosystem-progress-2026-03-15.md`
- `prototype-source/.../openclaw-plugin-ha-control/src/ecosystem.ts`
- `release-source/.../modules/home-assistant/registry/devices.example.json`

建议提示词：

```text
请把 12 个智能家居名称条目迁入当前仓库的 Home Assistant 模块设计中。
要求先补 support matrix、ecosystem docs、registry/config slots，
优先走 HA-first 路径，不要一次性承诺全部 direct runtime。
```

### Wave 3：迁 direct adapter 边界

目标：

- 把需要保留的品牌 direct adapter 边界迁过来
- 推荐顺序：Hue -> Lutron -> Google Home -> SmartThings -> Alexa readiness

建议提示词：

```text
请先迁 Hue direct adapter 的 release-side 边界，
包括 package shell、README、source boundary 和 operator docs。
不要同时迁其它生态。
```

这一波里最重要的是**一生态一生态推进**，不要把 5 个品牌 direct adapter 一次性混在一起。

### Wave 4：迁 notification-router

目标：

- 把 `notification-router` 带入目标仓库
- 让外发策略（outbound policy）成为正式运行面的一部分
- 解决 Mira 主动消息与家庭模块之间的配合

优先读取：

- `release-source/Mira_Released_Version/services/notification-router/`
- `release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- `release-source/Mira_Released_Version/core/workspace/AGENTS.md`

建议提示词：

```text
请把 release-side notification-router 增量迁入当前仓库，
并接到当前的 outbound policy 结构。
要求保留现有部署，不要破坏当前通知链路。
```

### Wave 5：迁工作区规则与长期上下文

目标：

- 不迁“旧会话记忆”
- 只迁真正属于长期上下文的规则和模板

优先读取：

- `release-source/Mira_Released_Version/core/workspace/AGENTS.md`
- `release-source/Mira_Released_Version/core/workspace/MEMORY.md`
- `release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- `release-source/Mira_Released_Version/core/openclaw-config/openclaw.example.json`

建议提示词：

```text
请不要迁移旧会话记忆。
只根据 migration pack 中的 workspace rules、memory policy、
outbound policy 和 openclaw example config，
在当前仓库里重建一份 release-safe 的长期上下文。
```

## 8. 如何利用 Codex 做“增量而不是重做”

这是整个 README 最重要的一部分。

在目标仓库中，你给 Codex 的提示必须始终包含以下约束：

### 8.1 明确这是“增量迁移”

你要明确说：

- 当前仓库已经有 Mira
- 不允许重写整个架构
- 只允许在现有结构上增量复制

可直接复用的提示词：

```text
这是增量迁移，不是重建。
请尊重当前仓库结构，在现有基础上吸收 migration pack 中的内容。
不要把当前仓库重做成另一个 monorepo。
```

### 8.2 明确“旧记忆不能依赖”

```text
你不能假设旧会话记忆仍然存在。
请只使用当前仓库文件和 _migration/mira-home-ecosystem-migration-pack 中的文件来恢复上下文。
```

### 8.3 明确“一次只做一波”

```text
请只做当前波次，不要顺手做后面几波。
先出计划，再落文件，再验证。
```

### 8.4 明确“不覆盖现有部署”

```text
当前仓库里 Mira 已经部署。
迁移时请优先增量复制、保留兼容，不要直接覆盖现有运行配置。
```

## 9. 如何在目标仓库中安装和运行

因为目标仓库的现状未知，这里不提供“唯一正确命令”，而提供一条更稳的安装路线。

### 9.1 先迁文件，再安装依赖

顺序应该是：

1. 先让 Codex 完成某一波迁移
2. 确认目录边界和文件路径合理
3. 再在目标仓库中对新迁入的 package 安装依赖
4. 再做测试和运行

不要反过来。  
不要在文件还没迁完的时候先全仓 `npm install`。

### 9.2 推荐的安装顺序

先装模块，再装服务：

1. `modules/home-assistant/plugin/`
2. `services/notification-router/`

如果目标仓库保留 monorepo/workspace 结构，则由 Codex根据现状改写安装方式。  
如果目标仓库是普通 repo，则可以先让 Codex 把这两个 package 作为独立 package 接入。

### 9.3 推荐的运行顺序

先跑模块，再跑服务：

1. 先让 `Home Assistant module` 在当前仓库里形成可读取配置、可解释 registry 的状态
2. 再把 `notification-router` 接上
3. 最后再启用特定生态的 direct adapter

如果一开始就同时启 12 个生态、模块、通知服务和 direct adapter，排错会非常困难。

### 9.4 推荐的验证顺序

先做静态验证，再做运行验证：

1. 路径和边界是否正确
2. 配置示例是否能解析
3. package 是否能安装
4. 测试是否能跑
5. 再做本地 smoke test

在目标仓库里，可以这样要求 Codex：

```text
请先做静态验证：
- 检查迁入路径
- 检查 config example
- 检查 package metadata
- 检查 README 与 runtime contract 是否一致
暂时不要启动服务。
```

然后下一轮再说：

```text
现在开始做本地安装与 smoke test。
如果需要新增 env.example、operator README 或 package script，请增量补齐。
```

## 10. 12 个名称条目的推荐接入策略

在目标仓库中，不要把 12 个名称条目理解成“12 个独立产品”。  
正确理解应该是：

- `1 个正式家庭模块`
- `12 个名称条目`
- `3 种支持层级`

### 三种支持层级

1. `HA-first`
   - Apple Home
   - HomeKit
   - Xiaomi / Mi Home
   - Matter
   - Aqara
   - Tuya / Smart Life
   - SwitchBot
   - Google Home / Nest
   - Lutron
   - SmartThings

2. `HA-first + optional direct adapter`
   - Philips Hue

3. `readiness / onboarding only`
   - Amazon Alexa

这意味着目标仓库中最先落的，不应该是 12 套并行执行实现，而是：

- 12 条 support entries
- 12 条 ecosystem docs
- 12 组 registry / config slots
- 少数必要的 direct adapter 边界

## 11. Codex 推荐提示词模板

下面这些提示词你可以直接在目标仓库里用。

### 模板 A：建立上下文

```text
请阅读 _migration/mira-home-ecosystem-migration-pack/README.md，
并系统性检查这个 bundle 中的 prototype-source 和 release-source。
告诉我当前仓库应该如何增量吸收这些内容。
要求：不要假设旧会话记忆仍然存在。
```

### 模板 B：先迁模块骨架

```text
请先迁 release-source 中的 modules/home-assistant，
但只迁 release-safe 结构，不要直接迁所有 direct runtime。
要求：增量复制，不覆盖现有部署。
```

### 模板 C：扩到 12 个条目

```text
请把 12 个智能家居名称条目补到当前仓库的 home module 中，
优先通过 support matrix、ecosystem docs、registry 和 config slots 落地，
不要一次性承诺 12 个 direct adapter。
```

### 模板 D：迁 notification-router

```text
请把 release-source 中的 notification-router 增量迁入当前仓库，
并与当前 outbound policy 结构对齐。
要求：不要破坏已有通知链路。
```

### 模板 E：重建长期上下文，不迁旧记忆

```text
请不要迁移旧会话记忆。
只根据 migration pack 中的 AGENTS.md、MEMORY.md、OUTBOUND_POLICY.md
和 openclaw.example.json，在当前仓库中重建 release-safe 的长期上下文。
```

## 12. 不要这样做

在目标仓库里，尽量避免以下几种做法：

- 一开始就让 Codex “把整个 bundle 全部复制过去”
- 直接要求“把这次会话的记忆也迁过去”
- 不做波次拆分，直接同时迁模块、服务、12 个生态和 direct adapter
- 还没看边界就直接覆盖目标仓库现有配置
- 把 `prototype-source` 当成最终 release 结构直接照搬
- 把 `release-source` 当成必须原样覆盖目标仓库的唯一真相

正确做法永远是：

- 把 bundle 当成迁移上下文
- 让 Codex 先读，再计划，再增量复制，再安装，再验证

## 13. 这个导出包的最佳用途

这个导出包最适合以下场景：

- 你已经有另一个独立的 Mira repo
- 你希望把当前 `Javis-Hackathon` 中收敛出来的家居生态支持迁过去
- 你不想依赖当前会话的短期记忆
- 你希望 Codex 在新仓库里也能读懂“原型来源 + release 目标 + 当前迁移逻辑”

如果你按这份 README 去使用，那么即使旧会话记忆不能跨仓迁移，你依然可以让新的 Codex 会话通过这个 bundle 快速恢复足够多的长期上下文，并以**增量迁移**的方式，把 Mira 的家庭模块、通知服务和 12 个智能家居名称条目稳定地接入到另一个 repo 中。
