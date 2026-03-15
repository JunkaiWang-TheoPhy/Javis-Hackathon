import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BOOTSTRAP_SCRIPT = ROOT / "tools" / "printer_bridge" / "bootstrap_stack.py"
UP_SCRIPT = ROOT / "tools" / "printer_bridge" / "up.sh"


def load_bootstrap_module():
    spec = importlib.util.spec_from_file_location("bootstrap_stack", BOOTSTRAP_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class BootstrapStackTest(unittest.TestCase):
    def test_bootstrap_files_exist(self) -> None:
        self.assertTrue(BOOTSTRAP_SCRIPT.is_file(), BOOTSTRAP_SCRIPT)
        self.assertTrue(UP_SCRIPT.is_file(), UP_SCRIPT)

    def test_public_tunnel_health_timeout_allows_slow_quick_tunnels(self) -> None:
        module = load_bootstrap_module()
        self.assertEqual(module.PUBLIC_TUNNEL_HEALTH_TIMEOUT_SECONDS, 120.0)

    def test_build_health_check_command_targets_health_endpoint(self) -> None:
        module = load_bootstrap_module()
        self.assertEqual(
            module.build_health_check_command("https://printer.example", 9.5),
            [
                "curl",
                "-fsS",
                "--max-time",
                "9.5",
                "https://printer.example/health",
            ],
        )

    def test_read_public_bridge_url_reads_state_file(self) -> None:
        module = load_bootstrap_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = Path(temp_dir) / "tunnel.json"
            state_path.write_text(
                json.dumps({"provider": "cloudflared", "public_url": "https://printer.example"}),
                encoding="utf-8",
            )

            self.assertEqual(
                module.read_public_bridge_url(state_path),
                "https://printer.example",
            )

    def test_wait_for_public_bridge_url_returns_existing_url(self) -> None:
        module = load_bootstrap_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = Path(temp_dir) / "tunnel.json"
            state_path.write_text(
                json.dumps({"public_url": "https://printer.example"}),
                encoding="utf-8",
            )

            self.assertEqual(
                module.wait_for_public_bridge_url(
                    state_path,
                    timeout_seconds=0.1,
                    poll_interval=0.01,
                ),
                "https://printer.example",
            )

    def test_read_public_bridge_url_rejects_cloudflare_api_endpoint(self) -> None:
        module = load_bootstrap_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = Path(temp_dir) / "tunnel.json"
            state_path.write_text(
                json.dumps({"public_url": "https://api.trycloudflare.com"}),
                encoding="utf-8",
            )

            self.assertIsNone(module.read_public_bridge_url(state_path))

    def test_remote_gateway_start_command_uses_nohup_and_force(self) -> None:
        module = load_bootstrap_module()
        command = module.build_remote_gateway_start_command("devbox")

        self.assertEqual(command[:2], ["ssh", "devbox"])
        self.assertIn("nohup", command[2])
        self.assertIn("gateway run --force", command[2])

    def test_remote_gateway_probe_command_checks_loopback_port(self) -> None:
        module = load_bootstrap_module()
        command = module.build_remote_gateway_probe_command("devbox")

        self.assertEqual(command[:2], ["ssh", "devbox"])
        self.assertIn("connect_ex", command[2])
        self.assertIn("127.0.0.1", command[2])
        self.assertIn("18789", command[2])

    def test_up_wrapper_executes_bootstrap_script(self) -> None:
        text = UP_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("bootstrap_stack.py", text)
        self.assertIn("python3", text)


if __name__ == "__main__":
    unittest.main()
