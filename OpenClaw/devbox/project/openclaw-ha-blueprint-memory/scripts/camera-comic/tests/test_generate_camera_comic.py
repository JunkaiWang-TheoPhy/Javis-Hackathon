from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "generate_camera_comic.py"


def load_module():
    spec = importlib.util.spec_from_file_location("generate_camera_comic", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module from {SCRIPT_PATH}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class GenerateCameraComicTests(unittest.TestCase):
    def test_build_comic_prompt_mentions_comic_and_lobster(self) -> None:
        module = load_module()

        prompt = module.build_comic_prompt()

        self.assertIn("comic", prompt.lower())
        self.assertIn("lobster", prompt.lower())

    def test_build_output_stem_is_source_specific_and_stable(self) -> None:
        module = load_module()

        stem = module.build_output_stem("localmac", "2026-03-15T10:11:12Z")

        self.assertEqual(stem, "20260315T101112Z-localmac-comic")


if __name__ == "__main__":
    unittest.main()
