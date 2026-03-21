#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    from install_launchd import BRIDGE_LABEL, SYNC_LABEL, TUNNEL_LABEL
except ModuleNotFoundError:
    from tools.printer_bridge.install_launchd import BRIDGE_LABEL, SYNC_LABEL, TUNNEL_LABEL


ROOT = Path(__file__).resolve().parent
START_BRIDGE = ROOT / "start_bridge.sh"
START_TUNNEL = ROOT / "start_tunnel.sh"
STOP_TUNNEL = ROOT / "stop_tunnel.sh"
DEPLOY_REMOTE = ROOT / "deploy_remote.py"
BRIDGE_CONFIG = ROOT / "bridge_config.json"
STATE_DIR = Path.home() / ".openclaw-printer-bridge"
BRIDGE_LOG = STATE_DIR / "bridge.log"
TUNNEL_LOG = STATE_DIR / "tunnel.log"
LOCAL_PROFILE_PATH = STATE_DIR / "profile.json"
LOCAL_README_PATH = STATE_DIR / "README.md"
TUNNEL_STATE_PATH = Path.home() / ".openclaw-printer-bridge-tunnel.json"
DEFAULT_REMOTE_ALIAS = os.environ.get("OPENCLAW_PRINTER_BRIDGE_REMOTE_ALIAS", "openclaw-projectsai")
DEFAULT_REMOTE_OPENCLAW_HOME = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_OPENCLAW_HOME",
    "/root/.openclaw",
)
DEFAULT_REMOTE_QUEUE_ROOT = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_QUEUE_ROOT",
    f"{DEFAULT_REMOTE_OPENCLAW_HOME}/printer-bridge-queue",
)
REMOTE_HELPER_PATH = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_HELPER",
    f"{DEFAULT_REMOTE_OPENCLAW_HOME}/extensions/printer-bridge/queue_bridge_admin.py",
)
REMOTE_GATEWAY_BIN = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_OPENCLAW_BIN",
    "/root/.nvm/versions/node/v22.22.0/bin/openclaw",
)
REMOTE_GATEWAY_LOG = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_GATEWAY_LOG",
    f"{DEFAULT_REMOTE_OPENCLAW_HOME}/gateway-printer-bridge.log",
)
REMOTE_GATEWAY_PORT = 18789
CONNECTOR_HEALTH_TIMEOUT_SECONDS = 30.0
STAGED_SSH_IDENTITY_FILE = Path(
    os.environ.get(
        "OPENCLAW_PRINTER_BRIDGE_SSH_IDENTITY_FILE",
        str(Path.home() / ".openclaw-printer-bridge" / "runtime" / "devbox_ssh_identity"),
    )
)


def load_bridge_config() -> dict:
    return json.loads(BRIDGE_CONFIG.read_text(encoding="utf-8"))


def default_connector_state() -> dict[str, object]:
    remote_alias = os.environ.get("OPENCLAW_PRINTER_BRIDGE_REMOTE_ALIAS", DEFAULT_REMOTE_ALIAS)
    remote_queue_root = os.environ.get("OPENCLAW_PRINTER_BRIDGE_REMOTE_QUEUE_ROOT", DEFAULT_REMOTE_QUEUE_ROOT)
    return {
        "provider": "ssh_queue_proxy",
        "bridge_url": f"queue://{remote_alias}{remote_queue_root}",
        "remote_alias": remote_alias,
        "remote_queue_root": remote_queue_root,
    }


def read_bridge_state(path: Path) -> dict | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_public_bridge_url(path: Path) -> str | None:
    payload = read_bridge_state(path)
    if not payload:
        return None
    public_url = payload.get("public_url") or payload.get("bridge_url")
    if not public_url:
        return None
    candidate = str(public_url).strip()
    if not candidate.startswith(("http://", "https://")):
        return None
    if candidate == "https://api.trycloudflare.com":
        return None
    return candidate


def wait_for_public_bridge_url(
    path: Path,
    timeout_seconds: float,
    poll_interval: float = 1.0,
) -> str:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        public_url = read_public_bridge_url(path)
        if public_url:
            return public_url
        time.sleep(poll_interval)
    raise TimeoutError(f"timed out waiting for bridge reference in {path}")


def build_remote_gateway_start_command(remote_alias: str) -> list[str]:
    remote_command = (
        f"nohup {REMOTE_GATEWAY_BIN} gateway run --force "
        f"> {REMOTE_GATEWAY_LOG} 2>&1 < /dev/null &"
    )
    return build_ssh_command(remote_alias, remote_command)


