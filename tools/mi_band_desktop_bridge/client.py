#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "http://127.0.0.1:9782"
DEFAULT_TOKEN_ENV = "OPENCLAW_MI_BAND_BRIDGE_TOKEN"


def build_url(base_url: str, path: str) -> str:
    normalized_base = base_url.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{normalized_base}{normalized_path}"


def fetch_json(base_url: str, path: str, token: str, timeout: float = 30.0):
    request = Request(build_url(base_url, path))
    request.add_header("Authorization", f"Bearer {token}")
    with urlopen(request, timeout=timeout) as response:
        encoding = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(encoding))


def main() -> None:
    cli = argparse.ArgumentParser(description="Query the local Mi Band desktop bridge.")
    cli.add_argument("command", choices=["status", "latest", "events", "alerts", "debug"])
    cli.add_argument("--base-url", default=DEFAULT_BASE_URL)
    cli.add_argument("--limit", type=int, default=20)
    cli.add_argument("--token", default=os.environ.get(DEFAULT_TOKEN_ENV, ""))
    args = cli.parse_args()

    if not args.token:
        raise SystemExit(f"missing bridge token in --token or {DEFAULT_TOKEN_ENV}")

    path = {
        "status": "/v1/band/status",
        "latest": "/v1/band/latest",
        "events": f"/v1/band/events?limit={args.limit}",
        "alerts": "/v1/band/alerts?active=true",
        "debug": "/v1/band/debug/evidence",
    }[args.command]
    print(json.dumps(fetch_json(args.base_url, path, token=args.token), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
