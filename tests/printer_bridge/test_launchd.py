import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INSTALL_SCRIPT = ROOT / "tools" / "printer_bridge" / "install_launchd.py"


def load_install_module():
    spec = importlib.util.spec_from_file_location("install_launchd", INSTALL_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class LaunchdInstallTest(unittest.TestCase):
    def test_install_script_exists(self) -> None:
        self.assertTrue(INSTALL_SCRIPT.is_file(), INSTALL_SCRIPT)

    def test_bridge_launch_agent_keeps_bridge_alive(self) -> None:
        module = load_install_module()
        payload = module.build_bridge_plist(Path("/repo/tools/printer_bridge"), Path("/state"))

        self.assertEqual(payload["Label"], module.BRIDGE_LABEL)
        self.assertTrue(payload["KeepAlive"])
        self.assertTrue(payload["RunAtLoad"])
        self.assertIn("/repo/tools/printer_bridge/start_bridge.sh", payload["ProgramArguments"])

    def test_tunnel_launch_agent_keeps_tunnel_alive(self) -> None:
        module = load_install_module()
        payload = module.build_tunnel_plist(Path("/repo/tools/printer_bridge"), Path("/state"))

        self.assertEqual(payload["Label"], module.TUNNEL_LABEL)
        self.assertTrue(payload["KeepAlive"])
        self.assertTrue(payload["RunAtLoad"])
        self.assertIn("/repo/tools/printer_bridge/start_tunnel.sh", payload["ProgramArguments"])

    def test_install_script_knows_how_to_take_over_existing_bridge_process(self) -> None:
        module = load_install_module()
        self.assertEqual(
            module.bridge_takeover_command(),
            ["pkill", "-f", "bridge_server.py"],
        )

    def test_sync_launch_agent_periodically_refreshes_remote_config(self) -> None:
        module = load_install_module()
        payload = module.build_sync_plist(Path("/repo/tools/printer_bridge"), Path("/state"))

        self.assertEqual(payload["Label"], module.SYNC_LABEL)
        self.assertEqual(payload["StartInterval"], 300)
        self.assertTrue(payload["RunAtLoad"])
        self.assertIn("/repo/tools/printer_bridge/up.sh", payload["ProgramArguments"])
        self.assertIn("--skip-remote-gateway", payload["ProgramArguments"])

    def test_launch_agents_install_into_user_launchagents(self) -> None:
        module = load_install_module()
        self.assertEqual(
            module.default_launch_agents_dir(),
            Path.home() / "Library" / "LaunchAgents",
        )

    def test_runtime_tree_lives_under_state_dir_and_contains_bridge_files(self) -> None:
        module = load_install_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            state_dir = Path(temp_dir) / "state"
            runtime_dir = module.runtime_dir(state_dir)

            self.assertEqual(runtime_dir, state_dir / "runtime")

            module.materialize_runtime_tree(runtime_dir)

            self.assertTrue((runtime_dir / "start_bridge.sh").is_file())
            self.assertTrue((runtime_dir / "up.sh").is_file())
            self.assertTrue((runtime_dir / "bridge_server.py").is_file())
            self.assertTrue((runtime_dir / "bootstrap_stack.py").is_file())
            self.assertTrue((runtime_dir / "connector_loop.py").is_file())
            self.assertTrue((runtime_dir / "deploy_remote.py").is_file())
            self.assertTrue((runtime_dir / "queue_bridge_admin.py").is_file())
            self.assertTrue((runtime_dir / "openclaw_printer_plugin" / "index.mjs").is_file())

    def test_install_script_knows_how_to_stage_devbox_ssh_identity_for_launchd(self) -> None:
        text = INSTALL_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("devbox_ssh_identity", text)
        self.assertIn('"ssh", "-G"', text)


if __name__ == "__main__":
    unittest.main()
