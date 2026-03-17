# 本次对话新增说明文档索引

## 1. 文档目的

这份索引用来汇总 `2026-03-17` 这次对话中新增或已补齐的说明性文档，方便后续在 `Readme/` 中快速定位。

## 2. 本次新增文档

- `mira-release-strategy-options.md`
- `repo-footprint-overview.md`
- `mira-v1-role-in-this-repo.md`
- `mira-core-without-home-assistant.md`
- `home-assistant-module-positioning-options.md`
- `devbox-connectivity-and-sync-overview.md`
- `messaging-lark-module-positioning.md`
- `mira-core-openclaw-relationship-and-proactive-capabilities.md`
- `mira-openclaw-channel-integration-spec.md`

## 3. 本次对话已存在并继续沿用的相关文档

- `mira-released-version-layered-release-architecture.md`
- `mira-released-version-layered-release-architecture.html`
- `mira-memory-sleep-and-forgetting-spec.md`
- `mira-home-assistant-flagship-module.md`

## 4. 推荐阅读顺序

如果从发布架构往下看，建议顺序是：

1. `mira-release-strategy-options.md`
2. `mira-released-version-layered-release-architecture.md`
3. `mira-core-without-home-assistant.md`
4. `mira-home-assistant-flagship-module.md`
5. `home-assistant-module-positioning-options.md`
6. `messaging-lark-module-positioning.md`
7. `mira-memory-sleep-and-forgetting-spec.md`

如果从当前仓库背景往下看，建议顺序是：

1. `repo-footprint-overview.md`
2. `mira-v1-role-in-this-repo.md`
3. `devbox-connectivity-and-sync-overview.md`

## 5. 一句话总结

这批文档的作用是把本次对话里已经形成的高信息量结论，从聊天回答变成可复用、可引用、可进一步整理进发布版的说明材料。

补充：

- `home-assistant-module-positioning-options.md` 已包含两版可直接复用的正式产品描述文案
- `mira-core-openclaw-relationship-and-proactive-capabilities.md` 已补充 `Mira Core` 与 `OpenClaw` 的关系以及主动能力边界说明
- `messaging-lark-module-positioning.md` 已更新为最终发布结论：发布版不保留 `messaging-lark` 为一级模块，而改为通过 OpenClaw 原生 channel 能力接入所有受支持的通讯软件
- `mira-openclaw-channel-integration-spec.md` 已把 channel-agnostic 通讯层整理成正式 spec，覆盖目录结构、channel contract、outbound policy、三条主动触发路径和 `notification-router` 职责边界
- `mira-openclaw-channel-integration-spec.en.md` 是对应英文伴生版，便于后续与中文版一起迁移到 `Mira_Released_Version`
