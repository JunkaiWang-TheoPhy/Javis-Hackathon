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
QUEUE_HELPER = ROOT / "queue_bridge_admin.py"
REMOTE_ALIAS = "devbox"
REMOTE_EXTENSION_DIR = f"/home/devbox/.openclaw/extensions/{PLUGIN_ID}"
REMOTE_CONFIG_PATH = "/home/devbox/.openclaw/openclaw.json"
REMOTE_WORKSPACE_DIR = "/home/devbox/.openclaw/workspace"
REMOTE_QUEUE_ROOT = "/home/devbox/.openclaw/printer-bridge-queue"
OPENCLAW_BIN = "/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw"
DEFAULT_RESPONSE_TIMEOUT_MS = 45000
STAGED_SSH_IDENTITY_FILE = Path(
    os.environ.get(
        "OPENCLAW_PRINTER_BRIDGE_SSH_IDENTITY_FILE",
        str(Path.home() / ".openclaw-printer-bridge" / "runtime" / "devbox_ssh_identity"),
    )
)


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def resolve_ssh_setting(remote_alias: str, key: str) -> str:
    result = subprocess.run(
        ["ssh", "-G", remote_alias],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return ""
    for line in result.stdout.splitlines():
        if line.startswith(f"{key} "):
            return line.split(" ", 1)[1].strip()
    return ""


def build_ssh_command(remote_alias: str, remote_command: str) -> list[str]:
    return [
        "ssh",
        "-F",
        "/dev/null",
        "-p",
        resolve_ssh_setting(remote_alias, "port") or "22",
        "-l",
        resolve_ssh_setting(remote_alias, "user") or os.environ.get("USER", "devbox"),
        "-i",
        str(STAGED_SSH_IDENTITY_FILE),
        "-o",
        "IdentitiesOnly=yes",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=10",
        resolve_ssh_setting(remote_alias, "hostname") or remote_alias,
        remote_command,
    ]


def build_scp_command(remote_alias: str, sources: list[str], destination_dir: str) -> list[str]:
    remote_user = resolve_ssh_setting(remote_alias, "user") or os.environ.get("USER", "devbox")
    remote_host = resolve_ssh_setting(remote_alias, "hostname") or remote_alias
    remote_port = resolve_ssh_setting(remote_alias, "port") or "22"
    return [
        "scp",
        "-P",
        remote_port,
        "-i",
        str(STAGED_SSH_IDENTITY_FILE),
        "-o",
        "IdentitiesOnly=yes",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=10",
        *sources,
        f"{remote_user}@{remote_host}:{destination_dir}/",
    ]


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


def build_remote_patch_script(
    *,
    queue_root: str,
    response_timeout_ms: int,
    local_host: dict[str, str],
) -> str:
    return f"""
import json
from datetime import datetime, timezone
from pathlib import Path

plugin_id = {PLUGIN_ID!r}
queue_root = {queue_root!r}
response_timeout_ms = {response_timeout_ms!r}
local_host = {local_host!r}
config_path = Path({REMOTE_CONFIG_PATH!r})
backup_path = config_path.with_name(
    f"openclaw.json.bak.{{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}}"
)
backup_path.write_text(config_path.read_text(encoding='utf-8'), encoding='utf-8')
config = json.loads(config_path.read_text(encoding='utf-8'))

tools = config.setdefault('tools', {{}})
tools_allow = tools.setdefault('allow', [])
if plugin_id not in tools_allow:
    tools_allow.append(plugin_id)
if 'openclaw-printer-bridge' in tools_allow:
    tools_allow.remove('openclaw-printer-bridge')

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
        'queueRoot': queue_root,
        'responseTimeoutMs': response_timeout_ms,
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

queue_path = Path(queue_root)
for name in ('pending', 'claimed', 'responses', 'heartbeats'):
    (queue_path / name).mkdir(parents=True, exist_ok=True)

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
    f"- remote queue root: {{queue_root}}\\n"
    '- bridge transport: devbox-local request queue consumed by the Mac connector over SSH\\n\\n'
    '## Local Automation\\n\\n'
    '- launchd keeps the local bridge process alive on the Mac host.\\n'
    '- launchd keeps the local connector alive so it can poll the devbox queue and return results.\\n'
    '- launchd also reruns bridge sync periodically so the current queue-backed config stays deployed to OpenClaw.\\n\\n'
    '## Rules\\n\\n'
    '- All printing must go through the printer bridge plugin.\\n'
    '- Prefer the printer tools over raw web fetches: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`.\\n'
    '- Do not mention queue internals, bridge tokens, Authorization headers, API keys, unauthorized, 401, or restart instructions to the user.\\n'
    '- If a printer bridge call fails, say printing is temporarily unavailable and check `printer_get_status` next.\\n'
    '- If the connector is offline, report failure instead of pretending the print succeeded.\\n',
    encoding='utf-8'
)

tools_path = workspace / 'TOOLS.md'
section = (
    '\\n## Printer Bridge\\n\\n'
    f"- local macOS bridge host: `{{local_host['computer_name']}}`\\n"
    '- local macOS default printer: `Mi Wireless Photo Printer 1S [6528]`\\n'
    '- queue name: `Mi_Wireless_Photo_Printer_1S__6528_`\\n'
    '- default 3-inch media: `3x3.Fullbleed`\\n'
    f'- remote queue root: `{{queue_root}}`\\n'
    '- local automation: `launchd` bridge keepalive + connector keepalive + periodic sync\\n'
    '- OpenClaw printer tools: `printer_get_status`, `printer_print_image`, `printer_print_pdf`, `printer_cancel_job`\\n'
    '- The queue is local to devbox; the Mac connector polls it over SSH and returns results back into the same queue\\n'
    '- Do not tell users about queue internals, bridge tokens, unauthorized, 401, API keys, or restart steps\\n'
    '- If the printer bridge fails, say printing is temporarily unavailable, then inspect status through the printer tools\\n'
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
    parser.add_argument("--queue-root", default=REMOTE_QUEUE_ROOT, help="Remote queue root used by the printer bridge plugin")
    parser.add_argument("--skip-restart", action="store_true", help="Skip `openclaw gateway restart` after copying files and patching config")
    args = parser.parse_args()

    local_host = read_local_host_metadata()

    if not shutil.which("ssh") or not shutil.which("scp"):
        raise RuntimeError("ssh and scp must both be installed")

    run(build_ssh_command(args.remote, f"mkdir -p {shlex.quote(REMOTE_EXTENSION_DIR)}"))
    run(
        build_scp_command(
            args.remote,
            [
                str(PLUGIN_DIR / "openclaw.plugin.json"),
                str(PLUGIN_DIR / "package.json"),
                str(PLUGIN_DIR / "index.mjs"),
                str(QUEUE_HELPER),
            ],
            REMOTE_EXTENSION_DIR,
        )
    )

    remote_script = build_remote_patch_script(
        queue_root=args.queue_root,
        response_timeout_ms=DEFAULT_RESPONSE_TIMEOUT_MS,
        local_host=local_host,
    )
    encoded = base64.b64encode(remote_script.encode("utf-8")).decode("ascii")
    remote_python = "import base64; exec(base64.b64decode({!r}).decode())".format(encoded)
    run(
        build_ssh_command(args.remote, "python3 -c {}".format(shlex.quote(remote_python)))
    )

    if not args.skip_restart:
        run(build_ssh_command(args.remote, f"{OPENCLAW_BIN} gateway restart"))
    print(f"Deployed {PLUGIN_ID} to {args.remote} using queue root {args.queue_root}")


if __name__ == "__main__":
    main()
