from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "push_camera_comic_to_devbox.py"


def load_module():
    spec = importlib.util.spec_from_file_location("push_camera_comic_to_devbox", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {SCRIPT_PATH}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PushCameraComicToDevboxTests(unittest.TestCase):
    def test_build_remote_paths_uses_source_specific_cache(self) -> None:
        module = load_module()

        paths = module.build_remote_paths(
            source="localmac",
            remote_workspace=Path("/home/devbox/.openclaw/workspace"),
        )

        self.assertEqual(
            paths["image_path"],
            "/home/devbox/.openclaw/workspace/.cache/localmac-camera/latest.jpg",
        )
        self.assertEqual(
            paths["metadata_path"],
            "/home/devbox/.openclaw/workspace/.cache/localmac-camera/latest.json",
        )
        self.assertEqual(paths["output_dir"], "/home/devbox/.openclaw/workspace/comic")

    def test_parse_renderer_result_uses_last_json_line(self) -> None:
        module = load_module()

        payload = module.parse_renderer_result(
            "notice: rendering\n"
            '{"output":"/home/devbox/.openclaw/workspace/comic/out.png","sidecar":"/home/devbox/.openclaw/workspace/comic/out.json"}\n'
        )

        self.assertEqual(payload["output"], "/home/devbox/.openclaw/workspace/comic/out.png")
        self.assertEqual(payload["sidecar"], "/home/devbox/.openclaw/workspace/comic/out.json")

    def test_build_scp_upload_command_keeps_local_file_before_remote_target(self) -> None:
        module = load_module()

        command = module.build_scp_upload_command(
            local_path="/tmp/source.jpg",
            remote_target="devbox:/tmp/target.jpg",
            identity=None,
            port=None,
        )

        self.assertEqual(command, ["scp", "/tmp/source.jpg", "devbox:/tmp/target.jpg"])

    def test_build_remote_render_ssh_command_quotes_bash_script_as_one_argument(self) -> None:
        module = load_module()

        command = module.build_remote_render_ssh_command(
            target="devbox",
            identity=None,
            port=None,
            remote_command="mkdir -p /tmp/a && python3 /tmp/run.py",
        )

        self.assertEqual(command[0], "ssh")
        self.assertEqual(command[1], "devbox")
        self.assertEqual(command[2], "bash -lc 'mkdir -p /tmp/a && python3 /tmp/run.py'")

    def test_is_retryable_failure_matches_transient_ssh_and_gateway_errors(self) -> None:
        module = load_module()

        self.assertTrue(module.is_retryable_failure("Connection closed by 28.0.0.66 port 2233"))
        self.assertTrue(module.is_retryable_failure("nodes camera snap failed: Error: gateway closed (1012): service restart"))
        self.assertFalse(module.is_retryable_failure("missing file: /tmp/nope.jpg"))


if __name__ == "__main__":
    unittest.main()
