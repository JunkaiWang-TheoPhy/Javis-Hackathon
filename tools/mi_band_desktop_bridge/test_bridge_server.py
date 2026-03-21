import subprocess
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import parser as band_parser
from bridge_server import AdbCollector, BridgeRuntime, build_metric_extract_command
from measurement_trigger import AdbShellCommandTrigger, NoOpTrigger, build_trigger


class FakeCollector(AdbCollector):
    def __init__(self, responses):
        super().__init__(
            {
                "adb_path": "adb",
                "adb_serial": "serial",
                "xiaomi_log_dirs": ["/logs"],
            }
        )
        self.responses = responses

    def shell(self, command: str, timeout: float = 20.0):
        return subprocess.CompletedProcess(
            args=["adb", "shell", command],
            returncode=0,
            stdout=self.responses.get(command, ""),
            stderr="",
        )


class BridgeServerTest(unittest.TestCase):
    def test_external_log_dump_reads_metric_lines_from_full_log_file(self):
        metric_lines = "\n".join(
            [
                "2026-03-21 11:41:46.648|3.53.1|I|fitness|[HomeDataRepository] HR - (DailyHrReport(latestHrRecord=HrItem(sid=940134049, time=1774064460, hr=85)))",
                "2026-03-21 11:41:46.914|3.53.1|I|fitness|[HomeDataRepository] STEP - (DailyStepReport(time=1774022400, steps=1470, distance=860, calories=58, maxEndTime=1774058880))",
                "2026-03-21 11:41:47.086|3.53.1|I|fitness|[HomeDataRepository] SPO2 - (DailySpo2Report(latestSpoRecord=Spo2Item(time=1774064100, sid=940134049, spo2=98)))",
            ]
        )
        responses = {
            "ls -t /logs 2>/dev/null | head -6": "XiaomiFit.main.log\n",
            build_metric_extract_command("/logs/XiaomiFit.main.log"): metric_lines,
        }
        collector = FakeCollector(responses)

        dump = collector.external_log_dump()

        self.assertIn("FILE:/logs/XiaomiFit.main.log", dump)
        self.assertIn("latestHrRecord=HrItem", dump)
        self.assertIn("latestSpoRecord=Spo2Item", dump)
        self.assertIn("DailyStepReport(", dump)

    def test_external_log_dump_prioritizes_xiaomifit_main_log(self):
        metric_lines = "2026-03-21 11:41:46.648|3.53.1|I|fitness|[HomeDataRepository] HR - (DailyHrReport(latestHrRecord=HrItem(sid=940134049, time=1774064460, hr=85)))"
        responses = {
            "ls -t /logs 2>/dev/null | head -6": "\n".join(
                [
                    "XiaomiFit.device.log",
                    "Transfer.device.log",
                    "XiaomiFit.main.log",
                    "XiaomiFit.main.log.bak.1",
                ]
            )
            + "\n",
            build_metric_extract_command("/logs/XiaomiFit.main.log"): metric_lines,
            build_metric_extract_command("/logs/XiaomiFit.device.log"): "",
            build_metric_extract_command("/logs/Transfer.device.log"): "",
        }
        collector = FakeCollector(responses)

        dump = collector.external_log_dump()

        self.assertIn("FILE:/logs/XiaomiFit.main.log", dump)
        self.assertIn("latestHrRecord=HrItem", dump)

    def test_collect_skips_logcat_when_external_logs_already_have_metrics(self):
        external_text = "\n".join(
            [
                "FILE:/logs/XiaomiFit.main.log",
                "2026-03-21 11:41:46.648|3.53.1|I|fitness|[HomeDataRepository] HR - (DailyHrReport(latestHrRecord=HrItem(sid=940134049, time=1774064460, hr=85)))",
                "2026-03-21 11:41:46.914|3.53.1|I|fitness|[HomeDataRepository] STEP - (DailyStepReport(time=1774022400, steps=1470, distance=860, calories=58, maxEndTime=1774058880))",
                "2026-03-21 11:41:47.086|3.53.1|I|fitness|[HomeDataRepository] SPO2 - (DailySpo2Report(latestSpoRecord=Spo2Item(time=1774064100, sid=940134049, spo2=98)))",
            ]
        )

        class CountingCollector(AdbCollector):
            def __init__(self, payload: str):
                super().__init__(
                    {
                        "adb_path": "adb",
                        "adb_serial": "serial",
                        "band": {
                            "name": "Xiaomi Smart Band 9 Pro A094",
                            "mac": "D0:AE:05:0D:A0:94",
                            "did": "940134049",
                            "model": "miwear.watch.n67cn",
                            "firmware": "3.1.171",
                        },
                        "phone": {"model": "Xiaomi 12X"},
                        "xiaomi_log_dirs": ["/logs"],
                    }
                )
                self.payload = payload
                self.logcat_calls = 0

            def get_state(self) -> str:
                return "device"

            def bluetooth_dump(self) -> str:
                return ""

            def external_log_dump(self) -> str:
                return self.payload

            def logcat_dump(self) -> str:
                self.logcat_calls += 1
                return ""

        collector = CountingCollector(external_text)

        collected = collector.collect()

        self.assertEqual(collector.logcat_calls, 0)
        self.assertEqual(collected["snapshot"]["source"]["kind"], "xiaomi_external_logs")
        self.assertEqual(collected["snapshot"]["metrics"]["heart_rate_bpm"], 85)
        self.assertEqual(collected["snapshot"]["metrics"]["spo2_percent"], 98)
        self.assertEqual(collected["snapshot"]["metrics"]["steps"], 1470)


