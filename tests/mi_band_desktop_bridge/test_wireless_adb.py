import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / "tools" / "mi_band_desktop_bridge" / "wireless_adb.py"


class WirelessAdbScriptTest(unittest.TestCase):
    def test_script_exists_and_supports_expected_commands(self) -> None:
        self.assertTrue(SCRIPT_PATH.is_file(), SCRIPT_PATH)
        text = SCRIPT_PATH.read_text(encoding="utf-8")
        for expected in (
            "pair",
            "connect",
            "disconnect",
            "status",
            "OPENCLAW_MI_BAND_ADB_TARGET",
            "wireless_adb",
        ):
            self.assertIn(expected, text)


if __name__ == "__main__":
    unittest.main()
