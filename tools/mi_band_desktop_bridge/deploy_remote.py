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
REMOTE_ALIAS = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE_ALIAS", "openclaw-projectsai")
REMOTE_RUNTIME_ROOT = os.environ.get(
    "OPENCLAW_MI_BAND_BRIDGE_REMOTE_RUNTIME_ROOT",
    "/root/mira/.mira-runtime/mira-openclaw",
)
REMOTE_EXTENSION_DIR = os.environ.get(
    "OPENCLAW_MI_BAND_BRIDGE_REMOTE_EXTENSION_DIR",
    "/root/mira/.mira-runtime/mira-openclaw/core/plugins/mi-band-bridge",
)
REMOTE_CONFIG_PATH = os.environ.get(
    "OPENCLAW_MI_BAND_BRIDGE_REMOTE_CONFIG_PATH",
    "/root/mira/.mira-runtime/mira-openclaw/core/openclaw-config/openclaw.local.json",
)
REMOTE_WORKSPACE_DIR = os.environ.get(
    "OPENCLAW_MI_BAND_BRIDGE_REMOTE_WORKSPACE_DIR",
    "/root/mira/.mira-runtime/mira-openclaw/core/workspace",
)
REMOTE_CACHE_FILE_PATH = os.environ.get(
    "OPENCLAW_MI_BAND_BRIDGE_REMOTE_CACHE_FILE_PATH",
    "/root/mira/.mira-runtime/mira-openclaw/openclaw-state/MI_BAND_LATEST.json",
)
DEFAULT_BRIDGE_URL = "http://127.0.0.1:9782"
DEFAULT_POLL_SECONDS = 10
DEFAULT_REQUEST_TIMEOUT_MS = 5000
DEFAULT_FRESH_READ_MAX_WAIT_SECONDS = 60
DEFAULT_FRESH_READ_REQUEST_TIMEOUT_MS = 70000


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


def build_remote_layout(remote_home: str, openclaw_bin: str) -> dict[str, str]:
    openclaw_dir = f"{remote_home}/.openclaw"
    workspace_dir = f"{openclaw_dir}/workspace"
    return {
        "openclaw_dir": openclaw_dir,
        "runtime_root": openclaw_dir,
        "state_dir": openclaw_dir,
        "extension_dir": f"{openclaw_dir}/extensions/{PLUGIN_ID}",
        "config_path": f"{openclaw_dir}/openclaw.json",
        "workspace_dir": workspace_dir,
        "cache_file_path": f"{workspace_dir}/MI_BAND_LATEST.json",
        "openclaw_bin": openclaw_bin,
    }


def infer_runtime_root(config_path: str, state_dir: str) -> Path:
    config = Path(config_path)
    if (
        config.name == "openclaw.local.json"
        and config.parent.name == "openclaw-config"
        and config.parent.parent.name == "core"
    ):
        return config.parent.parent.parent

    state = Path(state_dir)
    if state.name == "openclaw-state":
        return state.parent
    return state.parent


def build_service_layout(
    config_path: str,
    state_dir: str,
    openclaw_bin: str,
    service_unit: str,
    workspace_dir: str | None = None,
) -> dict[str, str]:
    runtime_root = infer_runtime_root(config_path, state_dir)
    resolved_workspace_dir = str(runtime_root / "core" / "workspace")
    if config_path.endswith("/openclaw.json") and workspace_dir:
        resolved_workspace_dir = workspace_dir
    resolved_state_dir = Path(state_dir)
    cache_root = resolved_state_dir if resolved_state_dir.name == "openclaw-state" else runtime_root / "openclaw-state"
    return {
        "openclaw_dir": str(runtime_root),
        "runtime_root": str(runtime_root),
        "state_dir": str(resolved_state_dir),
        "extension_dir": str(runtime_root / "core" / "plugins" / PLUGIN_ID),
        "config_path": config_path,
        "workspace_dir": resolved_workspace_dir,
        "cache_file_path": str(cache_root / "MI_BAND_LATEST.json"),
        "openclaw_bin": openclaw_bin,
        "service_unit": service_unit,
        "restart_command": f"systemctl --user restart {service_unit}",
    }


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def capture_output(command: list[str]) -> str:
    result = subprocess.run(command, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"command failed: {' '.join(command)}")
    return result.stdout.strip()


