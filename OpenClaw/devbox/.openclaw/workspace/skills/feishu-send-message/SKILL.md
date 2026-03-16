---
name: feishu-send-message
description: |
  Send text messages and images to Feishu/Lark via the configured bot. Use when: (1) need to send notifications or messages to Feishu, (2) need to send images to Feishu, (3) user asks to "send to Feishu" or "notify via Feishu", (4) need to deliver results or updates through Feishu messaging.
---

# Feishu Message Sender

Send text and image messages to Feishu using the configured bot credentials.

## Prerequisites

- Feishu bot must be configured in `~/.openclaw/openclaw.json` under `channels.feishu.accounts.main`
- Recipient's `open_id` must be known (usually from `allowFrom` list in config)

## Getting Recipient Open ID

The recipient's `open_id` can be found in the OpenClaw config:

```bash
cat ~/.openclaw/openclaw.json | grep -A 5 '"allowFrom"'
```

Look for entries like `ou_xxxxxxxxxxxxxxxxxxxxxxxx`.

## Usage

### Send Text Message

```bash
node scripts/send_message.js <open_id> "Your message text"
```

Example:
```bash
node scripts/send_message.js ou_d3910e3b5e12b162c8bdae01eeab5c7b "Hello from OpenClaw!"
```

### Send Text + Image

```bash
node scripts/send_message.js <open_id> "Your message text" /path/to/image.jpg
```

Example:
```bash
node scripts/send_message.js ou_d3910e3b5e12b162c8bdae01eeab5c7b "Check out this photo!" /tmp/photo.jpg
```

## How It Works

1. Reads Feishu bot credentials from `~/.openclaw/openclaw.json`
2. Obtains `tenant_access_token` using app credentials
3. Sends text message via Feishu IM API
4. If image provided: uploads image first, then sends image message

## Common Use Cases

- Notify user about completed tasks
- Send generated images or screenshots
- Deliver analysis results
- Send reminders or alerts

## Error Handling

The script will exit with error code 1 and print error message if:
- Config file not found or missing Feishu configuration
- Invalid `open_id` (user not found)
- Network errors
- API errors

## Notes

- The script uses `tenant_access_token` (bot identity), not user tokens
- Messages are sent as the bot, not as a specific user
- Image must be a valid image file (JPEG, PNG, etc.)
- Maximum image size depends on Feishu API limits
