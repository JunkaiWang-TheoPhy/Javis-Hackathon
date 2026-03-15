import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLUGIN_DIR = ROOT / "tools" / "printer_bridge" / "openclaw_printer_plugin"
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
        self.assertEqual(payload["id"], "printer-bridge")

    def test_plugin_index_registers_four_printer_tools(self) -> None:
        text = PLUGIN_INDEX.read_text(encoding="utf-8")
        for name in (
            "printer_get_status",
            "printer_print_image",
            "printer_print_pdf",
            "printer_cancel_job",
        ):
            self.assertIn(f'name: "{name}"', text)

    def test_plugin_reads_queue_config_from_config_or_env(self) -> None:
        text = PLUGIN_INDEX.read_text(encoding="utf-8")
        self.assertIn("queueRoot", text)
        self.assertIn("responseTimeoutMs", text)
        self.assertIn("OPENCLAW_PRINTER_BRIDGE_QUEUE_ROOT", text)
        self.assertIn("OPENCLAW_PRINTER_BRIDGE_RESPONSE_TIMEOUT_MS", text)


if __name__ == "__main__":
    unittest.main()