def probe_remote_runtime(remote: str) -> dict[str, str]:
    remote_home = capture_output(["ssh", remote, "printf %s \"$HOME\""])
    openclaw_bin = capture_output(["ssh", remote, "command -v openclaw"])
    if not remote_home:
        raise RuntimeError(f"could not resolve remote HOME for {remote}")
    if not openclaw_bin:
        raise RuntimeError(f"`openclaw` is not installed or not on PATH for {remote}")

    remote_probe_script = """
import json
import shlex
import subprocess

units = []
result = subprocess.run(
    ['systemctl', '--user', 'list-units', '--type=service', '--state=running', '--no-legend', '--plain'],
    check=False,
    capture_output=True,
    text=True,
)
for line in result.stdout.splitlines():
    parts = line.split()
    if not parts:
        continue
    unit = parts[0]
    if 'openclaw' not in unit or 'gateway' not in unit:
        continue
    show = subprocess.run(
        ['systemctl', '--user', 'show', unit, '-p', 'Environment'],
        check=False,
        capture_output=True,
        text=True,
    )
    env = {}
    payload = show.stdout.strip()
    if payload.startswith('Environment='):
        for item in shlex.split(payload[len('Environment='):]):
            key, sep, value = item.partition('=')
            if sep:
                env[key] = value
    config_path = env.get('OPENCLAW_CONFIG_PATH')
    state_dir = env.get('OPENCLAW_STATE_DIR')
    if not config_path or not state_dir:
        continue
    units.append({
        'service_unit': unit,
        'config_path': config_path,
        'state_dir': state_dir,
    })

print(json.dumps(units))
"""
    encoded = base64.b64encode(remote_probe_script.encode("utf-8")).decode("ascii")
    remote_python = "import base64; exec(base64.b64decode({!r}).decode())".format(encoded)
    service_payload = capture_output(["ssh", remote, "python3 -c {}".format(shlex.quote(remote_python))])
    active_units = json.loads(service_payload or "[]")
    if active_units:
        selected = active_units[0]
        return build_service_layout(
            selected["config_path"],
            selected["state_dir"],
            openclaw_bin,
            selected["service_unit"],
        )

    return build_remote_layout(remote_home, openclaw_bin)


