#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request


DEFAULT_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
DEFAULT_MODEL = "doubao-seedream-5-0-260128"
DEFAULT_PROMPT = "一只橘猫坐在窗边，极简插画风格"
DEFAULT_SIZE = "1024x1024"
DEFAULT_RESPONSE_FORMAT = "url"
DEFAULT_TIMEOUT = 60


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Smoke test a Seedream image generation call through Volcengine Ark."
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("ARK_API_KEY", ""),
        help="Ark API key. Defaults to ARK_API_KEY if set.",
    )
    parser.add_argument("--url", default=DEFAULT_API_URL, help="Ark image generation endpoint URL.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model id to test.")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT, help="Prompt used for the test request.")
    parser.add_argument("--size", default=DEFAULT_SIZE, help="Requested image size.")
    parser.add_argument(
        "--response-format",
        default=DEFAULT_RESPONSE_FORMAT,
        choices=["url", "b64_json"],
        help="Expected response payload format.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help="HTTP timeout in seconds.",
    )
    return parser.parse_args(argv)


def build_generation_payload(
    *,
    model: str,
    prompt: str,
    size: str,
    response_format: str,
) -> dict[str, object]:
    return {
        "model": model,
        "prompt": prompt,
        "size": size,
        "response_format": response_format,
    }


def post_json(
    url: str,
    payload: dict[str, object],
    api_key: str,
    timeout: int,
) -> tuple[int, dict[str, object]]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = {
                "error": {
                    "code": "HTTPError",
                    "message": body,
                }
            }
        return exc.code, parsed


def print_json(stream, payload: dict[str, object]) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2), file=stream)


def main(
    argv: list[str] | None = None,
    *,
    post_json=post_json,
) -> int:
    args = parse_args(argv)
    if not args.api_key:
        print_json(
            sys.stderr,
            {
                "ok": False,
                "error": {
                    "code": "MissingApiKey",
                    "message": "Provide --api-key or set ARK_API_KEY.",
                },
            },
        )
        return 2

    payload = build_generation_payload(
        model=args.model,
        prompt=args.prompt,
        size=args.size,
        response_format=args.response_format,
    )
    status_code, response_payload = post_json(args.url, payload, args.api_key, args.timeout)
    error = response_payload.get("error")

    if isinstance(error, dict):
        print_json(
            sys.stderr,
            {
                "ok": False,
                "status_code": status_code,
                "request": payload,
                "error": error,
            },
        )
        return 1

    print_json(
        sys.stdout,
        {
            "ok": True,
            "status_code": status_code,
            "request": payload,
            "response": response_payload,
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