def build_remote_gateway_probe_command(remote_alias: str) -> list[str]:
    remote_command = (
        "python3 - <<'PY'\n"
        "import socket\n"
        "sock = socket.socket()\n"
        "sock.settimeout(1)\n"
        f"print(sock.connect_ex(('127.0.0.1', {REMOTE_GATEWAY_PORT})))\n"
        "sock.close()\n"
        "PY"
    )
    return build_ssh_command(remote_alias, remote_command)


def build_remote_connector_status_command(remote_alias: str, queue_root: str) -> list[str]:
    remote_command = (
        f"python3 {REMOTE_HELPER_PATH} "
        f"status --queue-root {queue_root}"
    )
    return build_ssh_command(remote_alias, remote_command)


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


def run(
    command: list[str],
    *,
    check: bool = True,
    capture_output: bool = False,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=check,
        capture_output=capture_output,
        text=True,
    )


def start_detached(command: list[str], log_path: Path) -> int:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_handle = log_path.open("a", encoding="utf-8")
    try:
        process = subprocess.Popen(
            command,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            text=True,
        )
    finally:
        log_handle.close()
    return process.pid


def read_command_output(command: list[str]) -> str:
    result = run(command, check=False, capture_output=True)
    return result.stdout.strip()


def read_host_metadata() -> dict[str, str]:
    return {
        "computer_name": read_command_output(["scutil", "--get", "ComputerName"]) or "local macOS machine",
        "local_host_name": read_command_output(["scutil", "--get", "LocalHostName"]) or "unknown",
        "hostname": read_command_output(["hostname"]) or "unknown",
    }


def load_local_bridge_url() -> str:
    cfg = load_bridge_config()
    return f"http://{cfg['listen_host']}:{cfg['listen_port']}"


def build_health_check_command(url: str, timeout_seconds: float) -> list[str]:
    return [
        "curl",
        "-fsS",
        "--max-time",
        str(timeout_seconds),
        f"{url.rstrip('/')}/health",
    ]


def url_is_healthy(url: str, timeout_seconds: float = 5.0) -> bool:
    if shutil.which("curl"):
        result = run(build_health_check_command(url, timeout_seconds), check=False, capture_output=True)
        return result.returncode == 0

    try:
        with urllib.request.urlopen(f"{url.rstrip('/')}/health", timeout=timeout_seconds) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False


