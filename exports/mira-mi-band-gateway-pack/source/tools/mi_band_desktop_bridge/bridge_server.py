#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import time
from collections import deque
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "bridge_config.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import parser as band_parser


def load_bridge_config(path: Path = CONFIG_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def is_authorized(auth_header: str, expected_token: str) -> bool:
    if not auth_header or not expected_token:
        return False
    return auth_header.strip() == f"Bearer {expected_token}"


def get_expected_token(config: dict[str, Any]) -> str:
    env_var = str(config.get("token_env_var", "OPENCLAW_MI_BAND_BRIDGE_TOKEN"))
    return os.environ.get(env_var, "")


def get_adb_target_env_var(config: dict[str, Any]) -> str:
    return str(config.get("adb_target_env_var", "OPENCLAW_MI_BAND_ADB_TARGET"))


def resolve_wireless_adb_target(config: dict[str, Any]) -> str | None:
    wireless = config.get("wireless_adb", {})
    host = str(wireless.get("host", "")).strip()
    port = int(wireless.get("port", 5555) or 5555)
    if not host:
        return None
    return f"{host}:{port}"


def resolve_adb_target(config: dict[str, Any]) -> str:
    env_target = os.environ.get(get_adb_target_env_var(config), "").strip()
    if env_target:
        return env_target

    wireless = config.get("wireless_adb", {})
    wireless_target = resolve_wireless_adb_target(config)
    if bool(wireless.get("enabled")) and wireless_target:
        return wireless_target

    return str(config["adb_serial"])


def resolve_adb_transport(config: dict[str, Any]) -> str:
    target = resolve_adb_target(config)
    return "wireless" if ":" in target else "usb"


class AdbCollector:
    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config
        self.adb_path = str(config["adb_path"])
        self.adb_target = resolve_adb_target(config)
        self.adb_transport = resolve_adb_transport(config)

    def run(self, args: list[str], timeout: float = 20.0) -> subprocess.CompletedProcess[str]:
        command = [self.adb_path, "-s", self.adb_target, *args]
        return subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout)

    def shell(self, command: str, timeout: float = 20.0) -> subprocess.CompletedProcess[str]:
        return self.run(["shell", command], timeout=timeout)

    def get_state(self) -> str:
        result = self.run(["get-state"], timeout=10.0)
        if result.returncode != 0:
            return "disconnected"
        return result.stdout.strip() or "unknown"

    def bluetooth_dump(self) -> str:
        return self.shell("dumpsys bluetooth_manager | sed -n '1,220p'", timeout=20.0).stdout

    def logcat_dump(self) -> str:
        return self.shell(
            "logcat -d | (toybox grep -E 'HomeDataRepository|recent_data_changed_broadcast|device_sync|server_sync|Spo2Item|HrItem|DailyStepReport|reportDeviceActive' 2>/dev/null || grep -E 'HomeDataRepository|recent_data_changed_broadcast|device_sync|server_sync|Spo2Item|HrItem|DailyStepReport|reportDeviceActive' 2>/dev/null || cat)",
            timeout=30.0,
        ).stdout

    def external_log_dump(self) -> str:
        chunks: list[str] = []
        for path in self.config.get("xiaomi_log_dirs", []):
            if path.endswith("/wearablelog"):
                list_cmd = f"latest=$(ls -td {path}/* 2>/dev/null | head -1); if [ -n \"$latest\" ]; then find \"$latest\" -maxdepth 2 -type f | head -4; fi"
                listing = self.shell(list_cmd, timeout=15.0).stdout.splitlines()
                for file_path in listing[:4]:
                    file_path = file_path.strip()
                    if not file_path:
                        continue
                    tail = self.shell(f"tail -n 120 {file_path}", timeout=20.0).stdout
                    if tail:
                        chunks.append(f"FILE:{file_path}\n{tail}")
                continue

            listing = self.shell(f"ls -t {path} 2>/dev/null | head -2", timeout=10.0).stdout.splitlines()
            for name in listing[:2]:
                name = name.strip()
                if not name:
                    continue
                tail = self.shell(f"tail -n 120 {path}/{name}", timeout=20.0).stdout
                if tail:
                    chunks.append(f"FILE:{path}/{name}\n{tail}")
        return "\n".join(chunks)

    def collect(self) -> dict[str, Any]:
        bridge_timestamp = datetime.now(band_parser.TZ).isoformat()
        adb_state = self.get_state()
        bluetooth_text = self.bluetooth_dump() if adb_state == "device" else ""
        logcat_text = self.logcat_dump() if adb_state == "device" else ""

        metric_data = band_parser.parse_metric_snapshot(logcat_text)
        evidence = {
            "adb_state": adb_state,
            "logcat": band_parser.extract_evidence_lines(logcat_text),
            "external_logs": {},
        }
        source_kind = "adb_logcat"

        if not any(
            metric_data["metrics"][key] is not None
            for key in ("heart_rate_bpm", "spo2_percent", "steps")
        ):
            external_text = self.external_log_dump()
            fallback_metrics = band_parser.parse_metric_snapshot(external_text)
            if any(
                fallback_metrics["metrics"][key] is not None
                for key in ("heart_rate_bpm", "spo2_percent", "steps")
            ):
                metric_data = fallback_metrics
                evidence["external_logs"] = band_parser.extract_evidence_lines(external_text)
                source_kind = "xiaomi_external_logs"

        bluetooth = band_parser.parse_bluetooth_status(
            bluetooth_text,
            band_mac=str(self.config["band"]["mac"]),
            band_name=str(self.config["band"]["name"]),
        )

        freshness = band_parser.freshness_seconds(
            metric_data["timestamps"]["source_timestamp"],
            bridge_timestamp,
        )

        snapshot = {
            "ok": True,
            "device": self.config["band"],
            "phone": {
                "adb_serial": str(self.config["adb_serial"]),
                "adb_target": self.adb_target,
                "adb_transport": self.adb_transport,
                "model": self.config["phone"]["model"],
            },
            "connection": {
                "status": bluetooth["connection_status"],
                "last_seen_at": metric_data["timestamps"]["source_timestamp"] or bridge_timestamp,
            },
            "metrics": metric_data["metrics"],
            "timestamps": {
                "source_timestamp": metric_data["timestamps"]["source_timestamp"],
                "bridge_timestamp": bridge_timestamp,
            },
            "source": {
                "kind": source_kind,
                "freshness_seconds": freshness,
            },
        }

        events = band_parser.parse_events(logcat_text, year=datetime.now(band_parser.TZ).year)
        status = {
            "ok": True,
            "service": "openclaw-mi-band-bridge",
            "adb_ready": adb_state == "device",
            "adb_target": self.adb_target,
            "adb_transport": self.adb_transport,
            "bluetooth_ready": bluetooth["bluetooth_enabled"],
            "metrics_ready": all(
                snapshot["metrics"][key] is not None for key in ("heart_rate_bpm", "spo2_percent", "steps")
            ),
            "local_source_ready": any(
                snapshot["metrics"][key] is not None for key in ("heart_rate_bpm", "spo2_percent", "steps")
            ),
            "connection_status": bluetooth["connection_status"],
            "last_refresh_at": bridge_timestamp,
            "source_kind": source_kind,
        }
        alerts = build_alerts(status, snapshot)

        return {
            "snapshot": snapshot,
            "status": status,
            "events": events,
            "alerts": alerts,
            "debug": evidence,
        }


