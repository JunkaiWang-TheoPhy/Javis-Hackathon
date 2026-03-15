import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEPLOY_SCRIPT = ROOT / "tools" / "printer_bridge" / "deploy_remote.py"


class DeployRemoteScriptTest(unittest.TestCase):
    def test_deploy_script_exists_and_targets_remote_openclaw_files(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("printer-bridge", text)
        self.assertIn("PRINTER_BRIDGE.md", text)
        self.assertIn("openclaw.json", text)
        self.assertIn("gateway restart", text)
        self.assertIn("--skip-restart", text)
        self.assertIn("OPENCLAW_PRINTER_BRIDGE_URL", text)
        self.assertIn(".openclaw-printer-bridge-tunnel.json", text)
        self.assertIn("launchd", text)

    def test_deploy_script_teaches_remote_runtime_to_prefer_tools_over_raw_bridge_fetches(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("printer_get_status", text)
        self.assertIn("Do not treat the bridge root URL as a liveness failure", text)
        self.assertIn("/health", text)


if __name__ == "__main__":
    unittest.main()
