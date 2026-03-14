#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time

from gateway_client import DEFAULT_BASE_URL, fetch_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Poll the Mi Band gateway HTTP endpoints.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--timeout", type=float, default=5.0)
    parser.add_argument(
        "--path",
        action="append",
        dest="paths",
        help="Endpoint path to fetch. Repeat to fetch multiple endpoints.",
    )
    parser.add_argument(
        "--watch",
        type=float,
        default=0.0,
        help="Repeat the fetch every N seconds. Default is once.",
    )
    args = parser.parse_args()

    paths = args.paths or ["/status", "/debug/source", "/health/latest"]

    while True:
        for path in paths:
            payload = fetch_json(args.base_url, path, timeout=args.timeout)
            print(f"== {path} ==")
            print(json.dumps(payload, indent=2, ensure_ascii=False))
        if args.watch <= 0:
            return 0
        time.sleep(args.watch)


if __name__ == "__main__":
    raise SystemExit(main())
