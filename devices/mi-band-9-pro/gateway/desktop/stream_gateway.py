#!/usr/bin/env python3
from __future__ import annotations

import argparse

from gateway_client import DEFAULT_BASE_URL, iter_sse_events


def main() -> int:
    parser = argparse.ArgumentParser(description="Stream SSE events from the Mi Band gateway.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--path", default="/events")
    parser.add_argument("--timeout", type=float, default=65.0)
    parser.add_argument("--limit", type=int, default=0, help="Stop after N events.")
    args = parser.parse_args()

    count = 0
    for event in iter_sse_events(args.base_url, args.path, timeout=args.timeout):
        print(f"[{event['event']}] {event['data']}")
        count += 1
        if args.limit and count >= args.limit:
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
