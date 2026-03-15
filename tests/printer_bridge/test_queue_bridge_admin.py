import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
QUEUE_ADMIN = ROOT / "tools" / "printer_bridge" / "queue_bridge_admin.py"


def load_queue_admin_module():
    spec = importlib.util.spec_from_file_location("queue_bridge_admin", QUEUE_ADMIN)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class QueueBridgeAdminTest(unittest.TestCase):
    def test_queue_admin_script_exists(self) -> None:
        self.assertTrue(QUEUE_ADMIN.is_file(), QUEUE_ADMIN)

    def test_claim_complete_and_status_flow(self) -> None:
        module = load_queue_admin_module()

        with tempfile.TemporaryDirectory() as temp_dir:
            queue_root = Path(temp_dir) / "queue"
            paths = module.ensure_queue_dirs(queue_root)
            request_id = "req-1"
            (paths["pending"] / f"{request_id}.json").write_text(
                json.dumps(
                    {
                        "id": request_id,
                        "method": "GET",
                        "path": "/v1/printers/default",
                        "body": None,
                    }
                ),
                encoding="utf-8",
            )

            claimed = module.claim_request(
                queue_root,
                "worker-a",
                wait_seconds=0.1,
                poll_interval=0.01,
                lease_seconds=30.0,
            )
            self.assertEqual(claimed["id"], request_id)
            self.assertTrue((paths["claimed"] / f"{request_id}.json").is_file())

            module.complete_request(
                queue_root,
                "worker-a",
                request_id=request_id,
                response_payload={"statusCode": 200, "body": {"ok": True}},
            )

            self.assertTrue((paths["responses"] / f"{request_id}.json").is_file())
            self.assertFalse((paths["claimed"] / f"{request_id}.json").exists())

            status = module.read_status(queue_root)
            self.assertTrue(status["ok"])
            self.assertEqual(status["pending_requests"], 0)
            self.assertEqual(status["claimed_requests"], 0)
            self.assertTrue(status["connector_online"])


if __name__ == "__main__":
    unittest.main()
