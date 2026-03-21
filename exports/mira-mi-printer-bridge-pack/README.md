# Mira Mi Printer Bridge Pack

## Quick Links

- [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/README.md)
- [FILE_INDEX.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/FILE_INDEX.txt)
- [source/docs/printer-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/docs/printer-bridge/README.md)
- [source/tools/printer_bridge/bridge_config.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/tools/printer_bridge/bridge_config.json)

## 1. 这个导出包是什么

这个文件夹把当前 `Javis-Hackathon` 仓库里和 `Mi Printer` 相关的桥接资料单独抽了出来，方便迁移、复查，或者让另一个仓库里的 Codex 重新建立上下文。

它不是完整 release repo，也不是一键安装器。它的作用是把 `本地 macOS CUPS 打印机 -> 本地 printer bridge -> devbox OpenClaw` 这条链路的稳定文件集中到一个地方。

## 2. 仓库里是否有 Mi Printer 设置

有，而且是成体系的。

当前仓库里记录的是把云端 `OpenClaw` 的打印请求桥接到本地 `Mi Wireless Photo Printer 1S` 的方案，不只是简单提到打印机名字。

这套设置包括：

- 本地 macOS 打印机队列配置
- 本地 loopback bridge 服务
- 远端 `devbox` 队列桥接和插件部署
- 单次打印脚本
- 后台常驻 LaunchAgents 安装脚本

## 3. 当前链路

当前文档描述的核心链路是：

```text
OpenClaw on devbox -> remote queue/plugin -> local Mac connector over SSH -> local printer bridge -> macOS CUPS -> Mi Wireless Photo Printer 1S
```

它的目标不是把打印机直接暴露成公网服务，而是通过 `devbox` 队列和本地 Mac connector 把打印动作桥接回来。

## 4. 关键设置摘要

- 打印机显示名：`Mi Wireless Photo Printer 1S [6528]`
- CUPS 队列名：`Mi_Wireless_Photo_Printer_1S__6528_`
- 本地 bridge 监听地址：`http://127.0.0.1:9771`
- 远端桥接引用：`queue://devbox/home/devbox/.openclaw/printer-bridge-queue`
- token 环境变量：`OPENCLAW_PRINTER_BRIDGE_TOKEN`
- 默认用户侧纸张 alias：`three_inch`
- 默认 alias 映射：`three_inch -> 3x3.Fullbleed`
- 支持纸张：
  - `3x3`
  - `3x3.Fullbleed`
  - `4x6`
  - `4x6.Fullbleed`
- 推荐高层入口：
  - `tools/printer_bridge/up.sh`
  - `tools/printer_bridge/print_image.py`
  - `tools/printer_bridge/install_launchd.py`

## 5. 导出内容结构

这个 bundle 主要分成两部分：

- `source/docs/printer-bridge/`
  - 本地主机、打印队列、远端桥接方式和操作说明
  - 设备档案
  - 远端 OpenClaw 侧说明
- `source/tools/printer_bridge/`
  - bridge 配置
  - 本地服务端和 connector
  - 远端部署脚本
  - 单次打印入口
  - launchd 安装脚本
  - OpenClaw 远端插件定义

## 6. 建议阅读顺序

如果你要理解“仓库里有没有 Mi Printer 设置”，建议按下面顺序看：

1. [source/docs/printer-bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/docs/printer-bridge/README.md)
2. [source/docs/printer-bridge/device-profile.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/docs/printer-bridge/device-profile.json)
3. [source/tools/printer_bridge/bridge_config.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/tools/printer_bridge/bridge_config.json)
4. [source/tools/printer_bridge/bridge_server.py](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/tools/printer_bridge/bridge_server.py)
5. [source/tools/printer_bridge/print_image.py](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/tools/printer_bridge/print_image.py)
6. [source/tools/printer_bridge/openclaw_printer_plugin/openclaw.plugin.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-printer-bridge-pack/source/tools/printer_bridge/openclaw_printer_plugin/openclaw.plugin.json)

## 7. 使用这份导出包时最重要的判断

如果目的是“确认仓库里有没有 Mi Printer 设置”，答案是有。

如果目的是“沿着当前最完整的路径继续做”，重点不是单看 CUPS 队列，而是要同时看：

- 本地 `bridge_server.py`
- 本地 `connector_loop.py`
- 远端 `openclaw_printer_plugin/`
- 编排入口 `bootstrap_stack.py` 和 `up.sh`

如果目的是“快速启动并恢复链路”，优先看：

- `source/docs/printer-bridge/README.md`
- `source/tools/printer_bridge/up.sh`
- `source/tools/printer_bridge/print_image.py`
- `source/tools/printer_bridge/install_launchd.py`

## 8. 原始来源

这些文件来自当前仓库中的原始路径：

- [docs/printer-bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/docs/printer-bridge)
- [tools/printer_bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/printer_bridge)
