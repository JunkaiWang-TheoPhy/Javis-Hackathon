#!/usr/bin/env python3
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


PENDING_DIR_NAME = "pending"
CLAIMED_DIR_NAME = "claimed"
RESPONSES_DIR_NAME = "responses"
HEARTBEATS_DIR_NAME = "heartbeats"


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def ensure_queue_dirs(queue_root: Path) -> dict[str, Path]:
    paths = {
        "root": queue_root,
        "pending": queue_root / PENDING_DIR_NAME,
        "claimed": queue_root / CLAIMED_DIR_NAME,
        "responses": queue_root / RESPONSES_DIR_NAME,
        "heartbeats": queue_root / HEARTBEATS_DIR_NAME,
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return paths


def heartbeat_path(queue_root: Path, worker: str) -> Path:
    return queue_root / HEARTBEATS_DIR_NAME / f"{worker}.json"


def write_heartbeat(queue_root: Path, worker: str, *, note: str | None = None) -> None:
    payload = {
        "worker": worker,
        "updated_at": iso_now(),
    }
    if note:
        payload["note"] = note
    heartbeat_path(queue_root, worker).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def requeue_stale_claims(queue_root: Path, lease_seconds: float) -> None:
    paths = ensure_queue_dirs(queue_root)
    cutoff = time.time() - lease_seconds
    for claimed_path in sorted(paths["claimed"].glob("*.json")):
        try:
            mtime = claimed_path.stat().st_mtime
        except FileNotFoundError:
            continue
        if mtime >= cutoff:
            continue
        pending_path = paths["pending"] / claimed_path.name
        if pending_path.exists():
            claimed_path.unlink(missing_ok=True)
            continue
        os.replace(claimed_path, pending_path)


def claim_request(
    queue_root: Path,
    worker: str,
    *,
    wait_seconds: float,
    poll_interval: float,
    lease_seconds: float,
) -> dict | None:
    paths = ensure_queue_dirs(queue_root)
    deadline = time.monotonic() + wait_seconds
    while True:
        requeue_stale_claims(queue_root, lease_seconds)
        write_heartbeat(queue_root, worker, note="idle")
        for pending_path in sorted(paths["pending"].glob("*.json")):
            claimed_path = paths["claimed"] / pending_path.name
            try:
                os.replace(pending_path, claimed_path)
            except FileNotFoundError:
                continue
            payload = json.loads(claimed_path.read_text(encoding="utf-8"))
            write_heartbeat(queue_root, worker, note=f"claimed:{payload.get('id', pending_path.stem)}")
            return payload
        if time.monotonic() >= deadline:
            return None
        time.sleep(poll_interval)


def complete_request(
    queue_root: Path,
    worker: str,
    *,
    request_id: str,
    response_payload: dict,
) -> None:
    paths = ensure_queue_dirs(queue_root)
    response_path = paths["responses"] / f"{request_id}.json"
    response_path.write_text(
        json.dumps(response_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (paths["claimed"] / f"{request_id}.json").unlink(missing_ok=True)
    write_heartbeat(queue_root, worker, note=f"completed:{request_id}")


def read_status(queue_root: Path) -> dict:
    paths = ensure_queue_dirs(queue_root)
    workers: list[dict] = []
    newest_age_seconds: float | None = None
    now = datetime.now(timezone.utc)

    for heartbeat in sorted(paths["heartbeats"].glob("*.json")):
        payload = json.loads(heartbeat.read_text(encoding="utf-8"))
        updated_at = payload.get("updated_at")
        age_seconds = None
        if isinstance(updated_at, str):
            try:
                age_seconds = (
                    now - datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                ).total_seconds()
            except ValueError:
                age_seconds = None
        if age_seconds is not None:
            newest_age_seconds = age_seconds if newest_age_seconds is None else min(newest_age_seconds, age_seconds)
        workers.append(
            {
                "worker": payload.get("worker", heartbeat.stem),
                "updated_at": updated_at,
                "age_seconds": age_seconds,
                "note": payload.get("note"),
            }
        )

    return {
        "ok": True,
        "queue_root": str(queue_root),
        "pending_requests": len(list(paths["pending"].glob("*.json"))),
        "claimed_requests": len(list(paths["claimed"].glob("*.json"))),
        "workers": workers,
        "latest_heartbeat_age_seconds": newest_age_seconds,
        "connector_online": newest_age_seconds is not None and newest_age_seconds <= 90.0,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Admin helper for the OpenClaw printer bridge request queue.")
    parser.add_argument("command", choices=("claim", "complete", "status"))
    parser.add_argument("--queue-root", type=Path, required=True)
    parser.add_argument("--worker", default="mac-printer-connector")
    parser.add_argument("--wait-seconds", type=float, default=20.0)
    parser.add_argument("--poll-interval", type=float, default=1.0)
    parser.add_argument("--lease-seconds", type=float, default=90.0)
    parser.add_argument("--request-id")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.command == "claim":
        payload = claim_request(
            args.queue_root,
            args.worker,
            wait_seconds=args.wait_seconds,
            poll_interval=args.poll_interval,
            lease_seconds=args.lease_seconds,
        )
        if payload is not None:
            print(json.dumps(payload, ensure_ascii=False))
        return

    if args.command == "complete":
        if not args.request_id:
            raise SystemExit("--request-id is required for complete")
        response_payload = json.load(sys.stdin)
        complete_request(
            args.queue_root,
            args.worker,
            request_id=args.request_id,
            response_payload=response_payload,
        )
        return

    print(json.dumps(read_status(args.queue_root), ensure_ascii=False))


if __name__ == "__main__":
    main()
