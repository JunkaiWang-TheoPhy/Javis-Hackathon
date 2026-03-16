# OpenClaw Devbox Sync Manifest

Synced from the cloud devbox on `2026-03-16`.
Transfer method: `tar` over SSH, because the remote devbox does not have `rsync` installed.

## Result

- Local mirror root: `openclaw/devbox/`
- Mirror size after sync: about `11M`
- Mirror file count after sync: `720`

## Included

- `/home/devbox/.openclaw/workspace/`
- `/home/devbox/.openclaw/extensions/`
- `/home/devbox/.openclaw/extensions-disabled/openclaw-printer-bridge-20260315/`
- `/home/devbox/.openclaw/agents/main/`
- `/home/devbox/.openclaw/memory/`
- `/home/devbox/.openclaw/devices/`
- `/home/devbox/.openclaw/identity/`
- `/home/devbox/.openclaw/cron/jobs.json`
- `/home/devbox/.openclaw/openclaw.json`
- `/home/devbox/.openclaw/lingzhu-public/`
- `/home/devbox/project/openclaw-ha-blueprint-memory/`
- `/home/devbox/project/Openclaw-With-Apple/`

## Excluded

- OpenClaw core runtime / binaries
- `node_modules/`
- `.next/`
- `.git/`
- `.cache/`
- `.venv/`
- `logs/`
- `*.log`
- `*.pid`
- `*.tmp`
- `*.bak*`
- printer queue and other transient runtime artifacts
- large bundled binaries such as `cloudflared`
- unrelated utility repositories such as `cc-switch`
