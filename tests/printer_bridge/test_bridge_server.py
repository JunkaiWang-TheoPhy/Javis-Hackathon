import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "tools" / "printer_bridge" / "bridge_server.py"


def load_bridge_module():
    if not MODULE_PATH.is_file():
        raise AssertionError(f"missing bridge server module: {MODULE_PATH}")

    spec = importlib.util.spec_from_file_location("bridge_server", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class BridgeServerTest(unittest.TestCase):
    def test_build_root_payload_exposes_health_and_tool_hints(self) -> None:
        module = load_bridge_module()

        payload = module.build_root_payload()

        self.assertTrue(payload["ok"])
        self.assertEqual(payload["service"], "openclaw-printer-bridge")
        self.assertEqual(payload["health_path"], "/health")
        self.assertEqual(payload["status_path"], "/v1/printers/default")
        self.assertIn("printer_get_status", payload["preferred_tools"])

    def test_resolve_media_alias_maps_three_inch(self) -> None:
        module = load_bridge_module()
        self.assertEqual(module.resolve_media_alias("three_inch"), "3x3.Fullbleed")
        self.assertEqual(module.resolve_media_alias("4x6"), "4x6")

    def test_resolve_media_alias_rejects_unknown_value(self) -> None:
        module = load_bridge_module()
        with self.assertRaises(ValueError):
            module.resolve_media_alias("letter")

    def test_is_authorized_accepts_matching_bearer_token(self) -> None:
        module = load_bridge_module()
        self.assertTrue(
            module.is_authorized("Bearer bridge-secret", "bridge-secret")
        )
        self.assertFalse(module.is_authorized("Bearer wrong", "bridge-secret"))
        self.assertFalse(module.is_authorized("", "bridge-secret"))

    def test_validate_print_request_rejects_wrong_file_type(self) -> None:
        module = load_bridge_module()
        with self.assertRaises(ValueError):
            module.validate_print_request(
                {
                    "source_path": "/tmp/not-an-image.txt",
                    "media": "three_inch",
                },
                job_kind="image",
            )

    def test_build_print_command_for_image_adds_fit_to_page(self) -> None:
        module = load_bridge_module()
        command = module.build_print_command(
            queue_name="Mi_Wireless_Photo_Printer_1S__6528_",
            media="3x3.Fullbleed",
            job_path="/tmp/test.jpg",
            fit_to_page=True,
        )
        self.assertEqual(
            command,
            [
                "lp",
                "-d",
                "Mi_Wireless_Photo_Printer_1S__6528_",
                "-o",
                "media=3x3.Fullbleed",
                "-o",
                "fit-to-page",
                "/tmp/test.jpg",
            ],
        )

    def test_build_print_command_for_pdf_omits_fit_to_page(self) -> None:
        module = load_bridge_module()
        command = module.build_print_command(
            queue_name="Mi_Wireless_Photo_Printer_1S__6528_",
            media="4x6",
            job_path="/tmp/test.pdf",
            fit_to_page=False,
        )
        self.assertEqual(
            command,
            [
                "lp",
                "-d",
                "Mi_Wireless_Photo_Printer_1S__6528_",
                "-o",
                "media=4x6",
                "/tmp/test.pdf",
            ],
        )


if __name__ == "__main__":
    unittest.main()