class MeasurementTriggerTest(unittest.TestCase):
    def test_build_trigger_defaults_to_noop(self):
        trigger = build_trigger({}, lambda _command, timeout=20.0: None)

        self.assertIsInstance(trigger, NoOpTrigger)
        self.assertEqual(trigger.trigger()["strategy"], "noop")

    def test_adb_shell_command_trigger_executes_configured_commands(self):
        calls = []

        def runner(command: str, timeout: float = 20.0):
            calls.append((command, timeout))
            return subprocess.CompletedProcess(
                args=["adb", "shell", command],
                returncode=0,
                stdout="ok\n",
                stderr="",
            )

        trigger = AdbShellCommandTrigger(
            ["am start -n com.mi.health/.MainActivity", "input keyevent 26"],
            runner,
        )

        result = trigger.trigger()

        self.assertTrue(result["ok"])
        self.assertTrue(result["executed"])
        self.assertEqual(
            [entry["command"] for entry in result["commands"]],
            ["am start -n com.mi.health/.MainActivity", "input keyevent 26"],
        )
        self.assertEqual(
            calls,
            [
                ("am start -n com.mi.health/.MainActivity", 20.0),
                ("input keyevent 26", 20.0),
            ],
        )


class FreshReadRuntimeTest(unittest.TestCase):
    def _make_config(self, **fresh_overrides):
        fresh_read = {
            "timeout_seconds": 1,
            "poll_interval_seconds": 0.01,
            "max_sample_age_seconds": 60,
            "trigger_strategy": "adb_shell_commands",
            "trigger_commands": ["am start -n com.mi.health/.MainActivity"],
        }
        fresh_read.update(fresh_overrides)
        return {
            "adb_path": "adb",
            "adb_serial": "serial",
            "xiaomi_log_dirs": ["/logs"],
            "event_limit": 50,
            "phone": {"model": "Xiaomi 12X"},
            "band": {
                "name": "Xiaomi Smart Band 9 Pro A094",
                "mac": "D0:AE:05:0D:A0:94",
                "did": "940134049",
                "model": "miwear.watch.n67cn",
                "firmware": "3.1.171",
            },
            "fresh_read": fresh_read,
        }

    def _collected_payload(self, *, source_timestamp: str | None, bridge_timestamp: str, hr: int = 85):
        snapshot = {
            "ok": True,
            "device": self._make_config()["band"],
            "phone": {
                "adb_serial": "serial",
                "adb_target": "serial",
                "adb_transport": "usb",
                "model": "Xiaomi 12X",
            },
            "connection": {
                "status": "bonded",
                "last_seen_at": source_timestamp or bridge_timestamp,
            },
            "metrics": {
                "heart_rate_bpm": hr if source_timestamp else None,
                "heart_rate_at": source_timestamp,
                "spo2_percent": 97 if source_timestamp else None,
                "spo2_at": source_timestamp,
                "steps": 1684 if source_timestamp else None,
                "distance_m": 1000 if source_timestamp else None,
                "calories_kcal": 88 if source_timestamp else None,
                "steps_at": source_timestamp,
            },
            "timestamps": {
                "source_timestamp": source_timestamp,
                "bridge_timestamp": bridge_timestamp,
            },
            "source": {
                "kind": "xiaomi_external_logs",
                "freshness_seconds": band_parser.freshness_seconds(source_timestamp, bridge_timestamp),
            },
        }
        return {
            "snapshot": snapshot,
            "status": {
                "ok": True,
                "service": "openclaw-mi-band-bridge",
                "adb_ready": True,
                "adb_target": "serial",
                "adb_transport": "usb",
                "bluetooth_ready": True,
                "metrics_ready": source_timestamp is not None,
                "local_source_ready": source_timestamp is not None,
                "connection_status": "bonded",
                "last_refresh_at": bridge_timestamp,
                "source_kind": "xiaomi_external_logs",
            },
            "events": [],
            "alerts": [],
            "debug": {},
        }

    def test_get_fresh_snapshot_returns_existing_fresh_sample_without_trigger(self):
        now = datetime.now(band_parser.TZ)
        source_timestamp = (now - timedelta(seconds=20)).isoformat()
        bridge_timestamp = now.isoformat()
        config = self._make_config()
        runtime = BridgeRuntime(config)

        class FreshCollector:
            def __init__(self, payload):
                self.payload = payload
                self.collect_calls = 0
                self.shell_calls = []

            def collect(self):
                self.collect_calls += 1
                return self.payload

            def shell(self, command: str, timeout: float = 20.0):
                self.shell_calls.append((command, timeout))
                return subprocess.CompletedProcess(
                    args=["adb", "shell", command],
                    returncode=0,
                    stdout="ok\n",
                    stderr="",
                )

        collector = FreshCollector(
            self._collected_payload(source_timestamp=source_timestamp, bridge_timestamp=bridge_timestamp)
        )
        runtime.collector = collector
        runtime.trigger = build_trigger(config, collector.shell)

        result = runtime.get_fresh_snapshot()

        self.assertTrue(result["fresh_read"]["ok"])
        self.assertEqual(result["fresh_read"]["reason"], "already_fresh")
        self.assertFalse(result["fresh_read"]["triggered"])
        self.assertEqual(collector.collect_calls, 1)
        self.assertEqual(collector.shell_calls, [])

    def test_get_fresh_snapshot_waits_for_newer_sample_after_trigger(self):
        now = datetime.now(band_parser.TZ)
        stale_source = (now - timedelta(minutes=10)).isoformat()
        mid_bridge = now.isoformat()
        fresh_source = (now + timedelta(seconds=5)).isoformat()
        fresh_bridge = (now + timedelta(seconds=6)).isoformat()
        config = self._make_config(timeout_seconds=0.2, poll_interval_seconds=0.01)
        runtime = BridgeRuntime(config)

        class SequenceCollector:
            def __init__(self, payloads):
                self.payloads = list(payloads)
                self.collect_calls = 0
                self.shell_calls = []

            def collect(self):
                index = min(self.collect_calls, len(self.payloads) - 1)
                self.collect_calls += 1
                return self.payloads[index]

            def shell(self, command: str, timeout: float = 20.0):
                self.shell_calls.append((command, timeout))
                return subprocess.CompletedProcess(
                    args=["adb", "shell", command],
                    returncode=0,
                    stdout="ok\n",
                    stderr="",
                )

        collector = SequenceCollector(
            [
                self._collected_payload(source_timestamp=stale_source, bridge_timestamp=mid_bridge, hr=80),
                self._collected_payload(source_timestamp=fresh_source, bridge_timestamp=fresh_bridge, hr=91),
            ]
        )
        runtime.collector = collector
        runtime.trigger = build_trigger(config, collector.shell)

        result = runtime.get_fresh_snapshot()

        self.assertTrue(result["fresh_read"]["ok"])
        self.assertEqual(result["fresh_read"]["reason"], "fresh_sample_observed")
        self.assertTrue(result["fresh_read"]["triggered"])
        self.assertEqual(result["metrics"]["heart_rate_bpm"], 91)
        self.assertEqual(len(collector.shell_calls), 1)

    def test_get_fresh_snapshot_times_out_when_new_sample_never_arrives(self):
        now = datetime.now(band_parser.TZ)
        stale_source = (now - timedelta(minutes=10)).isoformat()
        bridge_timestamp = now.isoformat()
        config = self._make_config(timeout_seconds=0.05, poll_interval_seconds=0.01)
        runtime = BridgeRuntime(config)

        class TimeoutCollector:
            def __init__(self, payload):
                self.payload = payload
                self.collect_calls = 0
                self.shell_calls = []

            def collect(self):
                self.collect_calls += 1
                return self.payload

            def shell(self, command: str, timeout: float = 20.0):
                self.shell_calls.append((command, timeout))
                return subprocess.CompletedProcess(
                    args=["adb", "shell", command],
                    returncode=0,
                    stdout="ok\n",
                    stderr="",
                )

        collector = TimeoutCollector(
            self._collected_payload(source_timestamp=stale_source, bridge_timestamp=bridge_timestamp, hr=77)
        )
        runtime.collector = collector
        runtime.trigger = build_trigger(config, collector.shell)

        result = runtime.get_fresh_snapshot()

        self.assertFalse(result["fresh_read"]["ok"])
        self.assertEqual(result["fresh_read"]["reason"], "timeout")
        self.assertTrue(result["fresh_read"]["triggered"])
        self.assertEqual(result["metrics"]["heart_rate_bpm"], 77)
        self.assertGreaterEqual(collector.collect_calls, 1)


if __name__ == "__main__":
    unittest.main()