def build_alerts(status: dict[str, Any], snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    bridge_timestamp = str(snapshot["timestamps"]["bridge_timestamp"])
    alerts: list[dict[str, Any]] = []
    if not status["adb_ready"]:
        alerts.append(_alert("adb_disconnected", "adb is not in device state", bridge_timestamp))
    if snapshot["connection"]["status"] not in {"connected", "bonded"}:
        alerts.append(_alert("band_offline", f"band status={snapshot['connection']['status']}", bridge_timestamp))
    if band_parser.is_stale(snapshot["timestamps"]["source_timestamp"], bridge_timestamp):
        alerts.append(_alert("stale_metrics", "latest metric sample is older than 5 minutes", bridge_timestamp))
    return alerts


def _alert(alert_type: str, summary: str, timestamp: str) -> dict[str, str]:
    return {
        "type": alert_type,
        "summary": summary,
        "timestamp": timestamp,
        "active": "true",
    }


class BridgeRuntime:
    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config
        self.collector = AdbCollector(config)
        self.lock = threading.Lock()
        self.snapshot: dict[str, Any] = {
            "ok": True,
            "device": config["band"],
            "phone": {
                "adb_serial": config["adb_serial"],
                "adb_target": resolve_adb_target(config),
                "adb_transport": resolve_adb_transport(config),
                "model": config["phone"]["model"],
            },
            "connection": {"status": "unknown", "last_seen_at": None},
            "metrics": {
                "heart_rate_bpm": None,
                "heart_rate_at": None,
                "spo2_percent": None,
                "spo2_at": None,
                "steps": None,
                "distance_m": None,
                "calories_kcal": None,
                "steps_at": None,
            },
            "timestamps": {"source_timestamp": None, "bridge_timestamp": None},
            "source": {"kind": "uninitialized", "freshness_seconds": None},
        }
        self.status: dict[str, Any] = {
            "ok": True,
            "service": "openclaw-mi-band-bridge",
            "adb_ready": False,
            "adb_target": resolve_adb_target(config),
            "adb_transport": resolve_adb_transport(config),
            "bluetooth_ready": False,
            "metrics_ready": False,
            "local_source_ready": False,
            "connection_status": "unknown",
            "last_refresh_at": None,
            "source_kind": "uninitialized",
        }
        self.events: deque[dict[str, Any]] = deque(maxlen=int(config.get("event_limit", 200)))
        self.alerts: list[dict[str, Any]] = []
        self.debug: dict[str, Any] = {}
        self._seen_event_ids: set[str] = set()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread is not None:
            return
        self.refresh(force=True)
        self._thread = threading.Thread(target=self._run_loop, name="mi-band-desktop-bridge", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)

    def refresh(self, force: bool = False) -> None:
        with self.lock:
            if not force and self.status["last_refresh_at"]:
                last = datetime.fromisoformat(str(self.status["last_refresh_at"]))
                age = (datetime.now(band_parser.TZ) - last).total_seconds()
                if age < int(self.config.get("poll_seconds", 60)):
                    return

        collected = self.collector.collect()
        with self.lock:
            previous_metrics = dict(self.snapshot["metrics"])
            self.snapshot = collected["snapshot"]
            self.status = collected["status"]
            self.alerts = collected["alerts"]
            self.debug = collected["debug"]
            for event in collected["events"]:
                event_id = str(event["id"])
                if event_id in self._seen_event_ids:
                    continue
                self._seen_event_ids.add(event_id)
                self.events.appendleft(event)
            if previous_metrics != self.snapshot["metrics"]:
                self.events.appendleft(
                    {
                        "id": f"metric-{int(time.time())}",
                        "type": "metric_updated",
                        "timestamp": self.snapshot["timestamps"]["bridge_timestamp"],
                        "summary": "metrics changed",
                        "details": {
                            "metrics": self.snapshot["metrics"],
                        },
                    }
                )

    def _run_loop(self) -> None:
        poll_seconds = int(self.config.get("poll_seconds", 60))
        while not self._stop.is_set():
            try:
                self.refresh(force=True)
            except Exception as exc:  # pragma: no cover - defensive runtime path
                stamp = datetime.now(band_parser.TZ).isoformat()
                with self.lock:
                    self.events.appendleft(
                        {
                            "id": f"collector-warning-{int(time.time())}",
                            "type": "collector_warning",
                            "timestamp": stamp,
                            "summary": str(exc),
                            "details": {"exception": type(exc).__name__},
                        }
                    )
                    self.alerts = [_alert("collector_stopped", str(exc), stamp)]
            self._stop.wait(poll_seconds)

    def get_snapshot(self) -> dict[str, Any]:
        self.refresh(force=False)
        with self.lock:
            return self.snapshot

    def get_status(self) -> dict[str, Any]:
        self.refresh(force=False)
        with self.lock:
            return self.status

    def get_events(self, limit: int = 50) -> dict[str, Any]:
        self.refresh(force=False)
        with self.lock:
            return {"ok": True, "events": list(self.events)[:limit]}

    def get_alerts(self, active_only: bool = True) -> dict[str, Any]:
        self.refresh(force=False)
        with self.lock:
            alerts = self.alerts
            if active_only:
                alerts = [alert for alert in alerts if alert.get("active") == "true"]
            return {"ok": True, "alerts": alerts}

    def get_debug(self) -> dict[str, Any]:
        self.refresh(force=False)
        with self.lock:
            return {"ok": True, "debug": self.debug}


class BridgeHandler(BaseHTTPRequestHandler):
    server_version = "OpenClawMiBandBridge/1.0"

    @property
    def runtime(self) -> BridgeRuntime:
        return self.server.runtime  # type: ignore[attr-defined]

    @property
    def config(self) -> dict[str, Any]:
        return self.server.bridge_config  # type: ignore[attr-defined]

    def _write_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _require_auth(self) -> bool:
        if is_authorized(self.headers.get("Authorization", ""), get_expected_token(self.config)):
            return True
        self._write_json(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "unauthorized"})
        return False

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._write_json(
                HTTPStatus.OK,
                {"ok": True, "service": "openclaw-mi-band-bridge", "port": self.config["port"]},
            )
            return

        if not self._require_auth():
            return

        if parsed.path == "/v1/band/status":
            self._write_json(HTTPStatus.OK, self.runtime.get_status())
            return
        if parsed.path == "/v1/band/latest":
            self._write_json(HTTPStatus.OK, self.runtime.get_snapshot())
            return
        if parsed.path == "/v1/band/events":
            query = parse_qs(parsed.query)
            limit = int(query.get("limit", ["50"])[0])
            self._write_json(HTTPStatus.OK, self.runtime.get_events(limit=limit))
            return
        if parsed.path == "/v1/band/alerts":
            query = parse_qs(parsed.query)
            active = query.get("active", ["true"])[0].lower() != "false"
            self._write_json(HTTPStatus.OK, self.runtime.get_alerts(active_only=active))
            return
        if parsed.path == "/v1/band/debug/evidence":
            self._write_json(HTTPStatus.OK, self.runtime.get_debug())
            return

        self._write_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})

    def log_message(self, _format: str, *_args: Any) -> None:
        return


def build_server(config: dict[str, Any]) -> ThreadingHTTPServer:
    runtime = BridgeRuntime(config)
    runtime.start()
    server = ThreadingHTTPServer((str(config["host"]), int(config["port"])), BridgeHandler)
    server.runtime = runtime  # type: ignore[attr-defined]
    server.bridge_config = config  # type: ignore[attr-defined]
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local Mi Band desktop bridge.")
    parser.add_argument("--config", default=str(CONFIG_PATH), help="Path to bridge config JSON")
    parser.add_argument("--port", type=int, help="Override listen port")
    parser.add_argument("--once", action="store_true", help="Print one snapshot JSON and exit")
    args = parser.parse_args()

    config = load_bridge_config(Path(args.config))
    if args.port:
        config["port"] = args.port

    if args.once:
        runtime = BridgeRuntime(config)
        runtime.refresh(force=True)
        print(json.dumps(runtime.get_snapshot(), ensure_ascii=False, indent=2))
        return

    server = build_server(config)
    print(
        f"OpenClaw Mi Band bridge listening on http://{config['host']}:{config['port']}",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.runtime.stop()  # type: ignore[attr-defined]
        server.server_close()


if __name__ == "__main__":
    main()
