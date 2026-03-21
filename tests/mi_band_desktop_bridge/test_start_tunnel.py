import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
START_TUNNEL = ROOT / "tools" / "mi_band_desktop_bridge" / "start_tunnel.sh"


class StartTunnelScriptTest(unittest.TestCase):
    def test_start_tunnel_supports_ssh_reverse_provider(self) -> None:
        text = START_TUNNEL.read_text(encoding="utf-8")
        self.assertIn("ssh-reverse", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_REMOTE", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT", text)
        self.assertIn("ExitOnForwardFailure=yes", text)
        self.assertIn("-R", text)


if __name__ == "__main__":
    unittest.main()
