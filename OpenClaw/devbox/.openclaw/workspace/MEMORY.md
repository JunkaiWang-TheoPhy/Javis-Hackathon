# Mira Long-Term Memory

## Stable Facts
- 晚上提醒我时更轻一点。 (updated 2026-03-18)

## Feishu Integration
- 用户的飞书 open_id: `ou_d3910e3b5e12b162c8bdae01eeab5c7b`
- 创建了 `feishu-send-message` skill，位于 `~/.openclaw/workspace/skills/feishu-send-message/`
- 使用方法：`node scripts/send_message.js <open_id> "消息文本" [图片路径]`
- 脚本会自动从 `~/.openclaw/openclaw.json` 读取飞书机器人配置
- 可以发送文本消息和图片消息 (updated 2026-03-15)