def build_remote_patch_script(
    token: str,
    bridge_url: str,
    local_host: dict[str, str],
    layout: dict[str, str],
) -> str:
    return f"""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

plugin_id = {PLUGIN_ID!r}
token = {token!r}
bridge_url = {bridge_url!r}
local_host = {local_host!r}
config_path = Path({layout['config_path']!r})
legacy_extension_dir = Path({layout['state_dir']!r}) / 'extensions' / plugin_id
backup_path = config_path.with_name(
    f"{{config_path.name}}.bak.{{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}}"
)
backup_path.write_text(config_path.read_text(encoding='utf-8'), encoding='utf-8')
config = json.loads(config_path.read_text(encoding='utf-8'))

if legacy_extension_dir.exists():
    shutil.rmtree(legacy_extension_dir)

band_tools = [
    'band_get_status',
    'band_get_latest',
    'band_get_fresh_latest',
    'band_get_events',
    'band_get_alerts',
]

tools = config.setdefault('tools', {{}})
tools_allow = tools.setdefault('allow', [])
for tool_name in band_tools:
    if tool_name not in tools_allow:
        tools_allow.append(tool_name)

plugins = config.setdefault('plugins', {{}})
allow = plugins.setdefault('allow', [])
if plugin_id not in allow:
    allow.append(plugin_id)

load = plugins.setdefault('load', {{}})
load_paths = load.setdefault('paths', [])
if {layout['extension_dir']!r} not in load_paths:
    load_paths.append({layout['extension_dir']!r})
for obsolete_path in ({str(Path(layout['state_dir']) / 'extensions' / PLUGIN_ID)!r}, '/root'):
    while obsolete_path in load_paths:
        load_paths.remove(obsolete_path)

entries = plugins.setdefault('entries', {{}})
entries[plugin_id] = {{
    'enabled': True,
    'config': {{
        'bridgeBaseUrl': bridge_url,
        'bridgeToken': token,
        'pollSeconds': {DEFAULT_POLL_SECONDS},
        'requestTimeoutMs': {DEFAULT_REQUEST_TIMEOUT_MS},
        'freshReadMaxWaitSeconds': {DEFAULT_FRESH_READ_MAX_WAIT_SECONDS},
        'freshReadRequestTimeoutMs': {DEFAULT_FRESH_READ_REQUEST_TIMEOUT_MS},
        'cacheFilePath': {layout['cache_file_path']!r}
    }}
}}

installs = plugins.setdefault('installs', {{}})
existing_install = installs.get(plugin_id, {{}})
installs[plugin_id] = {{
    'source': 'path',
    'sourcePath': {layout['extension_dir']!r},
    'installPath': {layout['extension_dir']!r},
    'version': '1.0.0',
    'installedAt': existing_install.get('installedAt')
    or datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
}}

config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\\n', encoding='utf-8')

workspace = Path({layout['workspace_dir']!r})
workspace.mkdir(parents=True, exist_ok=True)

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
    '- transport: reverse SSH or tunnel-backed local desktop bridge\\n'
    '- current-heart-rate flow: `band_get_fresh_latest` triggers the phone-side measurement attempt, waits up to 60 seconds, and either returns a new sample or reports timeout\\n\\n'
    '## Rules\\n\\n'
    '- Never call the bridge URL directly with exec, curl, wget, or raw HTTP.\\n'
    '- The bridge requires an Authorization header that is only wired inside the plugin config.\\n'
    '- Prefer `band_get_fresh_latest` when the user asks for the current heart rate right now.\\n'
    '- Use `band_get_latest` for cached health snapshots and `band_get_status` for diagnostics.\\n'
    '- Do not tell users about bridge tokens, Authorization headers, API keys, unauthorized, 401, or restart instructions.\\n'
    '- If a bridge call fails, say the latest band data is temporarily unavailable and check `band_get_status` next.\\n',
    encoding='utf-8'
)

tools_path = workspace / 'TOOLS.md'
section = (
    '\\n## Mi Band Bridge\\n\\n'
    '- Use the Mi Band bridge plugin for read-only health data from the local macOS bridge.\\n'
    '- Never use exec, curl, wget, or raw HTTP against the bridge URL directly.\\n'
    '- The bridge auth token is private and is only injected through the plugin config.\\n'
    '- Source path: Xiaomi 12X via adb, not direct server-side BLE.\\n'
    '- When the user asks for the current heart rate right now, call `band_get_fresh_latest` first.\\n'
    '- If the user only needs the last known metrics, call `band_get_latest`.\\n'
    '- Tool set: `band_get_status`, `band_get_latest`, `band_get_fresh_latest`, `band_get_events`, `band_get_alerts`.\\n'
    '- Do not tell users about bridge tokens, unauthorized, 401, API keys, or restart steps.\\n'
    '- If the band bridge fails, say the latest band data is temporarily unavailable, then inspect status through the bridge tools.\\n'
)
current_tools = tools_path.read_text(encoding='utf-8') if tools_path.exists() else ''
if '## Mi Band Bridge' in current_tools:
    before, _sep, _after = current_tools.partition('\\n## Mi Band Bridge\\n')
    tools_path.write_text(before.rstrip() + section + '\\n', encoding='utf-8')
else:
    tools_path.write_text(current_tools.rstrip() + '\\n' + section + '\\n', encoding='utf-8')
"""


def main() -> None:
    cli = argparse.ArgumentParser(description="Deploy the Mi Band bridge plugin to the remote OpenClaw host.")
    cli.add_argument("--remote", default=REMOTE_ALIAS, help="SSH alias for the remote OpenClaw host")
    cli.add_argument("--bridge-url", help="Explicit bridge URL to write into the remote OpenClaw config")
    cli.add_argument("--skip-restart", action="store_true", help="Skip `openclaw gateway restart` after deploy")
    args = cli.parse_args()

    token = ensure_bridge_token()
    bridge_url = read_bridge_url(args.bridge_url)
    local_host = read_local_host_metadata()

    if not shutil.which("ssh") or not shutil.which("scp"):
        raise RuntimeError("ssh and scp must both be installed")

    layout = probe_remote_runtime(args.remote)

    run(["ssh", args.remote, "mkdir", "-p", layout["extension_dir"], layout["workspace_dir"]])
    run(
        [
            "scp",
            str(PLUGIN_DIR / "openclaw.plugin.json"),
            str(PLUGIN_DIR / "package.json"),
            str(PLUGIN_DIR / "index.mjs"),
            f"{args.remote}:{layout['extension_dir']}/",
        ]
    )

    remote_script = build_remote_patch_script(token, bridge_url, local_host, layout)
    encoded = base64.b64encode(remote_script.encode("utf-8")).decode("ascii")
    remote_python = "import base64; exec(base64.b64decode({!r}).decode())".format(encoded)
    run(["ssh", args.remote, "python3 -c {}".format(shlex.quote(remote_python))])

    if not args.skip_restart:
        restart_command = layout.get("restart_command", f"{layout['openclaw_bin']} gateway restart")
        run(["ssh", args.remote, restart_command])
    print(f"Deployed {PLUGIN_ID} to {args.remote} using {bridge_url}")


if __name__ == "__main__":
    main()
