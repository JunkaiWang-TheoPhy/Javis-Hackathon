import importlib.util
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


if __name__ == "__main__":
    unittest.main()
