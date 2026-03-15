import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEPLOY_SCRIPT = ROOT / "tools" / "printer_bridge" / "deploy_remote.py"


class DeployRemoteScriptTest(unittest.TestCase):
    def test_deploy_script_exists_and_targets_remote_openclaw_files(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("printer-bridge", text)
        self.assertIn("queue_bridge_admin.py", text)
        self.assertIn("PRINTER_BRIDGE.md", text)
        self.assertIn("openclaw.json", text)
        self.assertIn("gateway restart", text)
        self.assertIn("--skip-restart", text)
        self.assertIn("queueRoot", text)
        self.assertIn("/home/devbox/.openclaw/printer-bridge-queue", text)
        self.assertIn("launchd", text)

    def test_deploy_script_teaches_remote_runtime_to_prefer_tools_over_raw_bridge_fetches(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("printer_get_status", text)
        self.assertIn("Do not mention queue internals", text)
        self.assertIn("temporarily unavailable", text)
        self.assertIn("keeps the local connector alive", text)

    def test_deploy_script_allowlists_plugin_for_tool_usage(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("config.setdefault('tools',", text)
        self.assertIn("tools_allow", text)
        self.assertIn("plugin_id not in tools_allow", text)


if __name__ == "__main__":
    unittest.main()
