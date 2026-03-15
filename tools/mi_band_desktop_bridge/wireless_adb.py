#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "bridge_config.json"


def load_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def adb_target_env_var(config: dict[str, Any]) -> str:
    return str(config.get("adb_target_env_var", "OPENCLAW_MI_BAND_ADB_TARGET"))


def configured_wireless_target(config: dict[str, Any]) -> str | None:
    wireless = config.get("wireless_adb", {})
    host = str(wireless.get("host", "")).strip()
    if not host:
        return None
    port = int(wireless.get("port", 5555) or 5555)
    return f"{host}:{port}"


def configured_pair_target(config: dict[str, Any]) -> str | None:
    wireless = config.get("wireless_adb", {})
    host = str(wireless.get("host", "")).strip()
    pair_port = int(wireless.get("pair_port", 0) or 0)
    if not host or pair_port <= 0:
        return None
    return f"{host}:{pair_port}"


def resolve_active_target(config: dict[str, Any]) -> str:
    env_target = os.environ.get(adb_target_env_var(config), "").strip()
    if env_target:
        return env_target
    wireless = config.get("wireless_adb", {})
    target = configured_wireless_target(config)
    if bool(wireless.get("enabled")) and target:
        return target
    return str(config["adb_serial"])


def run_adb(config: dict[str, Any], args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(config["adb_path"]), *args],
        check=False,
        capture_output=True,
        text=True,
    )


def status(config: dict[str, Any]) -> int:
    devices = run_adb(config, ["devices", "-l"])
    payload = {
        "ok": devices.returncode == 0,
        "adb_path": config["adb_path"],
        "usb_serial": config["adb_serial"],
        "active_target": resolve_active_target(config),
        "active_transport": "wireless" if ":" in resolve_active_target(config) else "usb",
        "adb_target_env_var": adb_target_env_var(config),
        "wireless_adb": config.get("wireless_adb", {}),
        "configured_wireless_target": configured_wireless_target(config),
        "configured_pair_target": configured_pair_target(config),
        "devices_output": devices.stdout.strip(),
        "stderr": devices.stderr.strip(),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if devices.returncode == 0 else 1


def pair(config: dict[str, Any], pair_code: str, target: str | None) -> int:
    pair_target = target or configured_pair_target(config)
    if not pair_target:
        raise SystemExit("missing wireless pair target; set wireless_adb.host and wireless_adb.pair_port first")
    result = run_adb(config, ["pair", pair_target, pair_code])
    print((result.stdout or result.stderr).strip())
    return result.returncode


def connect(config: dict[str, Any], target: str | None) -> int:
    connect_target = target or configured_wireless_target(config)
    if not connect_target:
        raise SystemExit("missing wireless target; set wireless_adb.host and wireless_adb.port first")
    result = run_adb(config, ["connect", connect_target])
    print((result.stdout or result.stderr).strip())
    return result.returncode


def disconnect(config: dict[str, Any], target: str | None) -> int:
    disconnect_target = target or configured_wireless_target(config)
    if not disconnect_target:
        raise SystemExit("missing wireless target; set wireless_adb.host and wireless_adb.port first")
    result = run_adb(config, ["disconnect", disconnect_target])
    print((result.stdout or result.stderr).strip())
    return result.returncode


def print_env(config: dict[str, Any]) -> int:
    target = configured_wireless_target(config)
    if not target:
        raise SystemExit("missing wireless target; set wireless_adb.host and wireless_adb.port first")
    print(f'export {adb_target_env_var(config)}="{target}"')
    return 0


def main() -> None:
    cli = argparse.ArgumentParser(description="Manage optional wireless ADB for the Mi Band desktop bridge.")
    cli.add_argument("command", choices=["status", "pair", "connect", "disconnect", "print-env"])
    cli.add_argument("--config", default=str(CONFIG_PATH))
    cli.add_argument("--target", help="Explicit wireless ADB target in host:port form")
    cli.add_argument("--pair-code", help="Wireless ADB pairing code")
    args = cli.parse_args()

    config = load_config(Path(args.config))

    if args.command == "status":
        raise SystemExit(status(config))
    if args.command == "pair":
        if not args.pair_code:
            raise SystemExit("--pair-code is required for pair")
        raise SystemExit(pair(config, args.pair_code, args.target))
    if args.command == "connect":
        raise SystemExit(connect(config, args.target))
    if args.command == "disconnect":
        raise SystemExit(disconnect(config, args.target))
    if args.command == "print-env":
        raise SystemExit(print_env(config))


if __name__ == "__main__":
    main()
