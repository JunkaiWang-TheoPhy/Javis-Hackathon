#!/usr/bin/env python3
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from bootstrap_stack import (
        TUNNEL_STATE_PATH,
        ROOT as SCRIPT_ROOT,
        load_local_bridge_url,
        read_public_bridge_url,
        url_is_healthy,
    )
except ModuleNotFoundError:
    from tools.printer_bridge.bootstrap_stack import (
        TUNNEL_STATE_PATH,
        ROOT as SCRIPT_ROOT,
        load_local_bridge_url,
        read_public_bridge_url,
        url_is_healthy,
    )


DEFAULT_MEDIA = "three_inch"
BRIDGE_ENV_FILE = Path.home() / ".openclaw-printer-bridge.env"
UP_SCRIPT = SCRIPT_ROOT / "up.sh"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Print an image through the local OpenClaw printer bridge."
    )
    parser.add_argument("source_path", type=Path, help="Path to the image file to print")
    parser.add_argument("--media", default=DEFAULT_MEDIA, help="Bridge media alias or explicit media value")
    parser.add_argument("--fit-to-page", action="store_true", help="Ask the bridge to fit the image to the selected media")
    parser.add_argument("--dry-run", action="store_true", help="Resolve inputs and output the request without submitting a print job")
    parser.add_argument("--bridge-url", help="Explicit bridge base URL to use instead of local/tunnel discovery")
    parser.add_argument("--no-ensure-stack", action="store_true", help="Do not call up.sh when no healthy bridge URL is available")
    return parser.parse_args(argv)


def read_bridge_token() -> str:
    if os.environ.get("OPENCLAW_PRINTER_BRIDGE_TOKEN"):
        return os.environ["OPENCLAW_PRINTER_BRIDGE_TOKEN"]
    if not BRIDGE_ENV_FILE.is_file():
        raise RuntimeError(f"missing bridge env file: {BRIDGE_ENV_FILE}")
    for line in BRIDGE_ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.startswith("export OPENCLAW_PRINTER_BRIDGE_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    raise RuntimeError("bridge token not found in local env file")


def build_print_payload(
    source_path: Path,
    *,
    media: str = DEFAULT_MEDIA,
    fit_to_page: bool = False,
) -> dict[str, object]:
    if not source_path.is_file():
        raise FileNotFoundError(source_path)
    return {
        "content_base64": base64.b64encode(source_path.read_bytes()).decode("ascii"),
        "filename": source_path.name,
        "media": media,
        "fit_to_page": fit_to_page,
    }


def resolve_bridge_url(
    *,
    local_bridge_url: str | None = None,
    public_bridge_url: str | None = None,
    health_checker=url_is_healthy,
) -> str | None:
    local_bridge_url = local_bridge_url or load_local_bridge_url()
    public_bridge_url = public_bridge_url or read_public_bridge_url(TUNNEL_STATE_PATH)

    if local_bridge_url and health_checker(local_bridge_url):
        return local_bridge_url
    if public_bridge_url and health_checker(public_bridge_url):
        return public_bridge_url
    return None


def ensure_bridge_url() -> str:
    current = resolve_bridge_url()
    if current:
        return current

    result = os.spawnlp(os.P_WAIT, "zsh", "zsh", str(UP_SCRIPT), "--skip-remote-gateway")
    if result != 0:
        raise RuntimeError("up.sh failed while ensuring printer bridge availability")

    refreshed = resolve_bridge_url()
    if refreshed:
        return refreshed
    raise RuntimeError("no healthy bridge URL available after up.sh")


def submit_print_request(bridge_url: str, token: str, payload: dict[str, object]) -> dict[str, object]:
    request = urllib.request.Request(
        f"{bridge_url}/v1/printers/default/print-image",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"bridge returned {exc.code}: {body}") from exc


def format_result(
    *,
    bridge_url: str,
    response_payload: dict[str, object],
    dry_run: bool,
) -> str:
    payload = {
        "ok": response_payload.get("ok", True),
        "bridge_url": bridge_url,
        "dry_run": dry_run,
        **response_payload,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    payload = build_print_payload(
        args.source_path,
        media=args.media,
        fit_to_page=args.fit_to_page,
    )

    try:
        bridge_url = args.bridge_url or resolve_bridge_url()
        if not bridge_url and not args.no_ensure_stack and not args.dry_run:
            bridge_url = ensure_bridge_url()
        if not bridge_url:
            raise RuntimeError("no healthy bridge URL available")

        if args.dry_run:
            print(
                format_result(
                    bridge_url=bridge_url,
                    response_payload={
                        "ok": True,
                        "filename": payload["filename"],
                        "media": payload["media"],
                        "fit_to_page": payload["fit_to_page"],
                    },
                    dry_run=True,
                )
            )
            return 0

        token = read_bridge_token()
        response_payload = submit_print_request(bridge_url, token, payload)
        print(format_result(bridge_url=bridge_url, response_payload=response_payload, dry_run=False))
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": str(exc),
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
