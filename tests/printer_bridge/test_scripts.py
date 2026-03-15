import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
START_BRIDGE = ROOT / "tools" / "printer_bridge" / "start_bridge.sh"
START_TUNNEL = ROOT / "tools" / "printer_bridge" / "start_tunnel.sh"
STOP_TUNNEL = ROOT / "tools" / "printer_bridge" / "stop_tunnel.sh"


class ScriptLayoutTest(unittest.TestCase):
    def test_start_bridge_script_launches_python_bridge(self) -> None:
        text = START_BRIDGE.read_text(encoding="utf-8")
        self.assertIn("bridge_server.py", text)
        self.assertIn("OPENCLAW_PRINTER_BRIDGE_TOKEN", text)
        self.assertIn("python3", text)

    def test_start_tunnel_script_supports_dynamic_https_tunnels(self) -> None:
        text = START_TUNNEL.read_text(encoding="utf-8")
        self.assertIn("connector_loop.py", text)
        self.assertIn(".openclaw-printer-bridge-tunnel.json", text)

    def test_stop_tunnel_script_clears_state_and_stops_localtunnel(self) -> None:
        text = STOP_TUNNEL.read_text(encoding="utf-8")
        self.assertIn(".openclaw-printer-bridge-tunnel.json", text)
        self.assertIn("pkill", text)
        self.assertIn("connector_loop.py", text)
        self.assertIn("cloudflared tunnel .*--url http://127.0.0.1:9771", text)


if __name__ == "__main__":
    unittest.main()
