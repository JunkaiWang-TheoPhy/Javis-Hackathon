import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "tools" / "mi_band_desktop_bridge" / "bridge_server.py"


def load_bridge_module():
    if not MODULE_PATH.is_file():
        raise AssertionError(f"missing bridge server module: {MODULE_PATH}")

    spec = importlib.util.spec_from_file_location("mi_band_bridge_server", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class BridgeServerTest(unittest.TestCase):
    def test_is_authorized_accepts_matching_bearer_token(self) -> None:
        module = load_bridge_module()
        self.assertTrue(module.is_authorized("Bearer bridge-secret", "bridge-secret"))
        self.assertFalse(module.is_authorized("Bearer wrong", "bridge-secret"))
        self.assertFalse(module.is_authorized("", "bridge-secret"))

    def test_load_bridge_config_reads_json_file(self) -> None:
        module = load_bridge_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "bridge_config.json"
            path.write_text(
                json.dumps({"port": 9772, "band": {"mac": "D0:AE:05:0D:A0:94"}}),
                encoding="utf-8",
            )
            config = module.load_bridge_config(path)
        self.assertEqual(config["port"], 9772)
        self.assertEqual(config["band"]["mac"], "D0:AE:05:0D:A0:94")

    def test_get_expected_token_prefers_env_var(self) -> None:
        module = load_bridge_module()
        previous = os.environ.get("OPENCLAW_MI_BAND_BRIDGE_TOKEN")
        os.environ["OPENCLAW_MI_BAND_BRIDGE_TOKEN"] = "bridge-secret"
        try:
            self.assertEqual(module.get_expected_token({"token_env_var": "OPENCLAW_MI_BAND_BRIDGE_TOKEN"}), "bridge-secret")
        finally:
            if previous is None:
                os.environ.pop("OPENCLAW_MI_BAND_BRIDGE_TOKEN", None)
            else:
                os.environ["OPENCLAW_MI_BAND_BRIDGE_TOKEN"] = previous

    def test_resolve_adb_target_defaults_to_usb_serial(self) -> None:
        module = load_bridge_module()
        config = {
            "adb_serial": "4722a997",
            "adb_target_env_var": "OPENCLAW_MI_BAND_ADB_TARGET",
            "wireless_adb": {
                "enabled": False,
                "host": "192.168.0.8",
                "port": 5555,
            },
        }
        previous = os.environ.get("OPENCLAW_MI_BAND_ADB_TARGET")
        os.environ.pop("OPENCLAW_MI_BAND_ADB_TARGET", None)
        try:
            self.assertEqual(module.resolve_adb_target(config), "4722a997")
            self.assertEqual(module.resolve_adb_transport(config), "usb")
        finally:
            if previous is not None:
                os.environ["OPENCLAW_MI_BAND_ADB_TARGET"] = previous

    def test_resolve_adb_target_prefers_env_override(self) -> None:
        module = load_bridge_module()
        config = {
            "adb_serial": "4722a997",
            "adb_target_env_var": "OPENCLAW_MI_BAND_ADB_TARGET",
            "wireless_adb": {
                "enabled": False,
                "host": "192.168.0.8",
                "port": 5555,
            },
        }
        previous = os.environ.get("OPENCLAW_MI_BAND_ADB_TARGET")
        os.environ["OPENCLAW_MI_BAND_ADB_TARGET"] = "192.168.0.8:5555"
        try:
            self.assertEqual(module.resolve_adb_target(config), "192.168.0.8:5555")
            self.assertEqual(module.resolve_adb_transport(config), "wireless")
        finally:
            if previous is None:
                os.environ.pop("OPENCLAW_MI_BAND_ADB_TARGET", None)
            else:
                os.environ["OPENCLAW_MI_BAND_ADB_TARGET"] = previous

    def test_resolve_adb_target_uses_wireless_target_when_enabled(self) -> None:
        module = load_bridge_module()
        config = {
            "adb_serial": "4722a997",
            "adb_target_env_var": "OPENCLAW_MI_BAND_ADB_TARGET",
            "wireless_adb": {
                "enabled": True,
                "host": "192.168.0.8",
                "port": 5555,
            },
        }
        previous = os.environ.get("OPENCLAW_MI_BAND_ADB_TARGET")
        os.environ.pop("OPENCLAW_MI_BAND_ADB_TARGET", None)
        try:
            self.assertEqual(module.resolve_adb_target(config), "192.168.0.8:5555")
            self.assertEqual(module.resolve_adb_transport(config), "wireless")
        finally:
            if previous is not None:
                os.environ["OPENCLAW_MI_BAND_ADB_TARGET"] = previous


if __name__ == "__main__":
    unittest.main()
