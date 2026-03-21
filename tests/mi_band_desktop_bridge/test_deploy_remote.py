import unittest
import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEPLOY_SCRIPT = ROOT / "tools" / "mi_band_desktop_bridge" / "deploy_remote.py"
SPEC = importlib.util.spec_from_file_location("deploy_remote", DEPLOY_SCRIPT)
assert SPEC and SPEC.loader
deploy_remote = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deploy_remote)


class DeployRemoteScriptTest(unittest.TestCase):
    def test_build_remote_layout_supports_root_home(self) -> None:
        layout = deploy_remote.build_remote_layout(
            "/root",
            "/root/.nvm/versions/node/v22.22.0/bin/openclaw",
        )

        self.assertEqual(layout["openclaw_dir"], "/root/.openclaw")
        self.assertEqual(layout["extension_dir"], "/root/.openclaw/extensions/mi-band-bridge")
        self.assertEqual(layout["config_path"], "/root/.openclaw/openclaw.json")
        self.assertEqual(layout["workspace_dir"], "/root/.openclaw/workspace")
        self.assertEqual(layout["cache_file_path"], "/root/.openclaw/workspace/MI_BAND_LATEST.json")
        self.assertEqual(layout["openclaw_bin"], "/root/.nvm/versions/node/v22.22.0/bin/openclaw")

    def test_build_service_layout_targets_active_state_dir(self) -> None:
        layout = deploy_remote.build_service_layout(
            "/root/mira/.mira-runtime/mira-openclaw/core/openclaw-config/openclaw.local.json",
            "/root/mira/.mira-runtime/mira-openclaw/openclaw-state",
            "/root/.nvm/versions/node/v22.22.0/bin/openclaw",
            "mira-openclaw-gateway.service",
            workspace_dir="/root/mira/.mira-runtime/mira-openclaw/openclaw-state/workspace-main",
        )

        self.assertEqual(
            layout["extension_dir"],
            "/root/mira/.mira-runtime/mira-openclaw/core/plugins/mi-band-bridge",
        )
        self.assertEqual(
            layout["config_path"],
            "/root/mira/.mira-runtime/mira-openclaw/core/openclaw-config/openclaw.local.json",
        )
        self.assertEqual(
            layout["workspace_dir"],
            "/root/mira/.mira-runtime/mira-openclaw/core/workspace",
        )
        self.assertEqual(
            layout["cache_file_path"],
            "/root/mira/.mira-runtime/mira-openclaw/openclaw-state/MI_BAND_LATEST.json",
        )
        self.assertEqual(
            layout["restart_command"],
            "systemctl --user restart mira-openclaw-gateway.service",
        )

    def test_deploy_script_exists_and_targets_remote_openclaw_files(self) -> None:
        text = DEPLOY_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("mi-band-bridge", text)
        self.assertIn("MI_BAND_BRIDGE.md", text)
        self.assertIn("openclaw.json", text)
        self.assertIn("openclaw.local.json", text)
        self.assertIn("gateway restart", text)
        self.assertIn("OPENCLAW_CONFIG_PATH", text)
        self.assertIn("OPENCLAW_STATE_DIR", text)
        self.assertIn("systemctl --user restart", text)
        self.assertIn("--skip-restart", text)
        self.assertIn("OPENCLAW_MI_BAND_BRIDGE_URL", text)
        self.assertIn(".openclaw-mi-band-bridge-tunnel.json", text)
        self.assertIn("Never call the bridge URL directly", text)
        self.assertIn("band_get_fresh_latest", text)
        self.assertIn("freshReadMaxWaitSeconds", text)
        self.assertIn("core/plugins/mi-band-bridge", text)
        self.assertIn("Do not tell users about bridge tokens", text)
        self.assertIn("temporarily unavailable", text)


if __name__ == "__main__":
    unittest.main()
