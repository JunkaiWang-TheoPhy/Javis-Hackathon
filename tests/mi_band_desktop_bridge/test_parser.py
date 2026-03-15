import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "tools" / "mi_band_desktop_bridge" / "parser.py"


def load_parser_module():
    if not MODULE_PATH.is_file():
        raise AssertionError(f"missing parser module: {MODULE_PATH}")

    spec = importlib.util.spec_from_file_location("mi_band_parser", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


SAMPLE_LOGCAT = """
03-15 09:20:45.735  7680  7680 I fitness_7680_7680: [FitnessDataChangedUtils] sendRecentDataChangedBroadcast(server_sync), success=true, code=0
03-15 09:20:45.738 13041 13041 I SettingItemComponent_13041_13041: onReceive: data sync event #Intent;action=recent_data_changed_broadcast;launchFlags=0x10;package=com.mi.health;S.reason_data_changed=server_sync;B.boolean_result=true;B.first_cloud_sync=false;i.error_code=0;end
03-15 09:20:45.743  7680  7680 I fitness_7680_7680: [FitnessServerSyncInc] syncWithServer, forceSync = false, triggerSource = device_sync
03-15 09:20:45.749 13041 13041 I SettingItemComponent_13041_13041: onReceive: data sync event #Intent;action=recent_data_changed_broadcast;launchFlags=0x10;package=com.mi.health;S.reason_data_changed=device_sync;B.boolean_result=true;i.error_code=0;end
03-15 09:20:45.783 13041 13217 I fitness_13041_13217: [HomeDataRepository] HR - (DailyHrReport(time=1773504000, time=2026-03-15 00:00:00, tag='home', restHr=79, avgHr=82, maxHr=94, minHr=75, latestHrRecord=HrItem(sid=940134049, time=1773537600, hr=80), hrDistribute=null))
03-15 09:20:45.943 13041 13217 I fitness_13041_13217: [HomeDataRepository] STEP - (DailyStepReport(time=1773504000, time = 2026-03-15 00:00:00, tag='home', steps=2327, distance=1447, calories=83, minStartTime=1773504840, maxEndTime=1773537840, avgStep=290, avgDis=180, active=null))
03-15 09:20:46.130 13041 13217 I fitness_13041_13217: [HomeDataRepository] SPO2 - (DailySpo2Report(time=1773504000, time=2026-03-15 00:00:00, tag='home', avgSpo2=97, maxSpo2=97, minSpo2=97, latestSpoRecord=Spo2Item(time=1773537540, sid=940134049, spo2=97)))
"""

SAMPLE_DUMPSYS = """
Bluetooth Status
  enabled: true
  state: ON
AdapterProperties
  ConnectionState: STATE_CONNECTED
  Bonded devices:
    D0:AE:05:0D:A0:94 [ DUAL ] Xiaomi Smart Band 9 Pro A094
"""


class ParserTest(unittest.TestCase):
    def test_parse_snapshot_from_logcat_extracts_latest_metrics(self) -> None:
        module = load_parser_module()
        snapshot = module.parse_metric_snapshot(SAMPLE_LOGCAT)
        self.assertEqual(snapshot["metrics"]["heart_rate_bpm"], 80)
        self.assertEqual(snapshot["metrics"]["spo2_percent"], 97)
        self.assertEqual(snapshot["metrics"]["steps"], 2327)
        self.assertEqual(snapshot["metrics"]["distance_m"], 1447)
        self.assertEqual(snapshot["metrics"]["calories_kcal"], 83)
        self.assertEqual(snapshot["timestamps"]["source_timestamp"], "2026-03-15T09:24:00+08:00")

    def test_parse_events_extracts_sync_events(self) -> None:
        module = load_parser_module()
        events = module.parse_events(SAMPLE_LOGCAT)
        self.assertGreaterEqual(len(events), 2)
        event_types = {event["type"] for event in events}
        self.assertIn("sync_started", event_types)
        self.assertIn("sync_finished", event_types)

    def test_parse_bluetooth_status_reads_band_connection(self) -> None:
        module = load_parser_module()
        status = module.parse_bluetooth_status(
            SAMPLE_DUMPSYS,
            band_mac="D0:AE:05:0D:A0:94",
            band_name="Xiaomi Smart Band 9 Pro A094",
        )
        self.assertTrue(status["bluetooth_enabled"])
        self.assertTrue(status["band_bonded"])
        self.assertEqual(status["connection_status"], "connected")


if __name__ == "__main__":
    unittest.main()
