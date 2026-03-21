#!/usr/bin/env python3
import argparse
import os
import plistlib
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
STATE_DIR = Path.home() / ".openclaw-mi-band-bridge"
LOCAL_ENV_FILE = Path.home() / ".openclaw-mi-band-bridge.env"
BRIDGE_LABEL = "com.javis.openclaw.mi-band-bridge"
TUNNEL_LABEL = "com.javis.openclaw.mi-band-tunnel"
DEFAULT_REMOTE_TARGET = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE", "root@43.165.168.66")
DEFAULT_REMOTE_BIND_HOST = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_HOST", "127.0.0.1")
DEFAULT_REMOTE_BIND_PORT = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT", "19782")
DEFAULT_PATH = os.environ.get(
    "PATH",
    "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
)
STAGED_SSH_IDENTITY_NAME = "remote_ssh_identity"
RUNTIME_COPY_ITEMS = (
    "README.md",
    "bridge_config.json",
    "bridge_server.py",
    "client.py",
    "deploy_remote.py",
    "install_launchd.py",
    "measurement_trigger.py",
    "parser.py",
    "start_bridge.sh",
    "start_tunnel.sh",
    "wireless_adb.py",
)


def default_launch_agents_dir() -> Path:
    return Path.home() / "Library" / "LaunchAgents"


def runtime_dir(state_dir: Path) -> Path:
    return state_dir / "runtime"


def bridge_takeover_command() -> list[str]:
    port = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_PORT", "9782")
    return ["pkill", "-f", f"bridge_server.py --port {port}"]


def tunnel_takeover_command() -> list[str]:
    local_host = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_LOCAL_HOST", "127.0.0.1")
    local_port = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_PORT", "9782")
    remote_bind_host = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_HOST", DEFAULT_REMOTE_BIND_HOST)
    remote_bind_port = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT", DEFAULT_REMOTE_BIND_PORT)
    return ["pkill", "-f", f"{remote_bind_host}:{remote_bind_port}:{local_host}:{local_port}"]


def run(command: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=check, capture_output=True, text=True)


def resolve_ssh_identity_file(remote_target: str = DEFAULT_REMOTE_TARGET) -> Path | None:
    result = run(["ssh", "-G", remote_target], check=False)
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        if line.startswith("identityfile "):
            candidate = Path(line.split(" ", 1)[1].strip()).expanduser()
            if candidate.is_file():
                return candidate
    return None


def stage_ssh_identity_file(target_dir: Path, remote_target: str = DEFAULT_REMOTE_TARGET) -> Path | None:
    source = resolve_ssh_identity_file(remote_target)
    if source is None:
        return None
    destination = target_dir / STAGED_SSH_IDENTITY_NAME
    shutil.copy2(source, destination)
    destination.chmod(0o600)
    return destination


def materialize_runtime_tree(target_dir: Path) -> tuple[Path, Path | None]:
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

    staged_identity = stage_ssh_identity_file(target_dir)
    return target_dir, staged_identity


def common_environment(script_dir: Path) -> dict[str, str]:
    env = {
        "PATH": DEFAULT_PATH,
        "OPENCLAW_MI_BAND_BRIDGE_PORT": os.environ.get("OPENCLAW_MI_BAND_BRIDGE_PORT", "9782"),
        "OPENCLAW_MI_BAND_BRIDGE_LOCAL_HOST": os.environ.get("OPENCLAW_MI_BAND_BRIDGE_LOCAL_HOST", "127.0.0.1"),
        "OPENCLAW_MI_BAND_BRIDGE_TUNNEL_STATE": str(STATE_DIR / "tunnel-state.json"),
        "PYTHONPATH": str(script_dir),
    }
    token = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_TOKEN", "").strip()
    if not token and LOCAL_ENV_FILE.is_file():
        for line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
            if line.startswith("export OPENCLAW_MI_BAND_BRIDGE_TOKEN="):
                token = line.split("=", 1)[1].strip().strip('"')
                if token:
                    break
    if token:
        env["OPENCLAW_MI_BAND_BRIDGE_TOKEN"] = token
    return env


