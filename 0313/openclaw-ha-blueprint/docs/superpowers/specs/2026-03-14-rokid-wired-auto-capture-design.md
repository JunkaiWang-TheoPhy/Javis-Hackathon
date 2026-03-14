# Rokid Wired Auto Capture Design

## Goal

提供一个基于 ADB 的本地脚本，在有线连接场景下每 30 秒触发一次 Rokid 眼镜拍照，共执行 10 次，并把每次新增的照片拉回本机。

## Constraints

- 只走 PDF 中的 ADB 思路，不依赖 Android SDK 或自定义 APK。
- 设备必须已经通过 USB 连接，并且相机界面处于前台。
- 需要在本机保存实际拍到的文件，而不是只发送快门指令。

## Options

### Option 1: 只循环发送 `adb shell input keyevent 27`

优点：
- 实现最简单。

缺点：
- 无法确认照片是否真的生成。
- 不会把照片拉回本机，不满足需求。

### Option 2: 每轮快门后直接 `adb pull /sdcard/DCIM/Camera`

优点：
- 能把照片拉回本机。

缺点：
- 每次都会重复拉全量目录。
- 会带来重复文件、速度慢、输出难以管理。

### Option 3: 每轮快门前后比对最新照片，再只拉新增文件

优点：
- 满足“有线 + 每 30 秒 + 10 次 + 保存到本地”。
- 只拉本轮新增照片，结果清晰。
- 可以对拍照失败做超时提示。

缺点：
- 需要一点轮询逻辑。

## Recommendation

采用 Option 3。

脚本职责：
- 检查 `adb` 是否存在且设备在线。
- 在每次触发快门前记录远端相册中最新文件。
- 发送 `input keyevent 27`。
- 轮询 `/sdcard/DCIM/Camera`，检测到新文件后只拉这一张到本地输出目录。
- 共执行 10 轮，每轮间隔 30 秒。

## File Plan

- 新增 `scripts/rokid-wired-photo-capture.sh`
  - 主脚本，负责设备检查、拍照、轮询远端文件、拉回本地。
- 新增 `scripts/tests/rokid-wired-photo-capture.test.sh`
  - 通过 fake adb 验证脚本行为。
- 更新 `README.md`
  - 补充脚本用途、运行方式和前置条件。

## Error Handling

- 未找到 `adb`：直接退出并提示。
- 没有在线设备：直接退出并提示。
- 某轮拍照后未检测到新文件：该轮报错并退出，避免误以为拍照成功。
- `adb pull` 失败：直接退出，保留已下载文件。

## Verification

- 用 fake adb 跑自动化测试，验证：
  - 脚本会执行固定次数。
  - 只拉新增图片到本地。
  - 本地输出目录中出现预期数量的文件。
