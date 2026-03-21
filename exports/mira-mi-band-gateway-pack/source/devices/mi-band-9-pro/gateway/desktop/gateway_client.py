#!/usr/bin/env python3
from __future__ import annotations

import json
from typing import Iterator
from urllib.request import urlopen

DEFAULT_BASE_URL = "http://127.0.0.1:8765"


def build_url(base_url: str, path: str) -> str:
    normalized_base = base_url.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{normalized_base}{normalized_path}"


def fetch_json(base_url: str, path: str, timeout: float = 5.0):
    with urlopen(build_url(base_url, path), timeout=timeout) as response:
        encoding = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(encoding))


def parse_sse_block(block: str) -> dict[str, str]:
    payload = {"event": "message", "data": ""}
    for line in block.splitlines():
        if not line or line.startswith(":") or ":" not in line:
            continue
        field, value = line.split(":", 1)
        value = value.lstrip()
        if field == "event":
            payload["event"] = value
        elif field == "data":
            payload["data"] = f"{payload['data']}\n{value}".strip()
    return payload


def is_empty_event(payload: dict[str, str]) -> bool:
    return payload.get("event") == "message" and not payload.get("data")


def iter_sse_events(
    base_url: str = DEFAULT_BASE_URL,
    path: str = "/events",
    timeout: float = 65.0,
) -> Iterator[dict[str, str]]:
    with urlopen(build_url(base_url, path), timeout=timeout) as response:
        encoding = response.headers.get_content_charset() or "utf-8"
        buffer: list[str] = []
        for raw_line in response:
            line = raw_line.decode(encoding).rstrip("\r\n")
            if line == "":
                if buffer:
                    payload = parse_sse_block("\n".join(buffer))
                    if not is_empty_event(payload):
                        yield payload
                    buffer.clear()
                continue
            buffer.append(line)

        if buffer:
            payload = parse_sse_block("\n".join(buffer))
            if not is_empty_event(payload):
                yield payload
