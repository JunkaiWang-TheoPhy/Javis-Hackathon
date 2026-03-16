#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys
import time


VALID_SOURCES = {"localmac": "localmac-camera", "localpc": "localpc-camera"}
DEFAULT_REMOTE_WORKSPACE = Path("/home/devbox/.openclaw/workspace")
RETRYABLE_FAILURE_PATTERNS = (
    "connection closed",
    "connection reset",
    "broken pipe",
    "kex_exchange_identification",
    "service restart",
    "gateway closed",
)


def build_remote_paths(*, source: str, remote_workspace: Path) -> dict[str, str]:
    if source not in VALID_SOURCES:
        raise ValueError(f"Unsupported source: {source}")

    cache_dir = remote_workspace / ".cache" / VALID_SOURCES[source]
    return {
        "cache_dir": str(cache_dir),
        "image_path": str(cache_dir / "latest.jpg"),
        "metadata_path": str(cache_dir / "latest.json"),
        "output_dir": str(remote_workspace / "comic"),
        "tools_dir": str(remote_workspace / "comic-tools"),
        "renderer_script": str(remote_workspace / "comic-tools" / "generate_camera_comic.py"),
        "renderer_python": str(remote_workspace / "comic-tools" / ".venv" / "bin" / "python3"),
    }


def parse_renderer_result(stdout: str) -> dict[str, str]:
    for line in reversed(stdout.splitlines()):
        candidate = line.strip()
        if not candidate.startswith("{"):
            continue
        payload = json.loads(candidate)
        if "output" in payload and "sidecar" in payload:
            return payload
    raise ValueError(f"Unable to find renderer JSON in output: {stdout}")


def build_remote_render_command(*, source: str, remote_paths: dict[str, str]) -> str:
    commands = [
        "mkdir -p "
        + " ".join(
            shlex.quote(path)
            for path in (
                remote_paths["cache_dir"],
                remote_paths["output_dir"],
                remote_paths["tools_dir"],
            )
        ),
        " ".join(
            [
                shlex.quote(remote_paths["renderer_python"]),
                shlex.quote(remote_paths["renderer_script"]),
                "--source",
                shlex.quote(source),
                "--input",
                shlex.quote(remote_paths["image_path"]),
                "--metadata",
                shlex.quote(remote_paths["metadata_path"]),
                "--output-dir",
                shlex.quote(remote_paths["output_dir"]),
            ]
        ),
    ]
    return " && ".join(commands)


def is_retryable_failure(text: str) -> bool:
    haystack = text.lower()
    return any(pattern in haystack for pattern in RETRYABLE_FAILURE_PATTERNS)


def _build_ssh_command(
    *,
    program: str,
    target: str,
    identity: str | None,
    port: int | None,
    extra: list[str],
) -> list[str]:
    command = [program]
    if identity:
        command.extend(["-i", identity])
    if port is not None:
        command.extend(["-P" if program == "scp" else "-p", str(port)])
    command.append(target)
    command.extend(extra)
    return command


def build_scp_upload_command(
    *,
    local_path: str,
    remote_target: str,
    identity: str | None,
    port: int | None,
) -> list[str]:
    command = ["scp"]
    if identity:
        command.extend(["-i", identity])
    if port is not None:
        command.extend(["-P", str(port)])
    command.extend([local_path, remote_target])
    return command


def build_remote_render_ssh_command(
    *,
    target: str,
    identity: str | None,
    port: int | None,
    remote_command: str,
) -> list[str]:
    command = ["ssh"]
    if identity:
        command.extend(["-i", identity])
    if port is not None:
        command.extend(["-p", str(port)])
    command.extend([target, f"bash -lc {shlex.quote(remote_command)}"])
    return command


def _run(
    command: list[str],
    *,
    capture_output: bool = False,
    retries: int = 1,
    retry_delay_sec: float = 2.0,
) -> subprocess.CompletedProcess[str]:
    attempts = max(1, retries)

    for attempt in range(1, attempts + 1):
        result = subprocess.run(
            command,
            check=False,
            text=True,
            capture_output=True,
        )
        if result.returncode == 0:
            return result

        combined_output = "\n".join(part for part in (result.stdout, result.stderr) if part).strip()
        if attempt < attempts and is_retryable_failure(combined_output):
            time.sleep(retry_delay_sec)
            continue

        command_text = " ".join(shlex.quote(part) for part in command)
        message = f"Command failed with exit code {result.returncode}: {command_text}"
        if combined_output:
            message = f"{message}\n{combined_output}"
        raise RuntimeError(message)

    raise RuntimeError("unreachable")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload a local camera image to devbox and run the cloud comic renderer.")
    parser.add_argument("--source", required=True, choices=sorted(VALID_SOURCES))
    parser.add_argument("--input", required=True, dest="input_path")
    parser.add_argument("--metadata", required=True, dest="metadata_path")
    parser.add_argument("--ssh-target", default="devbox")
    parser.add_argument("--ssh-identity")
    parser.add_argument("--ssh-port", type=int)
    parser.add_argument("--remote-workspace", default=str(DEFAULT_REMOTE_WORKSPACE))
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    input_path = Path(args.input_path).expanduser().resolve()
    metadata_path = Path(args.metadata_path).expanduser().resolve()

    if not input_path.exists():
        print(f"Input image not found: {input_path}", file=sys.stderr)
        return 1
    if not metadata_path.exists():
        print(f"Metadata file not found: {metadata_path}", file=sys.stderr)
        return 1

    remote_workspace = Path(args.remote_workspace).expanduser()
    remote_paths = build_remote_paths(source=args.source, remote_workspace=remote_workspace)
    remote_render_command = build_remote_render_command(source=args.source, remote_paths=remote_paths)

    ensure_dirs_command = _build_ssh_command(
        program="ssh",
        target=args.ssh_target,
        identity=args.ssh_identity,
        port=args.ssh_port,
        extra=[f"mkdir -p {shlex.quote(remote_paths['cache_dir'])} {shlex.quote(remote_paths['output_dir'])} {shlex.quote(remote_paths['tools_dir'])}"],
    )
    copy_image_command = build_scp_upload_command(
        local_path=str(input_path),
        remote_target=f"{args.ssh_target}:{remote_paths['image_path']}",
        identity=args.ssh_identity,
        port=args.ssh_port,
    )
    copy_metadata_command = build_scp_upload_command(
        local_path=str(metadata_path),
        remote_target=f"{args.ssh_target}:{remote_paths['metadata_path']}",
        identity=args.ssh_identity,
        port=args.ssh_port,
    )
    render_command = build_remote_render_ssh_command(
        target=args.ssh_target,
        identity=args.ssh_identity,
        port=args.ssh_port,
        remote_command=remote_render_command,
    )

    if args.dry_run:
        payload = {
            "ensure_dirs": ensure_dirs_command,
            "copy_image": copy_image_command,
            "copy_metadata": copy_metadata_command,
            "render": render_command,
        }
        print(json.dumps(payload, indent=2))
        return 0

    _run(ensure_dirs_command, retries=2)
    _run(copy_image_command, retries=3)
    _run(copy_metadata_command, retries=3)
    renderer = _run(render_command, capture_output=True, retries=3)
    payload = parse_renderer_result(renderer.stdout)
    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
