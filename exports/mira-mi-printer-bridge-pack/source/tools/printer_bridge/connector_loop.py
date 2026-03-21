#!/usr/bin/env python3
import json
import os
import shlex
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BRIDGE_CONFIG = ROOT / "bridge_config.json"
LOCAL_ENV_FILE = Path.home() / ".openclaw-printer-bridge.env"
STATE_FILE = Path.home() / ".openclaw-printer-bridge-tunnel.json"
REMOTE_ALIAS = os.environ.get("OPENCLAW_PRINTER_BRIDGE_REMOTE_ALIAS", "devbox")
REMOTE_QUEUE_ROOT = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_QUEUE_ROOT",
    "/home/devbox/.openclaw/printer-bridge-queue",
)
REMOTE_HELPER_PATH = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_REMOTE_HELPER",
    "/home/devbox/.openclaw/extensions/printer-bridge/queue_bridge_admin.py",
)
SSH_IDENTITY_FILE = os.environ.get(
    "OPENCLAW_PRINTER_BRIDGE_SSH_IDENTITY_FILE",
    str(Path.home() / ".openclaw-printer-bridge" / "runtime" / "devbox_ssh_identity"),
)
CLAIM_WAIT_SECONDS = float(os.environ.get("OPENCLAW_PRINTER_BRIDGE_CLAIM_WAIT_SECONDS", "20"))
CLAIM_LEASE_SECONDS = float(os.environ.get("OPENCLAW_PRINTER_BRIDGE_CLAIM_LEASE_SECONDS", "90"))
IDLE_BACKOFF_SECONDS = float(os.environ.get("OPENCLAW_PRINTER_BRIDGE_IDLE_BACKOFF_SECONDS", "3"))
WORKER_NAME = os.environ.get("OPENCLAW_PRINTER_BRIDGE_WORKER_NAME", socket.gethostname())


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_bridge_token() -> str:
    if os.environ.get("OPENCLAW_PRINTER_BRIDGE_TOKEN"):
        return os.environ["OPENCLAW_PRINTER_BRIDGE_TOKEN"]
    if not LOCAL_ENV_FILE.is_file():
        raise RuntimeError(f"missing bridge env file: {LOCAL_ENV_FILE}")
    for line in LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("export OPENCLAW_PRINTER_BRIDGE_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    raise RuntimeError("bridge token not found in local env file")


def load_local_bridge_url() -> str:
    cfg = json.loads(BRIDGE_CONFIG.read_text(encoding="utf-8"))
    return f"http://{cfg['listen_host']}:{cfg['listen_port']}"


def write_state() -> None:
    payload = {
        "provider": "ssh_queue_proxy",
        "bridge_url": f"queue://{REMOTE_ALIAS}{REMOTE_QUEUE_ROOT}",
        "remote_alias": REMOTE_ALIAS,
        "remote_queue_root": REMOTE_QUEUE_ROOT,
        "worker_name": WORKER_NAME,
        "updated_at": iso_now(),
    }
    STATE_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_remote_command(*parts: str) -> list[str]:
    quoted = " ".join(shlex.quote(part) for part in parts)
    return [
        "ssh",
        "-F",
        "/dev/null",
        "-p",
        resolve_ssh_setting("port") or "22",
        "-l",
        resolve_ssh_setting("user") or os.environ.get("USER", "devbox"),
        "-i",
        SSH_IDENTITY_FILE,
        "-o",
        "IdentitiesOnly=yes",
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=10",
        resolve_ssh_setting("hostname") or REMOTE_ALIAS,
        quoted,
    ]


def resolve_ssh_setting(key: str) -> str:
    result = subprocess.run(
        ["ssh", "-G", REMOTE_ALIAS],
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


def run_remote_command(*parts: str, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        build_remote_command(*parts),
        check=False,
        capture_output=True,
        text=True,
        input=input_text,
    )


def claim_request() -> dict | None:
    result = run_remote_command(
        "python3",
        REMOTE_HELPER_PATH,
        "claim",
        "--queue-root",
        REMOTE_QUEUE_ROOT,
        "--worker",
        WORKER_NAME,
        "--wait-seconds",
        str(CLAIM_WAIT_SECONDS),
        "--lease-seconds",
        str(CLAIM_LEASE_SECONDS),
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "claim failed")
    body = result.stdout.strip()
    return json.loads(body) if body else None


def complete_request(request_id: str, response_payload: dict) -> None:
    result = run_remote_command(
        "python3",
        REMOTE_HELPER_PATH,
        "complete",
        "--queue-root",
        REMOTE_QUEUE_ROOT,
        "--worker",
        WORKER_NAME,
        "--request-id",
        request_id,
        input_text=json.dumps(response_payload, ensure_ascii=False),
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "complete failed")


def call_local_bridge(request_payload: dict) -> dict:
    request_id = str(request_payload.get("id", "unknown"))
    request_path = str(request_payload.get("path", "/"))
    request_method = str(request_payload.get("method", "GET")).upper()
    request_body = request_payload.get("body")

    bridge_url = load_local_bridge_url()
    token = read_bridge_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    data = None
    if request_body is not None:
        data = json.dumps(request_body).encode("utf-8")

    request = urllib.request.Request(
        f"{bridge_url}{request_path}",
        data=data,
        headers=headers,
        method=request_method,
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw_body = response.read().decode("utf-8")
            try:
                parsed_body = json.loads(raw_body) if raw_body else {}
            except json.JSONDecodeError:
                parsed_body = raw_body
            return {
                "request_id": request_id,
                "statusCode": response.status,
                "body": parsed_body,
                "completed_at": iso_now(),
            }
    except urllib.error.HTTPError as exc:
        raw_body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed_body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            parsed_body = raw_body
        return {
            "request_id": request_id,
            "statusCode": exc.code,
            "body": parsed_body,
            "completed_at": iso_now(),
        }
    except Exception as exc:
        return {
            "request_id": request_id,
            "statusCode": 502,
            "body": {
                "ok": False,
                "error": str(exc),
            },
            "completed_at": iso_now(),
        }


def main() -> int:
    write_state()
    while True:
        try:
            request_payload = claim_request()
            write_state()
            if request_payload is None:
                time.sleep(IDLE_BACKOFF_SECONDS)
                continue
            request_id = str(request_payload.get("id", "")).strip()
            if not request_id:
                continue
            response_payload = call_local_bridge(request_payload)
            complete_request(request_id, response_payload)
            write_state()
        except KeyboardInterrupt:
            return 0
        except Exception as exc:
            print(f"[printer-connector] {exc}", file=sys.stderr, flush=True)
            time.sleep(IDLE_BACKOFF_SECONDS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
