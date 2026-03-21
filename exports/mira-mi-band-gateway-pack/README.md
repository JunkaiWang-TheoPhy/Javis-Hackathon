# Mira Mi Band Gateway Pack

## Quick Links

- [README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/README.md)
- [FILE_INDEX.txt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/FILE_INDEX.txt)
- [source/devices/mi-band-9-pro/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/devices/mi-band-9-pro/README.md)
- [source/tools/mi_band_desktop_bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/tools/mi_band_desktop_bridge/README.md)

## 1. 这个导出包是什么

这个文件夹把当前 `Javis-Hackathon` 仓库里和 `Mi Band gateway` 相关的资料单独抽了出来，方便后续迁移、复查或给另一个仓库里的 Codex 重新建立上下文。

它不是完整 release repo，也不是一个一键安装器。它的作用是把和 `Mi Band 9 Pro -> Xiaomi 12X -> gateway/bridge -> devbox OpenClaw` 有关的稳定文件集中到一个地方。

## 2. 仓库里是否有 Mi Band gateway 设置

有，而且是成体系的。

当前仓库里至少存在两条相关链路：

- 旧的 Android gateway app 路径
- 当前推荐的 desktop `adb` bridge 路径

两条路径都已经有文档、配置、脚本和部分实现文件，不是单纯的构想说明。

## 3. 当前推荐链路

当前仓库文档明确给出的推荐路径是：

```text
Mi Band 9 Pro -> Xiaomi 12X -> adb collector on this Mac -> local HTTP bridge -> devbox OpenClaw
```

原因也写得很清楚：

- 旧的 Android gateway app 在当前 `Xiaomi 12X / HyperOS` 组合上，能稳定暴露连接状态
- 但它还不能稳定返回非空健康指标
- 桌面侧 `adb` bridge 已经验证过能返回非空指标，并可继续桥接给远端 `devbox`

## 4. 关键设置摘要

- 手环名称：`Xiaomi Smart Band 9 Pro A094`
- 手环 MAC：`D0:AE:05:0D:A0:94`
- 手环 DID：`940134049`
- 手环型号：`miwear.watch.n67cn`
- 手环固件：`3.1.171`
- 手机型号：`Xiaomi 12X`
- 手机 ADB serial：`4722a997`
- Android gateway 端口：`8765`
- Android gateway 桌面暴露方式：`adb reverse tcp:8765 tcp:8765` / `adb forward tcp:8765 tcp:8765`
- Desktop bridge 监听地址：`127.0.0.1:9782`
- Desktop bridge token 环境变量：`OPENCLAW_MI_BAND_BRIDGE_TOKEN`
- Desktop bridge ADB target 环境变量：`OPENCLAW_MI_BAND_ADB_TARGET`
- OpenClaw 远端插件 ID：`mi-band-bridge`
- OpenClaw 插件默认 bridge URL：`http://127.0.0.1:9782`
- 无线 ADB 支持已在代码中存在，但默认仍是：
  - `wireless_adb.enabled = false`
  - 当前已验证活动链路仍是 `usb`

## 5. 导出内容结构

这个 bundle 主要分成两部分：

- `source/devices/mi-band-9-pro/`
  - 设备档案、连接说明、进展记录
  - 旧 Android gateway app 的桌面侧用法
  - Android app 内部的 `BandConfig.kt`
- `source/tools/mi_band_desktop_bridge/`
  - 当前推荐的桌面桥接实现
  - bridge 配置、服务端、客户端、远端部署脚本
  - 远端 OpenClaw 插件定义

## 6. 建议阅读顺序

如果你要理解“仓库里有没有 Mi Band gateway 设置”，建议按下面顺序看：

1. [source/devices/mi-band-9-pro/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/devices/mi-band-9-pro/README.md)
2. [source/devices/mi-band-9-pro/device-profile.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/devices/mi-band-9-pro/device-profile.json)
3. [source/tools/mi_band_desktop_bridge/README.md](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/tools/mi_band_desktop_bridge/README.md)
4. [source/tools/mi_band_desktop_bridge/bridge_config.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/tools/mi_band_desktop_bridge/bridge_config.json)
5. [source/devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/BandConfig.kt](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/BandConfig.kt)
6. [source/tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/exports/mira-mi-band-gateway-pack/source/tools/mi_band_desktop_bridge/openclaw_band_plugin/openclaw.plugin.json)

## 7. 使用这份导出包时最重要的判断

如果目的是“确认仓库里有没有 Mi Band gateway 设置”，答案是有。

如果目的是“照着当前最可用的路径继续做”，优先看 desktop bridge，而不是只看旧 Android gateway app。

如果目的是“追 Android app 为何目前还是 null metrics”，重点看：

- `source/devices/mi-band-9-pro/progress-2026-03-15.md`
- `source/devices/mi-band-9-pro/gateway/desktop/README.md`
- `source/devices/mi-band-9-pro/gateway/android-app/app/src/main/java/com/javis/wearable/gateway/BandConfig.kt`

## 8. 原始来源

这些文件来自当前仓库中的原始路径：

- [devices/mi-band-9-pro](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/devices/mi-band-9-pro)
- [tools/mi_band_desktop_bridge](/Users/thomasjwang/Documents/GitHub/Javis-Hackathon/tools/mi_band_desktop_bridge)
