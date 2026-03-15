import argparse
import base64
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PRINT_IMAGE_SCRIPT = ROOT / "tools" / "printer_bridge" / "print_image.py"


def load_print_image_module():
    spec = importlib.util.spec_from_file_location("print_image", PRINT_IMAGE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class PrintImageCliTest(unittest.TestCase):
    def test_print_image_script_exists(self) -> None:
        self.assertTrue(PRINT_IMAGE_SCRIPT.is_file(), PRINT_IMAGE_SCRIPT)

    def test_default_media_alias_is_three_inch(self) -> None:
        module = load_print_image_module()
        self.assertEqual(module.DEFAULT_MEDIA, "three_inch")

    def test_build_print_payload_base64_encodes_image(self) -> None:
        module = load_print_image_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "sample.jpg"
            image_path.write_bytes(b"fake-image-bytes")

            payload = module.build_print_payload(
                image_path,
                media="4x6",
                fit_to_page=True,
            )

            self.assertEqual(payload["filename"], "sample.jpg")
            self.assertEqual(payload["media"], "4x6")
            self.assertTrue(payload["fit_to_page"])
            self.assertEqual(
                base64.b64decode(payload["content_base64"]),
                b"fake-image-bytes",
            )

    def test_resolve_bridge_url_prefers_healthy_local_bridge(self) -> None:
        module = load_print_image_module()
        local_url = "http://127.0.0.1:9771"
        public_url = "https://printer.example"

        chosen = module.resolve_bridge_url(
            local_bridge_url=local_url,
            public_bridge_url=public_url,
            health_checker=lambda url: url == local_url,
        )

        self.assertEqual(chosen, local_url)

    def test_resolve_bridge_url_falls_back_to_public_url(self) -> None:
        module = load_print_image_module()
        local_url = "http://127.0.0.1:9771"
        public_url = "https://printer.example"

        chosen = module.resolve_bridge_url(
            local_bridge_url=local_url,
            public_bridge_url=public_url,
            health_checker=lambda url: url == public_url,
        )

        self.assertEqual(chosen, public_url)

    def test_resolve_bridge_url_skips_queue_transport_reference(self) -> None:
        module = load_print_image_module()
        chosen = module.resolve_bridge_url(
            local_bridge_url="http://127.0.0.1:9771",
            public_bridge_url="queue://devbox/home/devbox/.openclaw/printer-bridge-queue",
            public_bridge_provider="ssh_queue_proxy",
            health_checker=lambda _url: False,
        )

        self.assertIsNone(chosen)

    def test_parse_args_accepts_source_path_media_and_dry_run(self) -> None:
        module = load_print_image_module()
        args = module.parse_args(
            ["Readme/xiaomi-printer-label-test-image.jpg", "--media", "4x6", "--fit-to-page", "--dry-run"]
        )

        self.assertIsInstance(args, argparse.Namespace)
        self.assertEqual(args.source_path, Path("Readme/xiaomi-printer-label-test-image.jpg"))
        self.assertEqual(args.media, "4x6")
        self.assertTrue(args.fit_to_page)
        self.assertTrue(args.dry_run)

    def test_format_result_includes_bridge_url_and_job_metadata(self) -> None:
        module = load_print_image_module()
        result = module.format_result(
            bridge_url="https://printer.example",
            response_payload={"ok": True, "job_id": "printer-1", "media": "3x3.Fullbleed"},
            dry_run=False,
        )

        parsed = json.loads(result)
        self.assertEqual(parsed["bridge_url"], "https://printer.example")
        self.assertEqual(parsed["job_id"], "printer-1")
        self.assertEqual(parsed["media"], "3x3.Fullbleed")
        self.assertFalse(parsed["dry_run"])


if __name__ == "__main__":
    unittest.main()
