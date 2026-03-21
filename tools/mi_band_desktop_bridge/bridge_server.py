#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shlex
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
from measurement_trigger import build_trigger


METRIC_LOG_PATTERN = r"latestHrRecord=HrItem|latestSpoRecord=Spo2Item|DailyStepReport\("
PREFERRED_XIAOMI_LOG_NAMES = (
    "XiaomiFit.main.log",
    "XiaomiFit.main.log.bak.1",
    "XiaomiFit.device.log",
    "XiaomiFit.device.log.bak.1",
    "Transfer.device.log",
    "Transfer.device.log.bak.1",
)


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


def build_metric_extract_command(file_path: str, limit: int = 120) -> str:
    quoted_path = shlex.quote(file_path)
    quoted_pattern = shlex.quote(METRIC_LOG_PATTERN)
    return (
        f"(toybox grep -E {quoted_pattern} {quoted_path} 2>/dev/null || "
        f"grep -E {quoted_pattern} {quoted_path} 2>/dev/null || "
        f"tail -n {limit} {quoted_path}) | tail -n {limit}"
    )


def has_metric_markers(text: str) -> bool:
    return any(marker in text for marker in ("latestHrRecord=HrItem", "latestSpoRecord=Spo2Item", "DailyStepReport("))


def prioritize_xiaomi_log_names(names: list[str]) -> list[str]:
    priority = {name: index for index, name in enumerate(PREFERRED_XIAOMI_LOG_NAMES)}
    cleaned = [name.strip() for name in names if name.strip()]
    return sorted(
        cleaned,
        key=lambda name: (priority.get(name, len(priority)), cleaned.index(name)),
    )


def read_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length else b"{}"
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


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

            listing = self.shell(f"ls -t {path} 2>/dev/null | head -6", timeout=10.0).stdout.splitlines()
            for name in prioritize_xiaomi_log_names(listing)[:4]:
                tail = self.shell(build_metric_extract_command(f"{path}/{name}"), timeout=20.0).stdout
                if tail:
                    chunks.append(f"FILE:{path}/{name}\n{tail}")
                    if has_metric_markers(tail):
                        break
        return "\n".join(chunks)

    def collect(self) -> dict[str, Any]:
        bridge_timestamp = datetime.now(band_parser.TZ).isoformat()
        adb_state = self.get_state()
        bluetooth_text = self.bluetooth_dump() if adb_state == "device" else ""
        logcat_text = ""
        external_text = self.external_log_dump() if adb_state == "device" else ""
        metric_data = band_parser.parse_metric_snapshot(external_text)
        evidence = {
            "adb_state": adb_state,
            "logcat": {},
            "external_logs": {},
        }
        source_kind = "xiaomi_external_logs"

        if any(
            metric_data["metrics"][key] is not None
            for key in ("heart_rate_bpm", "spo2_percent", "steps")
        ):
            evidence["external_logs"] = band_parser.extract_evidence_lines(external_text)
        else:
            logcat_text = self.logcat_dump() if adb_state == "device" else ""
            metric_data = band_parser.parse_metric_snapshot(logcat_text)
            evidence["logcat"] = band_parser.extract_evidence_lines(logcat_text)
            source_kind = "adb_logcat"

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


def resolve_fresh_read_settings(
    config: dict[str, Any],
    max_wait_seconds: float | None = None,
) -> dict[str, float]:
    fresh_read = config.get("fresh_read", {})
    default_wait = float(fresh_read.get("timeout_seconds", 60) or 60)
    return {
        "max_wait_seconds": max(1.0, float(max_wait_seconds or default_wait)),
        "poll_interval_seconds": max(0.05, float(fresh_read.get("poll_interval_seconds", 5) or 5)),
        "max_sample_age_seconds": max(1.0, float(fresh_read.get("max_sample_age_seconds", 60) or 60)),
    }


def get_heart_rate_timestamp(snapshot: dict[str, Any]) -> str | None:
    metrics = snapshot.get("metrics", {})
    return metrics.get("heart_rate_at") or snapshot.get("timestamps", {}).get("source_timestamp")


def heart_rate_sample_age_seconds(snapshot: dict[str, Any]) -> int | None:
    return band_parser.freshness_seconds(
        get_heart_rate_timestamp(snapshot),
        str(snapshot.get("timestamps", {}).get("bridge_timestamp")),
    )


def snapshot_has_fresh_heart_rate(
    snapshot: dict[str, Any],
    *,
    max_sample_age_seconds: float,
    baseline_metric_timestamp: str | None = None,
    require_newer_than_baseline: bool = False,
) -> bool:
    heart_rate = snapshot.get("metrics", {}).get("heart_rate_bpm")
    metric_timestamp = get_heart_rate_timestamp(snapshot)
    if heart_rate is None or not metric_timestamp:
        return False

    sample_age = heart_rate_sample_age_seconds(snapshot)
    if sample_age is None or sample_age > max_sample_age_seconds:
        return False

    if not require_newer_than_baseline or not baseline_metric_timestamp:
        return True

    return datetime.fromisoformat(metric_timestamp) > datetime.fromisoformat(baseline_metric_timestamp)