def connector_status(remote_alias: str, queue_root: str) -> dict | None:
    result = run(
        build_remote_connector_status_command(remote_alias, queue_root),
        check=False,
        capture_output=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def connector_is_healthy(remote_alias: str, queue_root: str) -> bool:
    status = connector_status(remote_alias, queue_root)
    return bool(status and status.get("connector_online"))


def ensure_local_bridge(force_restart: bool) -> str:
    local_url = load_local_bridge_url()
    if not force_restart and url_is_healthy(local_url):
        return local_url

    if force_restart:
        run(["pkill", "-f", "bridge_server.py"], check=False)
        time.sleep(1.0)

    start_detached(["zsh", str(START_BRIDGE)], BRIDGE_LOG)
    deadline = time.monotonic() + 20.0
    while time.monotonic() < deadline:
        if url_is_healthy(local_url):
            return local_url
        time.sleep(1.0)
    raise TimeoutError(f"timed out waiting for health at {local_url}/health")


def ensure_connector(force_restart: bool, remote_alias: str) -> str:
    state = read_bridge_state(TUNNEL_STATE_PATH) or default_connector_state()
    queue_root = str(state.get("remote_queue_root") or DEFAULT_REMOTE_QUEUE_ROOT)
    if not force_restart and connector_is_healthy(remote_alias, queue_root):
        return str(state["bridge_url"])

    run(["zsh", str(STOP_TUNNEL)], check=False)
    time.sleep(1.0)
    start_detached(["zsh", str(START_TUNNEL)], TUNNEL_LOG)

    deadline = time.monotonic() + CONNECTOR_HEALTH_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        if connector_is_healthy(remote_alias, queue_root):
            return str((read_bridge_state(TUNNEL_STATE_PATH) or state)["bridge_url"])
        time.sleep(1.0)
    raise TimeoutError(f"timed out waiting for connector heartbeat for queue {queue_root}")


def remote_gateway_running(remote_alias: str) -> bool:
    result = run(build_remote_gateway_probe_command(remote_alias), check=False, capture_output=True)
    return result.returncode == 0 and result.stdout.strip() == "0"


def ensure_remote_gateway(remote_alias: str) -> None:
    if remote_gateway_running(remote_alias):
        return

    run(build_remote_gateway_start_command(remote_alias))
    deadline = time.monotonic() + 20.0
    while time.monotonic() < deadline:
        if remote_gateway_running(remote_alias):
            return
        time.sleep(1.0)
    raise TimeoutError(f"timed out waiting for remote gateway on {remote_alias}")


def deploy_remote_config(remote_alias: str) -> None:
    run(
        [
            "python3",
            str(DEPLOY_REMOTE),
            "--remote",
            remote_alias,
            "--skip-restart",
        ]
    )


def persist_local_memory(bridge_reference: str, remote_alias: str) -> None:
    cfg = load_bridge_config()
    host = read_host_metadata()
    state = read_bridge_state(TUNNEL_STATE_PATH) or default_connector_state()
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    payload = {
        "local_host": host,
        "printer": {
            "queue_name": cfg["queue_name"],
            "display_name": cfg["display_name"],
            "supported_media": cfg["supported_media"],
            "default_media_aliases": cfg["media_aliases"],
        },
        "bridge": {
            "local_url": load_local_bridge_url(),
            "transport": "ssh_queue_connector",
            "remote_bridge_reference": bridge_reference,
            "remote_host_alias": state.get("remote_alias", remote_alias),
            "remote_queue_root": state.get("remote_queue_root", DEFAULT_REMOTE_QUEUE_ROOT),
            "tunnel_state_path": str(TUNNEL_STATE_PATH),
        },
        "scripts": {
            "entrypoint": str(ROOT / "up.sh"),
            "bootstrap": str(ROOT / "bootstrap_stack.py"),
            "deploy_remote": str(DEPLOY_REMOTE),
            "launchd_runtime": str(STATE_DIR / "runtime"),
        },
    }
    LOCAL_PROFILE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# OpenClaw Printer Bridge",
        "",
        "## Local Host",
        "",
        f"- computer name: `{host['computer_name']}`",
        f"- local host name: `{host['local_host_name']}`",
        f"- hostname: `{host['hostname']}`",
        "",
        "## Printer",
        "",
        f"- display name: `{cfg['display_name']}`",
        f"- queue name: `{cfg['queue_name']}`",
        f"- supported media: `{', '.join(cfg['supported_media'])}`",
        "",
        "## Runtime",
        "",
        f"- local bridge URL: `{load_local_bridge_url()}`",
        f"- remote bridge reference: `{bridge_reference}`",
        f"- remote OpenClaw alias: `{remote_alias}`",
        f"- remote queue root: `{state.get('remote_queue_root', DEFAULT_REMOTE_QUEUE_ROOT)}`",
        f"- transport state file: `{TUNNEL_STATE_PATH}`",
        "",
        "## Commands",
        "",
        f"- bring up stack: `{ROOT / 'up.sh'}`",
        f"- redeploy remote config only: `python3 {DEPLOY_REMOTE}`",
        f"- print one image: `python3 {ROOT / 'print_image.py'} /path/to/image.jpg --media three_inch`",
        "",
        "## Automation",
        "",
        f"- launchd bridge label: `{BRIDGE_LABEL}`",
        f"- launchd connector label: `{TUNNEL_LABEL}`",
        f"- launchd sync label: `{SYNC_LABEL}`",
        f"- launchd runtime directory: `{STATE_DIR / 'runtime'}`",
        "- launchd connector job keeps the devbox queue drained from the Mac host over SSH",
        "- launchd sync job reruns bridge refresh every 5 minutes",
    ]
    LOCAL_README_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bring up the local printer bridge stack and refresh remote OpenClaw config."
    )
    parser.add_argument("--remote", default=DEFAULT_REMOTE_ALIAS, help="SSH alias for the remote OpenClaw host")
    parser.add_argument("--skip-remote-gateway", action="store_true", help="Do not ensure the remote gateway process is running")
    parser.add_argument("--force-restart-bridge", action="store_true", help="Restart the local bridge process even if health checks pass")
    parser.add_argument("--force-restart-tunnel", action="store_true", help="Restart the local SSH connector even if the current one is healthy")
    args = parser.parse_args()

    local_url = ensure_local_bridge(force_restart=args.force_restart_bridge)
    deploy_remote_config(args.remote)
    connector_reference = ensure_connector(force_restart=args.force_restart_tunnel, remote_alias=args.remote)
    persist_local_memory(connector_reference, args.remote)
    if not args.skip_remote_gateway:
        ensure_remote_gateway(args.remote)

    print(
        json.dumps(
            {
                "ok": True,
                "local_bridge_url": local_url,
                "remote_bridge_reference": connector_reference,
                "local_memory": str(LOCAL_README_PATH),
                "remote": args.remote,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
