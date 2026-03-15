#!/usr/bin/env python3
import argparse
import os
import plistlib
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATE_DIR = Path.home() / ".openclaw-printer-bridge"
BRIDGE_LABEL = "com.javis.openclaw.printer-bridge"
SYNC_LABEL = "com.javis.openclaw.printer-sync"
SYNC_INTERVAL_SECONDS = 300


def default_launch_agents_dir() -> Path:
    return Path.home() / "Library" / "LaunchAgents"


def bridge_takeover_command() -> list[str]:
    return ["pkill", "-f", "bridge_server.py"]


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

    bridge_path = launch_agents_dir / f"{BRIDGE_LABEL}.plist"
    sync_path = launch_agents_dir / f"{SYNC_LABEL}.plist"

    write_plist(bridge_path, build_bridge_plist(ROOT, STATE_DIR))
    write_plist(sync_path, build_sync_plist(ROOT, STATE_DIR))

    if load:
        bootout(bridge_path)
        run(bridge_takeover_command(), check=False)
        bootstrap_and_kickstart(BRIDGE_LABEL, bridge_path)

        bootout(sync_path)
        bootstrap_and_kickstart(SYNC_LABEL, sync_path)

    return [bridge_path, sync_path]


def uninstall_launch_agents(launch_agents_dir: Path | None = None) -> list[Path]:
    launch_agents_dir = launch_agents_dir or default_launch_agents_dir()
    paths = [
        launch_agents_dir / f"{BRIDGE_LABEL}.plist",
        launch_agents_dir / f"{SYNC_LABEL}.plist",
    ]
    for path in paths:
        if path.exists():
            bootout(path)
            path.unlink()
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
