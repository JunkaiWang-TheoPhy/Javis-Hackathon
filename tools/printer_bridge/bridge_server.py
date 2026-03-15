import base64
import json
import os
import re
import subprocess
import tempfile
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "bridge_config.json"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
PDF_EXTENSIONS = {".pdf"}


def load_bridge_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def resolve_media_alias(media: str) -> str:
    cfg = load_bridge_config()
    actual = cfg["media_aliases"].get(media, media)
    if actual not in cfg["supported_media"]:
        raise ValueError(f"unsupported media: {media}")
    return actual


def is_authorized(auth_header: str, expected_token: str) -> bool:
    if not auth_header or not expected_token:
        return False
    return auth_header.strip() == f"Bearer {expected_token}"


def _assert_supported_extension(candidate: str, job_kind: str) -> None:
    extension = Path(candidate).suffix.lower()
    allowed = IMAGE_EXTENSIONS if job_kind == "image" else PDF_EXTENSIONS
    if extension not in allowed:
        raise ValueError(f"unsupported {job_kind} file type: {candidate}")


def validate_print_request(payload: dict[str, Any], job_kind: str) -> dict[str, Any]:
    source_path = payload.get("source_path")
    source_url = payload.get("source_url")
    content_base64 = payload.get("content_base64")
    filename = payload.get("filename")

    if not any([source_path, source_url, content_base64]):
        raise ValueError("one of source_path, source_url, or content_base64 is required")

    if source_path:
        _assert_supported_extension(str(source_path), job_kind)
    if source_url:
        _assert_supported_extension(str(source_url), job_kind)
    if content_base64:
        if not filename:
            raise ValueError("filename is required when content_base64 is provided")
        _assert_supported_extension(str(filename), job_kind)

    return {
        "media": resolve_media_alias(str(payload.get("media", "three_inch"))),
        "fit_to_page": bool(payload.get("fit_to_page", False)),
        "source_path": source_path,
        "source_url": source_url,
        "content_base64": content_base64,
        "filename": filename,
    }


def build_print_command(
    queue_name: str,
    media: str,
    job_path: str,
    fit_to_page: bool = False,
) -> list[str]:
    command = ["lp", "-d", queue_name, "-o", f"media={media}"]
    if fit_to_page:
        command.extend(["-o", "fit-to-page"])
    command.append(job_path)
    return command


def run_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=False, capture_output=True, text=True)


def _stage_content(payload: dict[str, Any]) -> tuple[str, bool]:
    if payload["source_path"]:
        return str(payload["source_path"]), False

    if payload["content_base64"]:
        suffix = Path(str(payload["filename"])).suffix or ".bin"
        fd, temp_path = tempfile.mkstemp(prefix="openclaw-printer-", suffix=suffix)
        with os.fdopen(fd, "wb") as handle:
            handle.write(base64.b64decode(payload["content_base64"]))
        return temp_path, True

    suffix = Path(str(payload["source_url"])).suffix or ".bin"
    fd, temp_path = tempfile.mkstemp(prefix="openclaw-printer-", suffix=suffix)
    os.close(fd)
    urllib.request.urlretrieve(str(payload["source_url"]), temp_path)
    return temp_path, True


def _extract_job_id(stdout: str) -> str:
    for pattern in (
        r"request id is (\S+)",
        r"请求id是(\S+)",
    ):
        match = re.search(pattern, stdout)
        if match:
            return match.group(1)
    return stdout.strip() or "unknown"


def get_expected_token() -> str:
    cfg = load_bridge_config()
    return os.environ.get(str(cfg["token_env_var"]), "")


def build_status_payload() -> dict[str, Any]:
    cfg = load_bridge_config()
    printer = run_command(["lpstat", "-p", str(cfg["queue_name"]), "-l"])
    jobs = run_command(["lpstat", "-W", "not-completed", "-o", str(cfg["queue_name"])])

    return {
        "ok": True,
        "printer": {
            "queue_name": cfg["queue_name"],
            "display_name": cfg["display_name"],
            "supported_media": cfg["supported_media"],
        },
        "printer_status": printer.stdout.strip(),
        "active_jobs": [line for line in jobs.stdout.splitlines() if line.strip()],
    }


def submit_print_job(payload: dict[str, Any], job_kind: str) -> dict[str, Any]:
    cfg = load_bridge_config()
    validated = validate_print_request(payload, job_kind=job_kind)
    job_path, _is_temp = _stage_content(validated)
    command = build_print_command(
        queue_name=str(cfg["queue_name"]),
        media=str(validated["media"]),
        job_path=job_path,
        fit_to_page=bool(validated["fit_to_page"]),
    )
    result = run_command(command)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "lp failed")

    return {
        "ok": True,
        "job_id": _extract_job_id(result.stdout),
        "queue_name": cfg["queue_name"],
        "media": validated["media"],
        "job_path": job_path,
    }


def cancel_job(job_id: str) -> dict[str, Any]:
    result = run_command(["cancel", job_id])
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "cancel failed")
    return {"ok": True, "job_id": job_id}


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "OpenClawPrinterBridge/1.0"

    def _write_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _require_auth(self) -> bool:
        if is_authorized(self.headers.get("Authorization", ""), get_expected_token()):
            return True
        self._write_json(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "unauthorized"})
        return False

    def do_GET(self) -> None:
        if self.path == "/health":
            self._write_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "service": "openclaw-printer-bridge",
                    "queue_name": load_bridge_config()["queue_name"],
                },
            )
            return

        if self.path == "/v1/printers/default":
            if not self._require_auth():
                return
            self._write_json(HTTPStatus.OK, build_status_payload())
            return

        self._write_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        try:
            if not self._require_auth():
                return

            payload = self._read_json()
            if self.path == "/v1/printers/default/print-image":
                self._write_json(HTTPStatus.OK, submit_print_job(payload, job_kind="image"))
                return

            if self.path == "/v1/printers/default/print-pdf":
                self._write_json(HTTPStatus.OK, submit_print_job(payload, job_kind="pdf"))
                return

            if self.path == "/v1/jobs/cancel":
                job_id = str(payload.get("job_id", "")).strip()
                if not job_id:
                    raise ValueError("job_id is required")
                self._write_json(HTTPStatus.OK, cancel_job(job_id))
                return

            self._write_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})
        except ValueError as exc:
            self._write_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
        except RuntimeError as exc:
            self._write_json(HTTPStatus.BAD_GATEWAY, {"ok": False, "error": str(exc)})

    def log_message(self, _format: str, *_args: Any) -> None:
        return


def create_server() -> ThreadingHTTPServer:
    cfg = load_bridge_config()
    return ThreadingHTTPServer((str(cfg["listen_host"]), int(cfg["listen_port"])), BridgeHandler)


def main() -> None:
    server = create_server()
    print(
        f"OpenClaw printer bridge listening on http://{server.server_address[0]}:{server.server_address[1]}"
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
