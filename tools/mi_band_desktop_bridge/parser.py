from __future__ import annotations

import hashlib
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


TZ = ZoneInfo("Asia/Shanghai")

HR_PATTERN = re.compile(
    r"latestHrRecord=HrItem\(sid=(?P<sid>[^,]+), time=(?P<time>\d+), hr=(?P<hr>\d+)\)"
)
SPO2_PATTERN = re.compile(
    r"latestSpoRecord=Spo2Item\(time=(?P<time>\d+), sid=(?P<sid>[^,]+), spo2=(?P<spo2>\d+)\)"
)
STEP_PATTERN = re.compile(
    r"DailyStepReport\([^)]*steps=(?P<steps>\d+), distance=(?P<distance>\d+), calories=(?P<calories>\d+),"
    r"[^)]*maxEndTime=(?P<time>\d+)"
)
LOGCAT_TS_PATTERN = re.compile(r"^(?P<month>\d{2})-(?P<day>\d{2}) (?P<clock>\d{2}:\d{2}:\d{2}\.\d{3})")
FULL_TS_PATTERN = re.compile(r"^(?P<stamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\|")


def epoch_to_iso(epoch_seconds: int) -> str:
    return datetime.fromtimestamp(epoch_seconds, TZ).isoformat()


def parse_metric_snapshot(text: str) -> dict[str, object]:
    heart_match = _pick_latest(HR_PATTERN.finditer(text), lambda match: int(match.group("time")))
    spo2_match = _pick_latest(SPO2_PATTERN.finditer(text), lambda match: int(match.group("time")))
    step_match = _pick_latest(STEP_PATTERN.finditer(text), lambda match: int(match.group("time")))

    metrics = {
        "heart_rate_bpm": int(heart_match.group("hr")) if heart_match else None,
        "heart_rate_at": epoch_to_iso(int(heart_match.group("time"))) if heart_match else None,
        "spo2_percent": int(spo2_match.group("spo2")) if spo2_match else None,
        "spo2_at": epoch_to_iso(int(spo2_match.group("time"))) if spo2_match else None,
        "steps": int(step_match.group("steps")) if step_match else None,
        "distance_m": int(step_match.group("distance")) if step_match else None,
        "calories_kcal": int(step_match.group("calories")) if step_match else None,
        "steps_at": epoch_to_iso(int(step_match.group("time"))) if step_match else None,
    }

    latest_epoch = max(
        [
            int(match.group("time"))
            for match in (heart_match, spo2_match, step_match)
            if match is not None
        ],
        default=None,
    )

    return {
        "metrics": metrics,
        "timestamps": {
            "source_timestamp": epoch_to_iso(latest_epoch) if latest_epoch is not None else None,
        },
    }


def parse_events(text: str, year: int = 2026) -> list[dict[str, object]]:
    events: list[dict[str, object]] = []
    for line in text.splitlines():
        lower = line.lower()
        stamp = parse_line_timestamp(line, year=year)
        if "syncwithserver" in lower and "triggersource" in lower:
            reason = _extract_reason(line, r"triggerSource = (?P<reason>[a-z_]+)")
            events.append(_build_event("sync_started", stamp, reason or "unknown", line))
        elif "recent_data_changed_broadcast" in lower:
            reason = _extract_reason(line, r"reason_data_changed=(?P<reason>[a-z_]+)")
            if not reason:
                reason = _extract_reason(line, r"sendRecentDataChangedBroadcast\((?P<reason>[a-z_]+)\)")
            events.append(_build_event("sync_finished", stamp, reason or "unknown", line))
    return _dedupe_events(events)


def parse_bluetooth_status(text: str, band_mac: str, band_name: str) -> dict[str, object]:
    bluetooth_enabled = "enabled: true" in text.lower()
    adapter_connected = "ConnectionState: STATE_CONNECTED" in text
    mac_present = band_mac in text
    name_present = band_name in text
    band_bonded = mac_present or name_present

    if bluetooth_enabled and adapter_connected and band_bonded:
        connection_status = "connected"
    elif bluetooth_enabled and band_bonded:
        connection_status = "bonded"
    elif bluetooth_enabled:
        connection_status = "bluetooth_on"
    else:
        connection_status = "bluetooth_off"

    return {
        "bluetooth_enabled": bluetooth_enabled,
        "band_bonded": band_bonded,
        "connection_status": connection_status,
    }


def extract_evidence_lines(text: str) -> dict[str, list[str]]:
    return {
        "heart_rate": _matching_lines(text, "latestHrRecord=HrItem", limit=3),
        "spo2": _matching_lines(text, "latestSpoRecord=Spo2Item", limit=3),
        "steps": _matching_lines(text, "DailyStepReport(", limit=3),
        "sync": _matching_lines(text, "recent_data_changed_broadcast", limit=6),
    }


def parse_line_timestamp(line: str, year: int = 2026) -> str | None:
    full_match = FULL_TS_PATTERN.match(line)
    if full_match:
        parsed = datetime.strptime(full_match.group("stamp"), "%Y-%m-%d %H:%M:%S.%f")
        return parsed.replace(tzinfo=TZ).isoformat()

    logcat_match = LOGCAT_TS_PATTERN.match(line)
    if logcat_match:
        stamp = f"{year}-{logcat_match.group('month')}-{logcat_match.group('day')} {logcat_match.group('clock')}"
        parsed = datetime.strptime(stamp, "%Y-%m-%d %H:%M:%S.%f")
        return parsed.replace(tzinfo=TZ).isoformat()
    return None


def freshness_seconds(source_timestamp: str | None, bridge_timestamp: str) -> int | None:
    if not source_timestamp:
        return None
    source = datetime.fromisoformat(source_timestamp)
    bridge = datetime.fromisoformat(bridge_timestamp)
    return max(0, int((bridge - source).total_seconds()))


def is_stale(source_timestamp: str | None, bridge_timestamp: str, max_age_seconds: int = 300) -> bool:
    freshness = freshness_seconds(source_timestamp, bridge_timestamp)
    return freshness is None or freshness > max_age_seconds


def _pick_latest(matches, key):
    items = list(matches)
    if not items:
        return None
    return max(items, key=key)


def _build_event(event_type: str, stamp: str | None, reason: str, raw_line: str) -> dict[str, object]:
    event_id = hashlib.sha256(f"{event_type}|{stamp}|{reason}|{raw_line}".encode("utf-8")).hexdigest()[:16]
    return {
        "id": event_id,
        "type": event_type,
        "timestamp": stamp,
        "summary": f"{event_type}:{reason}",
        "details": {
            "reason": reason,
            "raw_line": raw_line.strip(),
        },
    }


def _extract_reason(line: str, pattern: str) -> str | None:
    match = re.search(pattern, line)
    if not match:
        return None
    return match.group("reason")


def _matching_lines(text: str, needle: str, limit: int) -> list[str]:
    matches = [line.strip() for line in text.splitlines() if needle in line]
    return matches[-limit:]


def _dedupe_events(events: list[dict[str, object]]) -> list[dict[str, object]]:
    seen: set[str] = set()
    deduped: list[dict[str, object]] = []
    for event in events:
        event_id = str(event["id"])
        if event_id in seen:
            continue
        seen.add(event_id)
        deduped.append(event)
    return deduped
