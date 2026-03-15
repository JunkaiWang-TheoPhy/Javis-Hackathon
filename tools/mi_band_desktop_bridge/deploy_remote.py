#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import secrets
import shlex
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PLUGIN_ID = "mi-band-bridge"
PLUGIN_DIR = ROOT / "openclaw_band_plugin"
LOCAL_ENV_FILE = Path.home() / ".openclaw-mi-band-bridge.env"
LOCAL_TUNNEL_STATE_FILE = Path.home() / ".openclaw-mi-band-bridge-tunnel.json"
REMOTE_ALIAS = "devbox"
REMOTE_EXTENSION_DIR = f"/home/devbox/.openclaw/extensions/{PLUGIN_ID}"
REMOTE_CONFIG_PATH = "/home/devbox/.openclaw/openclaw.json"
REMOTE_WORKSPACE_DIR = "/home/devbox/.openclaw/workspace"
OPENCLAW_BIN = "/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw"
DEFAULT_BRIDGE_URL = "http://127.0.0.1:9782"


def ensure_bridge_token() -> str:
    if os.environ.get("OPENCLAW_MI_BAND_BRIDGE_TOKEN"):
        return os.environ["OPENCLAW_MI_BAND_BRIDGE_TOKEN"]
    if LOCAL_ENV_FILE.is_file():
        for line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
            if line.startswith("export OPENCLAW_MI_BAND_BRIDGE_TOKEN="):
                token = line.split("=", 1)[1].strip().strip('"')
                if token:
                    return token

    token = secrets.token_hex(32)
    LOCAL_ENV_FILE.write_text(
        f'export OPENCLAW_MI_BAND_BRIDGE_TOKEN="{token}"\n',
        encoding="utf-8",
    )
    return token


def read_bridge_url(explicit_url: str | None = None) -> str:
    if explicit_url:
        return explicit_url
    if os.environ.get("OPENCLAW_MI_BAND_BRIDGE_URL"):
        return os.environ["OPENCLAW_MI_BAND_BRIDGE_URL"]
    if LOCAL_TUNNEL_STATE_FILE.is_file():
        payload = json.loads(LOCAL_TUNNEL_STATE_FILE.read_text(encoding="utf-8"))
        public_url = payload.get("public_url") or payload.get("bridge_url")
        if public_url:
            return str(public_url)
    return DEFAULT_BRIDGE_URL


