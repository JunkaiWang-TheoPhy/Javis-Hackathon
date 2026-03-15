import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEPLOY_SCRIPT = ROOT / "tools" / "mi_band_desktop_bridge" / "deploy_remote.py"


class DeployRemoteScriptTest(unittest.TestCase):
    def test_deploy_script_exists_and_targets_remote_openclaw_files(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("mi-band-bridge", text)
        self.assertIn("MI_BAND_BRIDGE.md", text)
        self.assertIn("openclaw.json", text)
        self.assertIn("gateway restart", text)
        self.assertIn("--skip-restart", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_URL", text)
        self.assertIn(".openclaw-mi-band-bridge-tunnel.json", text)


if __name__ == "__main__":
    unittest.main()
