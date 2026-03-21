from __future__ import annotations

import unittest

import gateway_client


class GatewayClientTest(unittest.TestCase):
    def test_build_url_normalizes_slashes(self) -> None:
        self.assertEqual(
            gateway_client.build_url("http://127.0.0.1:8765/", "status"),
            "http://127.0.0.1:8765/status",
        )

    def test_parse_sse_block_extracts_event_and_data(self) -> None:
        block = "event: health_update\ndata: {\"metric\":\"heart_rate_bpm\"}\n"
        payload = gateway_client.parse_sse_block(block)

        self.assertEqual(payload["event"], "health_update")
        self.assertEqual(payload["data"], "{\"metric\":\"heart_rate_bpm\"}")

    def test_comment_only_payload_is_treated_as_empty(self) -> None:
        payload = gateway_client.parse_sse_block(": connected\n")
        self.assertTrue(gateway_client.is_empty_event(payload))


if __name__ == "__main__":
    unittest.main()
