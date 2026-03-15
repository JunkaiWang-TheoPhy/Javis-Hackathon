#!/usr/bin/env python3
import argparse
import base64
import json
import os
import shlex
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PLUGIN_ID = "printer-bridge"
PLUGIN_DIR = ROOT / "openclaw_printer_plugin"
LOCAL_ENV_FILE = Path.home() / ".openclaw-printer-bridge.env"
LOCAL_TUNNEL_STATE_FILE = Path.home() / ".openclaw-printer-bridge-tunnel.json"
REMOTE_ALIAS = "devbox"
REMOTE_EXTENSION_DIR = f"/home/devbox/.openclaw/extensions/{PLUGIN_ID}"
REMOTE_CONFIG_PATH = "/home/devbox/.openclaw/openclaw.json"
REMOTE_WORKSPACE_DIR = "/home/devbox/.openclaw/workspace"
OPENCLAW_BIN = "/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw"
DEFAULT_BRIDGE_URL = "http://127.0.0.1:4771"


def read_bridge_token() -> str:
    if os.environ.get("OPENCLAW_PRINTER_BRIDGE_TOKEN"):
        return os.environ["OPENCLAW_PRINTER_BRIDGE_TOKEN"]
    if not LOCAL_ENV_FILE.is_file():
        raise RuntimeError(f"missing bridge env file: {LOCAL_ENV_FILE}")
    for line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("export OPENCLAW_PRINTER_BRIDGE_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    raise RuntimeError("bridge token not found in local env file")


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def read_bridge_url(explicit_url: str | None = None) -> str:
    if explicit_url:
        return explicit_url
    if os.environ.get("OPENCLAW_PRINTER_BRIDGE_URL"):
        return os.environ["OPENCLAW_PRINTER_BRIDGE_URL"]
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
if 'openclaw-printer-bridge' in allow:
    allow.remove('openclaw-printer-bridge')

entries = plugins.setdefault('entries', {{}})
entries.pop('openclaw-printer-bridge', None)
entries[plugin_id] = {{
    'enabled': True,
    'config': {{
        'bridgeBaseUrl': bridge_url,
        'bridgeToken': token,
        'defaultMedia': '3x3.Fullbleed'
    }}
}}

installs = plugins.setdefault('installs', {{}})
installs.pop('openclaw-printer-bridge', None)
installs[plugin_id] = {{
    'source': 'path',
    'sourcePath': {REMOTE_EXTENSION_DIR!r},
    'installPath': {REMOTE_EXTENSION_DIR!r},
    'version': '1.0.0',
    'installedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
}}

config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')

workspace = Path({REMOTE_WORKSPACE_DIR!r})
printer_doc = workspace / 'PRINTER_BRIDGE.md'
printer_doc.write_text(
    '# PRINTER_BRIDGE.md\\n\\n'
    '## Local Printer Bridge\\n\\n'
    f"- bridge host: {{local_host['computer_name']}}\\n"
    f"- local host name: {{local_host['local_host_name']}}\\n"
    f"- local hostname: {{local_host['hostname']}}\\n"
    '- default printer: Mi Wireless Photo Printer 1S [6528]\\n'
    '- queue name: Mi_Wireless_Photo_Printer_1S__6528_\\n'
    '- supported media: 3x3, 3x3.Fullbleed, 4x6, 4x6.Fullbleed\\n'
    '- default three-inch media: 3x3.Fullbleed\\n'
    f"- active bridge URL: {{bridge_url}}\\n"
    '- bridge transport: public HTTPS tunnel to local loopback bridge\\n\\n'
    '## Local Automation\\n\\n'
    '- launchd keeps the local bridge process alive on the Mac host.\\n'
    '- launchd also reruns bridge sync periodically so the current tunnel URL is redeployed to OpenClaw.\\n\\n'
    '## Rules\\n\\n'
    '- All printing must go through the printer bridge plugin.\\n'
    '- Do not treat the bridge root URL as a liveness failure. The root response is informational; `/health` is the liveness endpoint.\\n'
    '- Prefer the printer tools over raw web fetches: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`.\\n'
    '- Success means the job was accepted by the local macOS queue unless the bridge reports more.\\n'
    '- If the bridge is offline, report failure instead of pretending the print succeeded.\\n',
    encoding='utf-8'
)

tools_path = workspace / 'TOOLS.md'
section = (
    '\\n## Printer Bridge\\n\\n'
    f"- local macOS bridge host: `{{local_host['computer_name']}}`\\n"
    '- local macOS default printer: `Mi Wireless Photo Printer 1S [6528]`\\n'
    '- queue name: `Mi_Wireless_Photo_Printer_1S__6528_`\\n'
    '- default 3-inch media: `3x3.Fullbleed`\\n'
    f'- active bridge URL: `{{bridge_url}}`\\n'
    '- local automation: `launchd` bridge keepalive + periodic sync\\n'
    '- OpenClaw printer tools: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`\\n'
    '- Do not treat the bridge root URL as a liveness failure; use `/health` for liveness and the printer tools for real work\\n'
)
current_tools = tools_path.read_text(encoding='utf-8')
if '## Printer Bridge' in current_tools:
    before, _sep, _after = current_tools.partition('\\n## Printer Bridge\\n')
    tools_path.write_text(before.rstrip() + section + '\\n', encoding='utf-8')
else:
    tools_path.write_text(current_tools.rstrip() + '\\n' + section + '\\n', encoding='utf-8')
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy the OpenClaw printer bridge plugin to the remote devbox.")
    parser.add_argument("--remote", default=REMOTE_ALIAS, help="SSH alias for the remote OpenClaw host")
    parser.add_argument("--bridge-url", help="Explicit public bridge URL to write into the remote OpenClaw config")
    parser.add_argument("--skip-restart", action="store_true", help="Skip `openclaw gateway restart` after copying files and patching config")
    args = parser.parse_args()

    token = read_bridge_token()
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
    run(
        [
            "ssh",
            args.remote,
            "python3 -c {}".format(shlex.quote(remote_python)),
        ]
    )

    # openclaw gateway restart
    if not args.skip_restart:
        run(["ssh", args.remote, f"{OPENCLAW_BIN} gateway restart"])
    print(f"Deployed {PLUGIN_ID} to {args.remote} using {bridge_url}")


if __name__ == "__main__":
    main()
