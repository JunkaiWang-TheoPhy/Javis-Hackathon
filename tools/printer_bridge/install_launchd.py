#!/usr/bin/env python3
import argparse
import os
import plistlib
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATE_DIR = Path.home() / ".openclaw-printer-bridge"
BRIDGE_LABEL = "com.javis.openclaw.printer-bridge"
TUNNEL_LABEL = "com.javis.openclaw.printer-tunnel"
SYNC_LABEL = "com.javis.openclaw.printer-sync"
DEFAULT_REMOTE_ALIAS = "devbox"
STAGED_SSH_IDENTITY_NAME = "devbox_ssh_identity"
SYNC_INTERVAL_SECONDS = 300
RUNTIME_COPY_ITEMS = (
    "bridge_config.json",
    "bridge_server.py",
    "bootstrap_stack.py",
    "connector_loop.py",
    "deploy_remote.py",
    "install_launchd.py",
    "print_image.py",
    "queue_bridge_admin.py",
    "start_bridge.sh",
    "start_tunnel.sh",
    "stop_tunnel.sh",
    "up.sh",
    "openclaw_printer_plugin",
)


def default_launch_agents_dir() -> Path:
    return Path.home() / "Library" / "LaunchAgents"


def bridge_takeover_command() -> list[str]:
    return ["pkill", "-f", "bridge_server.py"]


def runtime_dir(state_dir: Path) -> Path:
    return state_dir / "runtime"


def resolve_ssh_identity_file(remote_alias: str = DEFAULT_REMOTE_ALIAS) -> Path | None:
    result = run(["ssh", "-G", remote_alias], check=False)
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        if line.startswith("identityfile "):
            candidate = Path(line.split(" ", 1)[1].strip()).expanduser()
            if candidate.is_file():
                return candidate
    return None


def stage_ssh_identity_file(target_dir: Path, remote_alias: str = DEFAULT_REMOTE_ALIAS) -> Path | None:
    source = resolve_ssh_identity_file(remote_alias)
    if source is None:
        return None
    destination = target_dir / STAGED_SSH_IDENTITY_NAME
    shutil.copy2(source, destination)
    destination.chmod(0o600)
    return destination


def materialize_runtime_tree(target_dir: Path) -> Path:
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    for name in RUNTIME_COPY_ITEMS:
        source = ROOT / name
        destination = target_dir / name
        if source.is_dir():
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)

    stage_ssh_identity_file(target_dir)
    return target_dir


def build_bridge_plist(script_dir: Path, state_dir: Path) -> dict:
    return {
        "Label": BRIDGE_LABEL,
        "ProgramArguments": ["/bin/zsh", str(script_dir / "start_bridge.sh")],
        "RunAtLoad": True,
        "KeepAlive": True,
        "WorkingDirectory": str(script_dir),
        "StandardOutPath": str(state_dir / "launchd-bridge.stdout.log"),
        "StandardErrorPath": str(state_dir / "launchd-bridge.stderr.log"),
    }


def build_tunnel_plist(script_dir: Path, state_dir: Path) -> dict:
    return {
        "Label": TUNNEL_LABEL,
        "ProgramArguments": ["/bin/zsh", str(script_dir / "start_tunnel.sh")],
        "RunAtLoad": True,
        "KeepAlive": True,
        "WorkingDirectory": str(script_dir),
        "StandardOutPath": str(state_dir / "launchd-tunnel.stdout.log"),
        "StandardErrorPath": str(state_dir / "launchd-tunnel.stderr.log"),
    }


def build_sync_plist(script_dir: Path, state_dir: Path) -> dict:
    return {
        "Label": SYNC_LABEL,
        "ProgramArguments": [
            "/bin/zsh",
            str(script_dir / "up.sh"),
            "--skip-remote-gateway",
        ],
        "RunAtLoad": True,
        "StartInterval": SYNC_INTERVAL_SECONDS,
        "WorkingDirectory": str(script_dir),
        "StandardOutPath": str(state_dir / "launchd-sync.stdout.log"),
        "StandardErrorPath": str(state_dir / "launchd-sync.stderr.log"),
    }


def write_plist(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        plistlib.dump(payload, handle, sort_keys=False)


def run(command: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=check, capture_output=True, text=True)


def bootout(label_path: Path) -> None:
    domain = f"gui/{os.getuid()}"
    run(["launchctl", "bootout", domain, str(label_path)], check=False)


def bootstrap_and_kickstart(label: str, label_path: Path) -> None:
    domain = f"gui/{os.getuid()}"
    run(["launchctl", "bootstrap", domain, str(label_path)])
    run(["launchctl", "enable", f"{domain}/{label}"], check=False)
    run(["launchctl", "kickstart", "-k", f"{domain}/{label}"], check=False)


def install_launch_agents(launch_agents_dir: Path | None = None, load: bool = True) -> list[Path]:
    launch_agents_dir = launch_agents_dir or default_launch_agents_dir()
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    script_dir = materialize_runtime_tree(runtime_dir(STATE_DIR))

    bridge_path = launch_agents_dir / f"{BRIDGE_LABEL}.plist"
    tunnel_path = launch_agents_dir / f"{TUNNEL_LABEL}.plist"
    sync_path = launch_agents_dir / f"{SYNC_LABEL}.plist"

    write_plist(bridge_path, build_bridge_plist(script_dir, STATE_DIR))
    write_plist(tunnel_path, build_tunnel_plist(script_dir, STATE_DIR))
    write_plist(sync_path, build_sync_plist(script_dir, STATE_DIR))

    if load:
        bootout(bridge_path)
        run(bridge_takeover_command(), check=False)
        bootstrap_and_kickstart(BRIDGE_LABEL, bridge_path)

        bootout(tunnel_path)
        run(["/bin/zsh", str(script_dir / "stop_tunnel.sh")], check=False)
        bootstrap_and_kickstart(TUNNEL_LABEL, tunnel_path)

        bootout(sync_path)
        bootstrap_and_kickstart(SYNC_LABEL, sync_path)

    return [bridge_path, tunnel_path, sync_path]


def uninstall_launch_agents(launch_agents_dir: Path | None = None) -> list[Path]:
    launch_agents_dir = launch_agents_dir or default_launch_agents_dir()
    paths = [
        launch_agents_dir / f"{BRIDGE_LABEL}.plist",
        launch_agents_dir / f"{TUNNEL_LABEL}.plist",
        launch_agents_dir / f"{SYNC_LABEL}.plist",
    ]
    for path in paths:
        if path.exists():
            bootout(path)
            path.unlink()
    shutil.rmtree(runtime_dir(STATE_DIR), ignore_errors=True)
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Install printer bridge launchd agents for the current user.")
    parser.add_argument("--write-only", action="store_true", help="Write plist files without loading them through launchctl")
    parser.add_argument("--uninstall", action="store_true", help="Unload and remove the launch agent plist files")
    args = parser.parse_args()

    if args.uninstall:
        removed = uninstall_launch_agents()
        print("removed")
        for path in removed:
            print(path)
        return

    installed = install_launch_agents(load=not args.write_only)
    print("installed")
    for path in installed:
        print(path)


if __name__ == "__main__":
    main()
