import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INSTALL_SCRIPT = ROOT / "tools" / "mi_band_desktop_bridge" / "install_launchd.py"


class InstallLaunchdScriptTest(unittest.TestCase):
    def test_install_script_exists(self) -> None:
        self.assertTrue(INSTALL_SCRIPT.is_file())

    def test_install_script_builds_bridge_and_tunnel_launch_agents(self) -> None:
        spec = importlib.util.spec_from_file_location("mi_band_install_launchd", INSTALL_SCRIPT)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        script_dir = Path("/tmp/mi-band-runtime")
        state_dir = Path("/tmp/mi-band-state")

        bridge = module.build_bridge_plist(script_dir, state_dir)
        tunnel = module.build_tunnel_plist(script_dir, state_dir)

        self.assertEqual(module.BRIDGE_LABEL, "com.javis.openclaw.mi-band-bridge")
        self.assertEqual(module.TUNNEL_LABEL, "com.javis.openclaw.mi-band-tunnel")
        self.assertIn(str(script_dir / "start_bridge.sh"), bridge["ProgramArguments"])
        self.assertEqual(bridge["KeepAlive"], True)
        self.assertIn(str(script_dir / "start_tunnel.sh"), tunnel["ProgramArguments"])
        self.assertEqual(tunnel["KeepAlive"], True)
        self.assertEqual(
            tunnel["EnvironmentVariables"]["OPENCLAW_MI_BAND_BRIDGE_TUNNEL_PROVIDER"],
            "ssh-reverse",
        )
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_REMOTE", tunnel["EnvironmentVariables"])
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_REMOTE_BIND_PORT", tunnel["EnvironmentVariables"])

    def test_common_environment_includes_bridge_token(self) -> None:
        spec = importlib.util.spec_from_file_location("mi_band_install_launchd", INSTALL_SCRIPT)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        script_dir = Path("/tmp/mi-band-runtime")
        token = "test-mi-band-token"
        original = module.os.environ.get("OPENCLAW_MI_BAND_BRIDGE_TOKEN")
        module.os.environ["OPENCLAW_MI_BAND_BRIDGE_TOKEN"] = token
        try:
            env = module.common_environment(script_dir)
        finally:
            if original is None:
                module.os.environ.pop("OPENCLAW_MI_BAND_BRIDGE_TOKEN", None)
            else:
                module.os.environ["OPENCLAW_MI_BAND_BRIDGE_TOKEN"] = original

        self.assertEqual(env["OPENCLAW_MI_BAND_BRIDGE_TOKEN"], token)


if __name__ == "__main__":
    unittest.main()
