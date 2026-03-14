# Devbox And OpenClaw Info

Sensitive file. Contains connection details and gateway credentials.

Last updated: 2026-03-14

## SSH / Remote Server

- SSH alias: `devbox`
- Host: `hzh.sealos.run`
- Port: `2233`
- User: `devbox`
- Authentication: SSH private key
- SSH password: none (key-based login)
- Private key path: `/Users/thomasjwang/Documents/GitHub/Projects/Mira/hzh.sealos.run_ns-lijecm20_devbox`
- Direct command:

```bash
ssh -i /Users/thomasjwang/Documents/GitHub/Projects/Mira/hzh.sealos.run_ns-lijecm20_devbox devbox@hzh.sealos.run -p 2233
```

- Via local SSH config:

```bash
ssh devbox
```

## Server Overview

- Hostname: `devbox`
- OS: `Debian GNU/Linux 12 (bookworm)`
- Architecture: `x86_64`
- Main home directory: `/home/devbox`
- Main project directory: `/home/devbox/project`

### Important Paths

```text
/home/devbox/project
/home/devbox/.openclaw
/home/devbox/.openclaw/workspace
/tmp/openclaw/openclaw-2026-03-14.log
```

### OpenClaw Workspace Structure

```text
/home/devbox/.openclaw
├── openclaw.json
├── logs/
├── memory/
├── workspace/
│   ├── AGENTS.md
│   ├── BOOTSTRAP.md
│   ├── HEARTBEAT.md
│   ├── IDENTITY.md
│   ├── SOUL.md
│   ├── TOOLS.md
│   └── USER.md
└── ...
```

## OpenClaw Access

- CLI path: `/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw`
- Config file: `~/.openclaw/openclaw.json`
- Version: `2026.3.12`
- Config last touched at: `2026-03-14T07:28:27.849Z`
- Gateway port: `18789`
- Gateway bind mode: `loopback`
- Gateway auth mode: `token`
- Tools profile: `coding`
- Web search enabled: `false`
- Feishu enabled: `true`
- Feishu default account: `main`
- Agent workspace: `/home/devbox/.openclaw/workspace`

### OpenClaw Credentials

- Gateway password: none
- Gateway token:

```text
722864936c4a1c67c72470321c3720ee48149dd4401632b2
```

### URLs

- Dashboard base URL: `http://127.0.0.1:18789/`
- Dashboard status URL: `http://127.0.0.1:18789/status`
- Health URL: `http://127.0.0.1:18789/health`
- WebSocket RPC URL: `ws://127.0.0.1:18789`
- Tokenized dashboard URL:

```text
http://127.0.0.1:18789/#token=722864936c4a1c67c72470321c3720ee48149dd4401632b2
```

Treat the tokenized URL like a password.

## Access From Local Machine

### Browser Access Through SSH Tunnel

```bash
ssh -L 18789:127.0.0.1:18789 devbox
```

Then open:

```text
http://127.0.0.1:18789/
```

If auth is required, use the tokenized dashboard URL above after the tunnel is active.

### Terminal / CLI Access

Interactive shell:

```bash
ssh devbox
```

Non-interactive one-shot commands often need the absolute CLI path:

```bash
ssh devbox '/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw gateway status'
ssh devbox '/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw dashboard --no-open'
ssh devbox '/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw health'
```

If shell init is loaded, this also works:

```bash
ssh devbox 'bash -lc "openclaw gateway status"'
```

## Useful Commands

```bash
# SSH
ssh devbox

# OpenClaw health
curl http://127.0.0.1:18789/health

# Print dashboard URL
/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw dashboard --no-open

# Inspect gateway status
/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw gateway status

# Validate config
/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw config validate

# Inspect the active config path
/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw config file

# Tail runtime log
tail -f /tmp/openclaw/openclaw-2026-03-14.log

# Tail config audit log
tail -f ~/.openclaw/logs/config-audit.jsonl
```

## Notes

- SSH login is key-based, not password-based.
- OpenClaw dashboard is reachable locally on the server because the gateway binds to loopback only.
- For browser access from the Mac, SSH port forwarding is the safest default.
- The current environment is a container-like setup where `systemctl --user` is not available, so service-style gateway control may be limited.
