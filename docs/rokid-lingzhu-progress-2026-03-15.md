# Rokid Lingzhu Progress 2026-03-15

Last checked: 2026-03-15

## Summary

The cloud devbox already has the OpenClaw `lingzhu` plugin installed and running.
The bridge is reachable locally at `/metis/agent/api/sse`, chat completions are enabled, and a public HTTPS tunnel is currently working for Lingzhu platform testing.

## Completed

- `Lingzhu Skill` installed on the devbox at `~/.openclaw/extensions/lingzhu`
- OpenClaw gateway restarted and plugin loaded successfully
- `gateway.http.endpoints.chatCompletions.enabled = true`
- Local health check works:
  - `http://127.0.0.1:18789/metis/agent/api/health`
- Public health check works through the current tunnel:
  - `https://qualify-federal-visible-obj.trycloudflare.com/metis/agent/api/health`
- Minimal end-to-end SSE request returned a normal answer stream
- Lingzhu AK already exists and is persisted locally at:
  - `~/.openclaw/extensions/.lingzhu.ak`

## Current Fill Values

Use these values in the Lingzhu platform custom agent form.

- Third-party vendor: `自定义智能体`
- Custom agent URL:

```text
https://qualify-federal-visible-obj.trycloudflare.com/metis/agent/api/sse
```

- Custom agent AK:
  - Do not commit this to the repo
  - Read it from the devbox when needed:

```bash
ssh devbox 'cat ~/.openclaw/extensions/.lingzhu.ak'
```

- Input type: `文字`
- Suggested agent name: `Javis`
- Suggested category: `生活`
- Suggested description:

```text
一个部署在 Rokid 眼镜上的智能助手，可以帮我拍照、发起导航、管理日程提醒，并回答日常问题。常见指令包括：帮我拍一张照片、导航到公司、提醒我明天下午三点开会、退出智能体。
```

## Still Pending

- Create the custom agent in the Lingzhu platform
- Test it in `RokidAI App -> 设置 -> 开发者 -> 智能体调试`
- Test it on the glasses
- Replace the temporary `trycloudflare` URL with a stable public domain or named tunnel before treating this as durable setup

## Notes

- The OpenClaw gateway itself still binds to `127.0.0.1:18789`, so the Lingzhu platform must use the public HTTPS tunnel instead of a direct `http://公网IP:18789/...` URL.
- The current `trycloudflare` URL is temporary and may change after tunnel restart.
- Do not click `提审` before local app and glasses testing is stable.

## Recheck Commands

```bash
ssh devbox '/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw lingzhu doctor'
ssh devbox 'curl -sS http://127.0.0.1:18789/metis/agent/api/health'
ssh devbox 'cat ~/.openclaw/lingzhu-public/current_url.txt'
```
