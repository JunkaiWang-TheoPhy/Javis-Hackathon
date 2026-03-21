import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLUGIN_DIR = ROOT / "tools" / "mi_band_desktop_bridge" / "openclaw_band_plugin"
PLUGIN_JSON = PLUGIN_DIR / "openclaw.plugin.json"
PACKAGE_JSON = PLUGIN_DIR / "package.json"
PLUGIN_INDEX = PLUGIN_DIR / "index.mjs"


class RemotePluginTest(unittest.TestCase):
    def test_plugin_metadata_exists(self) -> None:
        self.assertTrue(PLUGIN_JSON.is_file(), PLUGIN_JSON)
        self.assertTrue(PACKAGE_JSON.is_file(), PACKAGE_JSON)
        self.assertTrue(PLUGIN_INDEX.is_file(), PLUGIN_INDEX)

    def test_plugin_declares_expected_id(self) -> None:
        payload = json.loads(PLUGIN_JSON.read_text(encoding="utf-8"))
        self.assertEqual(payload["id"], "mi-band-bridge")

    def test_plugin_index_registers_read_only_tools(self) -> None:
        text = PLUGIN_INDEX.read_text(encoding="utf-8")
        for name in (
            'name: "band_get_status"',
            'name: "band_get_latest"',
            'name: "band_get_fresh_latest"',
            'name: "band_get_events"',
            'name: "band_get_alerts"',
        ):
            self.assertIn(name, text)

    def test_plugin_reads_bridge_url_and_token_from_config_or_env(self) -> None:
        text = PLUGIN_INDEX.read_text(encoding="utf-8")
        self.assertIn("bridgeBaseUrl", text)
        self.assertIn("bridgeToken", text)
        self.assertIn("freshReadMaxWaitSeconds", text)
        self.assertIn("freshReadRequestTimeoutMs", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_URL", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_TOKEN", text)
        self.assertIn("Use this tool instead of direct bridge HTTP calls.", text)


if __name__ == "__main__":
    unittest.main()
