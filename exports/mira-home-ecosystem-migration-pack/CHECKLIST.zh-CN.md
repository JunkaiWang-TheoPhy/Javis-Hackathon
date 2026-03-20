# Mira 家居生态迁移任务清单

这是一份给**人类操作者**看的迁移 checklist。  
它和顶层 [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-home-ecosystem-migration-pack/README.md) 的关系是：

- `README.md` 负责解释迁移原则、上下文和与 Codex 的协作方式
- 本文件负责把迁移工作拆成一组可以逐项勾选的任务

这份清单默认你的现状是：

- 另一个仓库里已经有 Mira
- 你不希望推翻当前仓库结构
- 你希望把当前 `Javis-Hackathon` 里与家居生态、`Home Assistant` 模块、`notification-router` 有关的内容增量迁过去
- 你接受“旧会话记忆不会直接迁移”，而改用 bundle 文件恢复上下文

---

## A. 迁移前准备

- [ ] 确认目标仓库已经可以正常打开、运行和提交代码
- [ ] 在目标仓库中创建一个固定的迁移目录，例如：
  - [ ] `_migration/mira-home-ecosystem-migration-pack/`
  - 或 [ ] `vendor/mira-home-ecosystem-migration-pack/`
- [ ] 将整个导出包完整复制到目标仓库，不要只挑零散文件
- [ ] 不要在复制后立刻把 bundle 中的文件散着移动到仓库各处
- [ ] 先让 Codex 阅读 bundle，再决定迁移顺序
- [ ] 确认目标仓库当前已部署的 Mira 路径、模块路径、通知路径各自在哪里
- [ ] 确认目标仓库是否已有：
  - [ ] `Home Assistant` 相关目录
  - [ ] 通知服务或消息路由器
  - [ ] 工作区规则文件
  - [ ] `examples/` 或 `deploy/` 入口

---

## B. 建立上下文基线

- [ ] 在目标仓库中启动新的 Codex 会话
- [ ] 第一条指令先让 Codex 阅读：
  - [ ] `README.md`
  - [ ] `FILE_INDEX.txt`
- [ ] 明确告诉 Codex：
  - [ ] 这是增量迁移，不是重建
  - [ ] 不要假设旧会话记忆仍然存在
  - [ ] 目标仓库结构优先于 bundle
  - [ ] 先做 mapping，再做修改
- [ ] 让 Codex 先输出一份 source-to-target mapping
- [ ] 人工确认这份 mapping 没有试图“重做整个仓库”

推荐动作：

- [ ] 先用 `PROMPTS.md` 中的“建立上下文”模板

---

## C. Wave 0：迁移基线盘点

- [ ] 让 Codex 盘点目标仓库现状
- [ ] 让 Codex 明确哪些目录可以复用
- [ ] 让 Codex 明确哪些目录必须新建
- [ ] 让 Codex 明确哪些内容只能增量复制，不能覆盖
- [ ] 让 Codex 明确哪些当前运行配置绝不能被直接改写
- [ ] 确认它已经理解：
  - [ ] `prototype-source/` 是来源参考
  - [ ] `release-source/` 是目标形态参考

通过标准：

- [ ] Codex 能清楚区分“原型来源”和“release 目标”
- [ ] Codex 不再把 bundle 误认为完整目标仓库

---

## D. Wave 1：先迁 release-side Home Assistant 模块骨架

目标：先让目标仓库具备 **release 结构化家庭模块外壳**，而不是先追求 12 个生态全跑起来。

优先输入给 Codex 的目录：

- [ ] `release-source/Mira_Released_Version/modules/home-assistant/`
- [ ] `release-source/Mira_Released_Version/examples/home-stack/`
- [ ] `release-source/Mira_Released_Version/deploy/module-home-assistant/`

需要迁移的内容：

- [ ] 模块 README
- [ ] `docs/`
- [ ] `config/`
- [ ] `registry/`
- [ ] `plugin/package.json`
- [ ] `plugin/tsconfig.json`
- [ ] `plugin/src/README.md`

此阶段先不要要求：

- [ ] 一次性迁入所有 direct adapter 源码
- [ ] 一次性补齐 12 个生态的真实运行实现
- [ ] 立即跑通所有品牌设备

通过标准：

- [ ] 目标仓库中已有一个清晰的 `Home Assistant` 旗舰模块壳
- [ ] 目录边界清晰
- [ ] 没有破坏现有 Mira 部署结构

---

## E. Wave 2：补齐 12 个名称条目

目标：让目标仓库从“有一个家庭模块”变成“这个模块明确覆盖 12 个名称条目”。

优先输入给 Codex 的目录：

- [ ] `prototype-source/Readme/supported-smart-home-ecosystems.md`
- [ ] `prototype-source/docs/openclaw-ha-ecosystem-progress-2026-03-15.md`
- [ ] `prototype-source/.../openclaw-plugin-ha-control/src/ecosystem.ts`
- [ ] `release-source/.../modules/home-assistant/registry/devices.example.json`

这一波要求 Codex 完成：

- [ ] support matrix
- [ ] ecosystem docs
- [ ] registry/config slots
- [ ] 12 个名称条目的支持层级标注

推荐的支持层级检查：

- [ ] `HA-first`
- [ ] `HA-first + optional direct adapter`
- [ ] `readiness / onboarding only`

