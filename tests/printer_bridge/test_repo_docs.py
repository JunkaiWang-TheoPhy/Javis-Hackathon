import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
README_PATH = ROOT / "docs" / "printer-bridge" / "README.md"
PROFILE_PATH = ROOT / "docs" / "printer-bridge" / "device-profile.json"
NOTES_PATH = ROOT / "docs" / "printer-bridge" / "remote-openclaw-notes.md"


class RepoDocsTest(unittest.TestCase):
    def test_repo_docs_exist_and_capture_printer_metadata(self) -> None:
        self.assertTrue(README_PATH.is_file(), README_PATH)
        self.assertTrue(PROFILE_PATH.is_file(), PROFILE_PATH)
        self.assertTrue(NOTES_PATH.is_file(), NOTES_PATH)

        profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))

        self.assertEqual(
            profile["printer"]["queue_name"],
            "Mi_Wireless_Photo_Printer_1S__6528_",
        )
        self.assertEqual(
            profile["printer"]["display_name"],
            "Mi Wireless Photo Printer 1S [6528]",
        )
        self.assertEqual(
            profile["printer"]["default_media_aliases"]["three_inch"],
            "3x3.Fullbleed",
        )
        self.assertEqual(
            profile["local_host"]["computer_name"],
            "Thomas的MacBook Air",
        )
        self.assertEqual(profile["bridge"]["transport"], "ssh_queue_connector")
        self.assertEqual(
            profile["bridge"]["remote_bridge_reference"],
            "queue://devbox/home/devbox/.openclaw/printer-bridge-queue",
        )
        self.assertEqual(profile["bridge"]["remote_host_alias"], "devbox")
        self.assertEqual(profile["bridge"]["remote_queue_root"], "/home/devbox/.openclaw/printer-bridge-queue")
        self.assertIn("3x3.Fullbleed", profile["printer"]["supported_media"])


if __name__ == "__main__":
    unittest.main()
