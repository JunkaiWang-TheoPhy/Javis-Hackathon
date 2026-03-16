# 云端 Devbox 连通与同步归档概览

## 1. 文档目的

这份文档整理本次对话里与云端 devbox 有关的两类信息：

- 连通性检查结果
- 和 Mira / OpenClaw 相关资产的归档同步结果

它的用途是给后续整理 `Mira_Released_Version` 提供一个统一背景，而不是替代敏感连接信息文件。

说明：

- 敏感连接细节仍然保存在 `devbox_openclaw_info.md`
- 本文只保留说明性结论，不重复凭据和 token

## 2. 连通性检查结论

本次对话中，云端 devbox 被检查为“可连通且健康”。

已确认的点包括：

- SSH 可达
- 远端 `hostname` 和 `whoami` 正常返回
- OpenClaw 健康接口正常
- 关键目录存在
- `openclaw health` 能跑通

从仓库根 README 的原型状态描述看，当前系统也被视为“devbox 和 gateway 可连通，健康检查正常”。

## 3. 同步归档的目标

同步的目标不是把整个 devbox 原样复制，而是保留与 Mira / OpenClaw 直接相关的高价值资产，包括：

- workspace
- extensions / plugins
- skills
- memory
- devices
- identity
- 部分 project 目录下的扩展项目

同时明确排除：

- OpenClaw 本体和大二进制
- `node_modules`
- `.git`
- 缓存
- 临时文件
- 日志
- 打印队列等运行时产物

## 4. 已归档内容范围

根据同步 manifest，本次镜像保留了这些主要内容：

- `/home/devbox/.openclaw/workspace/`
- `/home/devbox/.openclaw/extensions/`
- `/home/devbox/.openclaw/agents/main/`
- `/home/devbox/.openclaw/memory/`
- `/home/devbox/.openclaw/devices/`
- `/home/devbox/.openclaw/identity/`
- `/home/devbox/.openclaw/cron/jobs.json`
- `/home/devbox/.openclaw/openclaw.json`
- `/home/devbox/.openclaw/lingzhu-public/`
- `/home/devbox/project/openclaw-ha-blueprint-memory/`
- `/home/devbox/project/Openclaw-With-Apple/`

本地镜像根目录记录为：

- `openclaw/devbox/`

## 5. 同步结果快照

本次同步结果在 manifest 中记录为：

- 镜像大小约 `11M`
- 镜像文件数 `720`

同步方式不是 `rsync`，而是：

- 通过 `tar over ssh`

原因是远端 devbox 没有安装 `rsync`。

## 6. 完整性判断

本次对话里对同步结果做过一次重新检查，结论可以分两层理解。

### 6.1 对“已定义同步范围”来说

结论是完整的。

检查结果是：

- remote files 和 local files 数量一致
- 没有 `missing_local`
- 没有 `extra_local`
- 没有 `mismatch`

这表示在白名单范围内，本地镜像和远端对应内容是一致的。

### 6.2 对“绝对意义上的全量冷备”来说

还不是。

原因不是漏传，而是有几类内容被明确当作范围外排除了，例如：

- backups
- logs
- exec approvals
- completions
- canvas
- printer queue
- 其它边角运行元数据

所以更准确的说法是：

- 这次得到的是“高价值相关资产镜像”
- 不是“除了 OpenClaw 本体以外所有零碎运行元数据的绝对全量备份”

## 7. 这对发布版意味着什么

这次归档已经足够支持几件重要事情：

- 对照云端 workspace 和本地仓库的内容差异
- 为 `Mira_Released_Version` 提取可公开结构提供素材
- 为 skills / plugins / memory / hardware bridge 做静态整理

但它不意味着：

- 应该把所有 live state 直接带进发布版
- 应该把所有 identity、sessions、长期 memory 原样公开

对于发布版，正确做法仍然是：

- 参考镜像结构
- 提取通用模板
- 脱敏
- 重新组织

## 8. 与其它文档的关系

相关背景可继续参考：

- `../devbox_openclaw_info.md`
- `../openclaw/SYNC_MANIFEST.md`
- `mira-released-version-layered-release-architecture.md`

## 9. 一句话总结

本次对话已经确认：

- 云端 devbox 可连通
- OpenClaw 健康可用
- 和 Mira 直接相关的高价值资产已经做了受控镜像
- 这份镜像足够支持后续发布整理，但不应被误解为完全不加筛选的整机冷备