需要人工确认：

- [ ] 是否仍保持 “1 个正式家庭模块 + 12 个名称条目” 的结构
- [ ] 是否没有被错误拆成 12 个独立模块

---

## F. Wave 3：迁 direct adapter 边界

目标：只给需要的生态补 direct adapter，不搞 12 条并行实现。

推荐顺序：

- [ ] Hue
- [ ] Lutron
- [ ] Google Home
- [ ] SmartThings
- [ ] Alexa readiness

每个 direct adapter 都应单独做一波：

- [ ] 先迁边界和 README
- [ ] 再迁 package shell
- [ ] 再决定是否迁 `src/`
- [ ] 再决定是否迁 `tests/`

不要这样做：

- [ ] 一次性把 5 个品牌 direct adapter 全部塞进目标仓库
- [ ] 还没看清边界就直接启用 live runtime

通过标准：

- [ ] direct adapter 只在必要品牌上存在
- [ ] 默认路径仍然是 `HA-first`

---

## G. Wave 4：迁 notification-router

目标：把 Mira 的主动消息能力正式接入目标仓库。

优先输入给 Codex 的目录：

- [ ] `release-source/Mira_Released_Version/services/notification-router/`
- [ ] `release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- [ ] `release-source/Mira_Released_Version/core/workspace/AGENTS.md`

需要迁移的内容：

- [ ] service package shell
- [ ] runtime contract
- [ ] outbound policy example
- [ ] operator docs
- [ ] dispatch path

人工检查重点：

- [ ] 目标仓库原有通知链路是否被破坏
- [ ] outbound policy 是否与当前仓库语义一致
- [ ] notification-router 是否仍然是独立服务，而不是乱塞进 core

---

## H. Wave 5：重建长期上下文，不迁旧会话记忆

目标：在目标仓库里恢复长期工作区规则，而不是追求恢复“这次聊天”。

优先输入给 Codex 的目录：

- [ ] `release-source/Mira_Released_Version/core/workspace/AGENTS.md`
- [ ] `release-source/Mira_Released_Version/core/workspace/MEMORY.md`
- [ ] `release-source/Mira_Released_Version/core/workspace/OUTBOUND_POLICY.md`
- [ ] `release-source/Mira_Released_Version/core/openclaw-config/openclaw.example.json`

这一步应该让 Codex 做的是：

- [ ] 重建 release-safe workspace rules
- [ ] 重建长期 memory policy
- [ ] 重建 outbound policy
- [ ] 重建最小运行配置参考

这一步不应该让 Codex 做的是：

- [ ] 试图恢复旧会话完整记忆
- [ ] 把临时聊天内容当成长期真相写入仓库
- [ ] 把历史调试状态带到新仓

---

## I. 安装与运行清单

### I.1 安装前

- [ ] 已完成某一波文件迁移
- [ ] 目录边界确认无误
- [ ] 配置样例能解析
- [ ] README 与 runtime contract 一致

### I.2 安装顺序

- [ ] 先装 `modules/home-assistant/plugin`
- [ ] 再装 `services/notification-router`
- [ ] 再看是否需要 direct adapter 单独安装

### I.3 运行顺序

- [ ] 先让 `Home Assistant` 模块可读取 config / registry
- [ ] 再接入 `notification-router`
- [ ] 最后再启用特定品牌的 direct adapter

### I.4 验证顺序

- [ ] 静态检查路径
- [ ] 检查 config example
- [ ] 检查 package metadata
- [ ] 跑 package tests
- [ ] 再做本地 smoke test

---

## J. 12 个名称条目迁移覆盖检查

- [ ] Amazon Alexa
- [ ] Apple Home
- [ ] HomeKit
- [ ] Xiaomi / Mi Home
- [ ] Matter
- [ ] Aqara
- [ ] Tuya / Smart Life
- [ ] SwitchBot
- [ ] Philips Hue
- [ ] Google Home / Nest
- [ ] Lutron
- [ ] SmartThings

对每一项都至少检查：

- [ ] support entry 已存在
- [ ] ecosystem doc 已存在
- [ ] registry/config slot 已存在
- [ ] 支持层级已明确
- [ ] 运行路径已明确
- [ ] 是否需要 direct adapter 已明确

---

## K. 提交前最终检查

- [ ] 没有把目标仓库重做成另一个 monorepo
- [ ] 没有把旧会话记忆当成可直接迁移对象
- [ ] 没有覆盖目标仓库已有部署
- [ ] 迁入内容遵循“增量复制、结构优先、路径兼容”
- [ ] 迁移说明和运行说明都已补齐
- [ ] 新增文件对新 Codex 会话是自解释的

---

## L. 推荐使用方式

如果你是人在推进迁移，最稳的实际使用方式是：

1. [ ] 先读 `README.md`
2. [ ] 再看 `FILE_INDEX.txt`
3. [ ] 然后把本清单作为每一波的勾选表
4. [ ] 再配合 `PROMPTS.md` 给 Codex 下指令

也就是说：

- `README.md` 负责告诉你“为什么这样迁”
- `CHECKLIST.zh-CN.md` 负责告诉你“按什么顺序迁”
- `PROMPTS.md` 负责告诉你“怎么对 Codex 说”
