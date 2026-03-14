# Rokid Android Companion

这是一个按 Rokid 官方 `CXR-M 1.0.9` 文档生成的最小 Android Kotlin 示例。

## 已接入内容

- Rokid Maven 仓库
- `com.rokid.cxr:client-m:1.0.9`
- 官方文档要求的基础权限
- `Client Secret` 与 `SN .lc` 文件的占位配置
- `CxrApi.getInstance().initBluetooth(...)`
- `CxrApi.getInstance().connectBluetooth(...)`
- `CxrApi.getInstance().isBluetoothConnected`

## 本地前提

- `JAVA_HOME` 已配置
- `ANDROID_SDK_ROOT` 已配置
- 已安装 `platform-tools`
- 已安装 `build-tools;35.0.0`
- 已安装 `platforms;android-36`

## 需要你手动替换的内容

1. 编辑 `gradle.properties`：
   - `rokid.clientSecret=你的 Client Secret`
2. 把 Rokid 控制台下载的 `.lc` 文件放到：
   - `app/src/main/res/raw/`
3. 把 `gradle.properties` 里的 `rokid.snResource` 改成不带扩展名的资源名：
   - 例如文件 `sn_abc123.lc`
   - 则填写 `rokid.snResource=sn_abc123`

## 构建

如果本机的 Gradle 版本与官方样例不完全一致，优先使用 wrapper：

```bash
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
```

也可以直接使用本机 Gradle：

```bash
gradle :app:testDebugUnitTest
gradle :app:assembleDebug
```

## 官方参考

- 文档页：`03 快速开始` 与 `设备蓝牙连接`
- 官方样例压缩包：
  `/Users/thomasjwang/Downloads/rokid-sdk-official/cxr-m/1.0.9/CXRMSamples-109.zip`
