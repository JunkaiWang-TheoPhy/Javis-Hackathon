import importlib.util
import io
import json
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / "tools" / "seedream_smoke_test.py"


def load_module():
    if not SCRIPT_PATH.is_file():
        raise AssertionError(f"missing script: {SCRIPT_PATH}")

    spec = importlib.util.spec_from_file_location("seedream_smoke_test", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class SeedreamSmokeTest(unittest.TestCase):
    def test_script_exists(self) -> None:
        self.assertTrue(SCRIPT_PATH.is_file(), SCRIPT_PATH)

    def test_build_generation_payload_uses_expected_defaults(self) -> None:
        module = load_module()
        payload = module.build_generation_payload(
            model="doubao-seedream-5-0-260128",
            prompt="一只橘猫坐在窗边，极简插画风格",
            size="1024x1024",
            response_format="url",
        )

        self.assertEqual(payload["model"], "doubao-seedream-5-0-260128")
        self.assertEqual(payload["prompt"], "一只橘猫坐在窗边，极简插画风格")
        self.assertEqual(payload["size"], "1024x1024")
        self.assertEqual(payload["response_format"], "url")

    def test_main_reports_model_not_open_error(self) -> None:
        module = load_module()

        def fake_post_json(_url, _payload, _api_key, _timeout):
            return 404, {
                "error": {
                    "code": "ModelNotOpen",
                    "message": "Please activate the model service in the Ark Console.",
                }
            }

        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            exit_code = module.main(
                [
                    "--api-key",
                    "test-key",
                    "--model",
                    "doubao-seedream-5-0-260128",
                    "--prompt",
                    "一只橘猫坐在窗边，极简插画风格",
                ],
                post_json=fake_post_json,
            )

        self.assertEqual(exit_code, 1)
        self.assertEqual("", stdout.getvalue())
        payload = json.loads(stderr.getvalue())
        self.assertFalse(payload["ok"])
        self.assertEqual(payload["status_code"], 404)
        self.assertEqual(payload["error"]["code"], "ModelNotOpen")
        self.assertIn("activate the model service", payload["error"]["message"])


if __name__ == "__main__":
    unittest.main()
