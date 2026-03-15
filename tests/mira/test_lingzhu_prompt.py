import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROMPT_TXT = ROOT / "Mira_v1" / "openclaw-config" / "lingzhu-system-prompt.txt"
PROMPT_SNIPPET = ROOT / "Mira_v1" / "openclaw-config" / "lingzhu-config-snippet.json5"


class LingzhuPromptTest(unittest.TestCase):
    def test_prompt_files_exist(self) -> None:
        self.assertTrue(PROMPT_TXT.is_file(), PROMPT_TXT)
        self.assertTrue(PROMPT_SNIPPET.is_file(), PROMPT_SNIPPET)

    def test_system_prompt_forbids_leaking_bridge_auth_details_to_users(self) -> None:
        text = PROMPT_TXT.read_text(encoding="utf-8")
        self.assertIn("不要把内部桥接", text)
        self.assertIn("unauthorized", text)
        self.assertIn("token", text)
        self.assertIn("band_get_latest", text)
        self.assertIn("printer_get_status", text)

    def test_config_snippet_keeps_same_bridge_failure_guidance(self) -> None:
        text = PROMPT_SNIPPET.read_text(encoding="utf-8")
        self.assertIn("不要把内部桥接", text)
        self.assertIn("unauthorized", text)
        self.assertIn("token", text)
        self.assertIn("band_get_latest", text)
        self.assertIn("printer_get_status", text)


if __name__ == "__main__":
    unittest.main()