class BridgeRuntime:
    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config
        self.collector = AdbCollector(config)
        self.trigger = build_trigger(config, self.collector.shell)
        self.lock = threading.Lock()
        self.fresh_read_lock = threading.Lock()
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

    def _record_event(self, event_type: str, summary: str, details: dict[str, Any]) -> None:
        self.events.appendleft(
            {
                "id": f"{event_type}-{int(time.time() * 1000)}",
                "type": event_type,
                "timestamp": datetime.now(band_parser.TZ).isoformat(),
                "summary": summary,
                "details": details,
            }
        )

    def _snapshot_with_fresh_read(
        self,
        snapshot: dict[str, Any],
        *,
        ok: bool,
        reason: str,
        triggered: bool,
        trigger_result: dict[str, Any],
        settings: dict[str, float],
        baseline_metric_timestamp: str | None,
        request_started_at: str,
    ) -> dict[str, Any]:
        response = dict(snapshot)
        response["fresh_read"] = {
            "ok": ok,
            "reason": reason,
            "triggered": triggered,
            "request_started_at": request_started_at,
            "baseline_heart_rate_at": baseline_metric_timestamp,
            "heart_rate_at": get_heart_rate_timestamp(snapshot),
            "heart_rate_age_seconds": heart_rate_sample_age_seconds(snapshot),
            "max_wait_seconds": settings["max_wait_seconds"],
            "max_sample_age_seconds": settings["max_sample_age_seconds"],
            "poll_interval_seconds": settings["poll_interval_seconds"],
            "trigger": trigger_result,
        }
        return response

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

    def get_fresh_snapshot(self, max_wait_seconds: float | None = None) -> dict[str, Any]:
        settings = resolve_fresh_read_settings(self.config, max_wait_seconds=max_wait_seconds)
        request_started_at = datetime.now(band_parser.TZ).isoformat()

        with self.fresh_read_lock:
            self.refresh(force=True)
            with self.lock:
                baseline_snapshot = self.snapshot
                baseline_metric_timestamp = get_heart_rate_timestamp(baseline_snapshot)

            if snapshot_has_fresh_heart_rate(
                baseline_snapshot,
                max_sample_age_seconds=settings["max_sample_age_seconds"],
            ):
                return self._snapshot_with_fresh_read(
                    baseline_snapshot,
                    ok=True,
                    reason="already_fresh",
                    triggered=False,
                    trigger_result={"ok": True, "strategy": "skipped", "executed": False, "commands": []},
                    settings=settings,
                    baseline_metric_timestamp=baseline_metric_timestamp,
                    request_started_at=request_started_at,
                )

            trigger_result = self.trigger.trigger()
            self._record_event(
                "fresh_read_started",
                "fresh heart-rate read requested",
                {
                    "request_started_at": request_started_at,
                    "trigger": trigger_result,
                    "baseline_heart_rate_at": baseline_metric_timestamp,
                },
            )

            deadline = time.monotonic() + settings["max_wait_seconds"]
            latest_snapshot = baseline_snapshot
            while True:
                self.refresh(force=True)
                with self.lock:
                    latest_snapshot = self.snapshot

                if snapshot_has_fresh_heart_rate(
                    latest_snapshot,
                    max_sample_age_seconds=settings["max_sample_age_seconds"],
                    baseline_metric_timestamp=baseline_metric_timestamp,
                    require_newer_than_baseline=True,
                ):
                    self._record_event(
                        "fresh_read_succeeded",
                        "fresh heart-rate sample observed",
                        {
                            "heart_rate_at": get_heart_rate_timestamp(latest_snapshot),
                            "heart_rate_age_seconds": heart_rate_sample_age_seconds(latest_snapshot),
                        },
                    )
                    return self._snapshot_with_fresh_read(
                        latest_snapshot,
                        ok=True,
                        reason="fresh_sample_observed",
                        triggered=bool(trigger_result.get("executed")),
                        trigger_result=trigger_result,
                        settings=settings,
                        baseline_metric_timestamp=baseline_metric_timestamp,
                        request_started_at=request_started_at,
                    )

                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    break
                time.sleep(min(settings["poll_interval_seconds"], remaining))

            self._record_event(
                "fresh_read_timed_out",
                "fresh heart-rate sample not observed before timeout",
                {
                    "baseline_heart_rate_at": baseline_metric_timestamp,
                    "last_heart_rate_at": get_heart_rate_timestamp(latest_snapshot),
                    "last_heart_rate_age_seconds": heart_rate_sample_age_seconds(latest_snapshot),
                },
            )
            return self._snapshot_with_fresh_read(
                latest_snapshot,
                ok=False,
                reason="timeout",
                triggered=bool(trigger_result.get("executed")),
                trigger_result=trigger_result,
                settings=settings,
                baseline_metric_timestamp=baseline_metric_timestamp,
                request_started_at=request_started_at,
            )

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

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if not self._require_auth():
            return

        try:
            payload = read_json_body(self)
            if parsed.path == "/v1/band/fresh-read":
                query = parse_qs(parsed.query)
                raw_wait = payload.get("max_wait_seconds") if isinstance(payload, dict) else None
                if raw_wait is None:
                    raw_wait = query.get("max_wait_seconds", [None])[0]
                max_wait_seconds = float(raw_wait) if raw_wait not in (None, "") else None
                self._write_json(HTTPStatus.OK, self.runtime.get_fresh_snapshot(max_wait_seconds=max_wait_seconds))
                return
        except ValueError as exc:
            self._write_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
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