def build_bridge_plist(script_dir: Path, state_dir: Path) -> dict:
    return {
        "Label": BRIDGE_LABEL,
        "ProgramArguments": ["/bin/zsh", str(script_dir / "start_bridge.sh")],
        "RunAtLoad": True,
        "KeepAlive": True,
        "WorkingDirectory": str(script_dir),
        "EnvironmentVariables": common_environment(script_dir),
        "StandardOutPath": str(state_dir / "launchd-bridge.stdout.log"),
        "StandardErrorPath": str(state_dir / "launchd-bridge.stderr.log"),
    }


def build_tunnel_plist(script_dir: Path, state_dir: Path, staged_identity: Path | None = None) -> dict:
    env = common_environment(script_dir)
    env.update(
        {
            "OPENCLAW_MI_BAND_BRIDGE_TUNNEL_PROVIDER": "ssh-reverse",
            "OPENCLAW_MI_BAND_BRIDGE_REMOTE": os.environ.get(
                "OPENCLAW_MI_BAND_BRIDGE_REMOTE",
                DEFAULT_REMOTE_TARGET,
            ),
            "OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_HOST": os.environ.get(
                "OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_HOST",
                DEFAULT_REMOTE_BIND_HOST,
            ),
            "OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT": os.environ.get(
                "OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT",
                DEFAULT_REMOTE_BIND_PORT,
            ),
        }
    )
    if staged_identity is not None:
        env["OPENCLAW_MI_BAND_BRIDGE_SSH_OPTS"] = f"-i {staged_identity}"

    return {
        "Label": TUNNEL_LABEL,
        "ProgramArguments": ["/bin/zsh", str(script_dir / "start_tunnel.sh")],
        "RunAtLoad": True,
        "KeepAlive": True,
        "WorkingDirectory": str(script_dir),
        "EnvironmentVariables": env,
        "StandardOutPath": str(state_dir / "launchd-tunnel.stdout.log"),
        "StandardErrorPath": str(state_dir / "launchd-tunnel.stderr.log"),
    }


def write_plist(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        plistlib.dump(payload, handle, sort_keys=False)


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
    script_dir, staged_identity = materialize_runtime_tree(runtime_dir(STATE_DIR))

    bridge_path = launch_agents_dir / f"{BRIDGE_LABEL}.plist"
    tunnel_path = launch_agents_dir / f"{TUNNEL_LABEL}.plist"

    write_plist(bridge_path, build_bridge_plist(script_dir, STATE_DIR))
    write_plist(tunnel_path, build_tunnel_plist(script_dir, STATE_DIR, staged_identity=staged_identity))

    if load:
        bootout(bridge_path)
        run(bridge_takeover_command(), check=False)
        bootstrap_and_kickstart(BRIDGE_LABEL, bridge_path)

        bootout(tunnel_path)
        run(tunnel_takeover_command(), check=False)
        bootstrap_and_kickstart(TUNNEL_LABEL, tunnel_path)

    return [bridge_path, tunnel_path]


def uninstall_launch_agents(launch_agents_dir: Path | None = None) -> list[Path]:
    launch_agents_dir = launch_agents_dir or default_launch_agents_dir()
    paths = [
        launch_agents_dir / f"{BRIDGE_LABEL}.plist",
        launch_agents_dir / f"{TUNNEL_LABEL}.plist",
    ]
    for path in paths:
        if path.exists():
            bootout(path)
            path.unlink()
    run(bridge_takeover_command(), check=False)
    run(tunnel_takeover_command(), check=False)
    shutil.rmtree(runtime_dir(STATE_DIR), ignore_errors=True)
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Install Mi Band bridge launchd agents for the current user.")
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
