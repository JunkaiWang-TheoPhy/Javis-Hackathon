#!/usr/bin/env python3
import argparse
import json
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    from install_launchd import BRIDGE_LABEL, SYNC_LABEL
except ModuleNotFoundError:
    from tools.printer_bridge.install_launchd import BRIDGE_LABEL, SYNC_LABEL


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
REMOTE_GATEWAY_BIN = "/home/devbox/.nvm/versions/node/v22.22.1/bin/openclaw"
REMOTE_GATEWAY_LOG = "/home/devbox/.openclaw/gateway-printer-bridge.log"
REMOTE_GATEWAY_PORT = 18789


def load_bridge_config() -> dict:
    return json.loads(BRIDGE_CONFIG.read_text(encoding="utf-8"))


def read_public_bridge_url(path: Path) -> str | None:
    if not path.is_file():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    public_url = payload.get("public_url") or payload.get("bridge_url")
    if not public_url:
        return None
    candidate = str(public_url).strip()
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
    raise TimeoutError(f"timed out waiting for tunnel URL in {path}")


def build_remote_gateway_start_command(remote_alias: str) -> list[str]:
    remote_command = (
        f"nohup {REMOTE_GATEWAY_BIN} gateway run --force "
        f"> {REMOTE_GATEWAY_LOG} 2>&1 < /dev/null &"
    )
    return ["ssh", remote_alias, remote_command]


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
    return ["ssh", remote_alias, remote_command]


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


def url_is_healthy(url: str, timeout_seconds: float = 5.0) -> bool:
    try:
        with urllib.request.urlopen(f"{url}/health", timeout=timeout_seconds) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False


def wait_for_health(url: str, timeout_seconds: float) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if url_is_healthy(url):
            return
        time.sleep(1.0)
    raise TimeoutError(f"timed out waiting for health at {url}/health")


def ensure_local_bridge(force_restart: bool) -> str:
    local_url = load_local_bridge_url()
    if not force_restart and url_is_healthy(local_url):
        return local_url

    if force_restart:
        run(["pkill", "-f", "bridge_server.py"], check=False)
        time.sleep(1.0)

    start_detached(["zsh", str(START_BRIDGE)], BRIDGE_LOG)
    wait_for_health(local_url, timeout_seconds=20.0)
    return local_url


def ensure_tunnel(force_restart: bool) -> str:
    current_url = read_public_bridge_url(TUNNEL_STATE_PATH)
    if not force_restart and current_url and url_is_healthy(current_url):
        return current_url

    run(["zsh", str(STOP_TUNNEL)], check=False)
    time.sleep(1.0)
    start_detached(["zsh", str(START_TUNNEL)], TUNNEL_LOG)
    public_url = wait_for_public_bridge_url(TUNNEL_STATE_PATH, timeout_seconds=45.0, poll_interval=1.0)
    wait_for_health(public_url, timeout_seconds=30.0)
    return public_url


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


def deploy_remote_config(remote_alias: str, bridge_url: str) -> None:
    run(
        [
            "python3",
            str(DEPLOY_REMOTE),
            "--remote",
            remote_alias,
            "--bridge-url",
            bridge_url,
            "--skip-restart",
        ]
    )


def persist_local_memory(bridge_url: str, remote_alias: str) -> None:
    cfg = load_bridge_config()
    host = read_host_metadata()
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
            "public_url": bridge_url,
            "remote_alias": remote_alias,
            "tunnel_state_path": str(TUNNEL_STATE_PATH),
        },
        "scripts": {
            "entrypoint": str(ROOT / "up.sh"),
            "bootstrap": str(ROOT / "bootstrap_stack.py"),
            "deploy_remote": str(DEPLOY_REMOTE),
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
        f"- public bridge URL: `{bridge_url}`",
        f"- remote OpenClaw alias: `{remote_alias}`",
        f"- tunnel state file: `{TUNNEL_STATE_PATH}`",
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
        f"- launchd sync label: `{SYNC_LABEL}`",
        "- launchd sync job reruns bridge refresh every 5 minutes",
    ]
    LOCAL_README_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bring up the local printer bridge stack and refresh remote OpenClaw config."
    )
    parser.add_argument("--remote", default="devbox", help="SSH alias for the remote OpenClaw host")
    parser.add_argument("--skip-remote-gateway", action="store_true", help="Do not ensure the remote gateway process is running")
    parser.add_argument("--force-restart-bridge", action="store_true", help="Restart the local bridge process even if health checks pass")
    parser.add_argument("--force-restart-tunnel", action="store_true", help="Restart the public HTTPS tunnel even if the current one is healthy")
    args = parser.parse_args()

    local_url = ensure_local_bridge(force_restart=args.force_restart_bridge)
    public_url = ensure_tunnel(force_restart=args.force_restart_tunnel)
    persist_local_memory(public_url, args.remote)
    deploy_remote_config(args.remote, public_url)
    if not args.skip_remote_gateway:
        ensure_remote_gateway(args.remote)

    print(json.dumps({
        "ok": True,
        "local_bridge_url": local_url,
        "public_bridge_url": public_url,
        "local_memory": str(LOCAL_README_PATH),
        "remote": args.remote,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