def read_local_host_metadata() -> dict[str, str]:
    def read_output(command: list[str], fallback: str) -> str:
        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            return fallback
        value = result.stdout.strip()
        return value or fallback

    return {
        "computer_name": read_output(["scutil", "--get", "ComputerName"], "local macOS machine"),
        "local_host_name": read_output(["scutil", "--get", "LocalHostName"], "unknown"),
        "hostname": read_output(["hostname"], "unknown"),
    }


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def build_remote_patch_script(token: str, bridge_url: str, local_host: dict[str, str]) -> str:
    return f"""
import json
from datetime import datetime, timezone
from pathlib import Path

plugin_id = {PLUGIN_ID!r}
token = {token!r}
bridge_url = {bridge_url!r}
local_host = {local_host!r}
config_path = Path({REMOTE_CONFIG_PATH!r})
backup_path = config_path.with_name(
    f"openclaw.json.bak.{{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}}"
)
backup_path.write_text(config_path.read_text(encoding='utf-8'), encoding='utf-8')
config = json.loads(config_path.read_text(encoding='utf-8'))

plugins = config.setdefault('plugins', {{}})
allow = plugins.setdefault('allow', [])
if plugin_id not in allow:
    allow.append(plugin_id)

entries = plugins.setdefault('entries', {{}})
entries[plugin_id] = {{
    'enabled': True,
    'config': {{
        'bridgeBaseUrl': bridge_url,
        'bridgeToken': token
    }}
}}

installs = plugins.setdefault('installs', {{}})
installs[plugin_id] = {{
    'source': 'path',
    'sourcePath': {REMOTE_EXTENSION_DIR!r},
    'installPath': {REMOTE_EXTENSION_DIR!r},
    'version': '1.0.0',
    'installedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
}}

config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')

workspace = Path({REMOTE_WORKSPACE_DIR!r})
bridge_doc = workspace / 'MI_BAND_BRIDGE.md'
bridge_doc.write_text(
    '# MI_BAND_BRIDGE.md\\n\\n'
    '## Local Mi Band Bridge\\n\\n'
    f"- bridge host: {{local_host['computer_name']}}\\n"
    f"- local host name: {{local_host['local_host_name']}}\\n"
    f"- local hostname: {{local_host['hostname']}}\\n"
    '- source device: Xiaomi 12X over adb\\n'
    '- source band: Xiaomi Smart Band 9 Pro A094\\n'
    '- metrics: heart rate, SpO2, steps, distance, calories\\n'
    '- transport: public HTTPS tunnel to local loopback bridge\\n'
    '- success means the local bridge returned data from adb-derived Xiaomi Fitness evidence\\n\\n'
    '## Rules\\n\\n'
    '- Never call the bridge URL directly with exec, curl, wget, or raw HTTP.\\n'
    '- The bridge requires an Authorization header that is only wired inside the plugin config.\\n'
    '- Always use the OpenClaw tools `band_get_status`, `band_get_latest`, `band_get_events`, or `band_get_alerts`.\\n'
    '- If you need current metrics, call `band_get_latest` first.\\n'
    '- Do not tell users about bridge tokens, Authorization headers, API keys, unauthorized, 401, or restart instructions.\\n'
    '- If a bridge call fails, say the latest band data is temporarily unavailable and check `band_get_status` next.\\n'
    '- If `band_get_latest` fails, call `band_get_status` next instead of guessing URLs.\\n',
    encoding='utf-8'
)

tools_path = workspace / 'TOOLS.md'
section = (
    '\\n## Mi Band Bridge\\n\\n'
    '- Use the Mi Band bridge plugin for read-only health data from the local macOS bridge.\\n'
    '- Never use exec, curl, wget, or raw HTTP against the bridge URL directly.\\n'
    '- The bridge auth token is private and is only injected through the plugin config.\\n'
    '- Source path: Xiaomi 12X via adb, not direct server-side BLE.\\n'
    '- Preferred call order: `band_get_latest` first, then `band_get_status` if needed.\\n'
    '- Do not tell users about bridge tokens, unauthorized, 401, API keys, or restart steps.\\n'
    '- If the band bridge fails, say the latest band data is temporarily unavailable, then inspect status through the bridge tools.\\n'
    '- Tools: `band_get_status`, `band_get_latest`, `band_get_events`, `band_get_alerts`.\\n'
)
current_tools = tools_path.read_text(encoding='utf-8')
if '## Mi Band Bridge' in current_tools:
    before, _sep, _after = current_tools.partition('\\n## Mi Band Bridge\\n')
    tools_path.write_text(before.rstrip() + section + '\\n', encoding='utf-8')
else:
    tools_path.write_text(current_tools.rstrip() + '\\n' + section + '\\n', encoding='utf-8')
"""


def main() -> None:
    cli = argparse.ArgumentParser(description="Deploy the Mi Band bridge plugin to the remote OpenClaw host.")
    cli.add_argument("--remote", default=REMOTE_ALIAS, help="SSH alias for the remote OpenClaw host")
    cli.add_argument("--bridge-url", help="Explicit public bridge URL to write into the remote OpenClaw config")
    cli.add_argument("--skip-restart", action="store_true", help="Skip `openclaw gateway restart` after deploy")
    args = cli.parse_args()

    token = ensure_bridge_token()
    bridge_url = read_bridge_url(args.bridge_url)
    local_host = read_local_host_metadata()

    if not shutil.which("ssh") or not shutil.which("scp"):
        raise RuntimeError("ssh and scp must both be installed")

    run(["ssh", args.remote, "mkdir", "-p", REMOTE_EXTENSION_DIR])
    run(
        [
            "scp",
            str(PLUGIN_DIR / "openclaw.plugin.json"),
            str(PLUGIN_DIR / "package.json"),
            str(PLUGIN_DIR / "index.mjs"),
            f"{args.remote}:{REMOTE_EXTENSION_DIR}/",
        ]
    )

    remote_script = build_remote_patch_script(token, bridge_url, local_host)
    encoded = base64.b64encode(remote_script.encode("utf-8")).decode("ascii")
    remote_python = "import base64; exec(base64.b64decode({!r}).decode())".format(encoded)
    run(["ssh", args.remote, "python3 -c {}".format(shlex.quote(remote_python))])

    if not args.skip_restart:
        run(["ssh", args.remote, f"{OPENCLAW_BIN} gateway restart"])
    print(f"Deployed {PLUGIN_ID} to {args.remote} using {bridge_url}")


if __name__ == "__main__":
    main()
