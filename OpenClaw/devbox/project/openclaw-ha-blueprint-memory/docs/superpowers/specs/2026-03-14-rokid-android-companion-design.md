# Rokid Android Companion Design

**Date:** 2026-03-14

## Goal

在现有 `openclaw-ha-blueprint` 仓库中增加一个最小 Android Kotlin companion app，按 Rokid 官方 CXR-M 文档完成：

- 本机 Android 最小开发环境就绪
- 示例工程可本地构建
- 工程已接入 Rokid Maven 仓库与 `com.rokid.cxr:client-m:1.0.9`
- 工程为后续接入 `.lc` SN 鉴权文件和真实设备功能预留清晰入口

## Chosen Approach

选择在 `apps/` 下新增独立 Android 工程 `rokid-android-companion`，而不是修改现有 TypeScript `rokid-companion`。

原因：

- 与仓库现有 companion 语义一致
- 不破坏现有 Node/TypeScript 蓝图
- Android 依赖、Gradle wrapper、SDK 配置和权限声明可以独立管理

## Scope

本次只覆盖 Rokid 官方文档中 `YodaOS-Sprite -> 移动端开发 -> SDK 导入` 这条链路。

明确不做：

- 眼镜端裸机 SDK
- 完整业务场景逻辑
- 真实设备端到端验证
- 开发者账号认证、凭证申请、SN 绑定的人工步骤自动化

## Key Technical Decisions

### Android stack

- Kotlin
- Android Gradle Plugin 8.x
- Gradle wrapper
- JDK 17
- compileSdk / targetSdk 使用当前稳定平台
- minSdk 至少满足官方要求 `28`

### Rokid SDK integration

按官方文档配置：

- Maven 仓库：`https://maven.rokid.com/repository/maven-public/`
- 依赖：`com.rokid.cxr:client-m:1.0.9`

同时保留本机离线备份：

- `~/Downloads/rokid-sdk-official/cxr-m/1.0.9/client-m-1.0.9.aar`

### App structure

- `MainActivity` 仅提供最小 UI
- `RokidSdkConfig` 管理仓库接入说明、`.lc` 文件路径说明和接入状态文本
- `RokidSdkFacade` 作为后续真实 SDK 调用边界

这样本次可以先验证工程结构、依赖解析和测试，不把未知 API 直接散落到 Activity 里。

## Required Manual Follow-up

即使工程接入完成，仍然需要人工完成：

1. Rokid 开发者注册与认证
2. 获取凭证
3. 绑定设备 SN
4. 下载 `.lc` 鉴权文件
5. 按官方功能文档补充真实 SDK 初始化参数

## Verification Targets

- `java -version`
- `gradle -v`
- `sdkmanager --list_installed`
- Android 工程单元测试通过
- Android 工程 debug 构建通过
