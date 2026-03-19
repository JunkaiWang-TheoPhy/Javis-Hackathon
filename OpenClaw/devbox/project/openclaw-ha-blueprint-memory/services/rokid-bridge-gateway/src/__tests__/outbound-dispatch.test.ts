import assert from "node:assert/strict";
import http from "node:http";
import test, { afterEach } from "node:test";

import type { OutboundMessageIntent } from "../../../../packages/contracts/src/index.ts";
import { createNotificationRouterServer } from "../../../notification-router/src/server.ts";
import { createBridgeServer } from "../server.ts";

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length > 0) {
    const close = closers.pop();
    if (close) {
      await close();
    }
  }
});

async function createWebhookReceiver() {
  const requests: Array<{ body: unknown; headers: http.IncomingHttpHeaders }> = [];

  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString("utf8");
    requests.push({
      body: raw ? JSON.parse(raw) : null,
      headers: req.headers,
    });

    res.statusCode = 202;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, id: "dm-msg-bridge-001" }));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  closers.push(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  );

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("webhook receiver did not bind");
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}/hook`,
  };
}

function buildIntent(
  overrides: Partial<OutboundMessageIntent> = {},
): OutboundMessageIntent {
  return {
    intent_id: "intent-bridge-001",
    created_at: "2026-03-19T08:00:00.000Z",
    source: "heartbeat",
    message_kind: "checkin",
    recipient_scope: "self",
    risk_tier: "low",
    privacy_level: "private",
    content: "Bridge-triggered private check-in.",
    preferred_channels: ["openclaw_channel_dm"],
    recipient: {
      id: "user-self",
      address: "user-self",
    },
    tags: ["wellbeing"],
    ...overrides,
  };
}

test("POST /v1/outbound/dispatch forwards an allowed private DM intent through notification-router", async () => {
  const receiver = await createWebhookReceiver();
  const router = createNotificationRouterServer({
    channels: {
      openclaw_channel_dm: {
        kind: "webhook",
        url: receiver.url,
        secret: "bridge-router-secret",
      },
    },
  });
  await router.listen(0);
  closers.push(() => router.close());

  const gateway = createBridgeServer();
  await gateway.listen(0);
  closers.push(() => gateway.close());

  const previousBaseUrl = process.env.MIRA_NOTIFICATION_ROUTER_BASE_URL;
  process.env.MIRA_NOTIFICATION_ROUTER_BASE_URL = router.baseUrl;

  try {
    const response = await fetch(`${gateway.baseUrl}/v1/outbound/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: buildIntent(),
      }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.decision.action, "allow");
    assert.equal(body.decision.matchedRule, "user_self_checkin");
    assert.equal(body.delivery.channel, "openclaw_channel_dm");
    assert.equal(body.delivery.delivery_status, "sent");
    assert.equal(receiver.requests.length, 1);
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.MIRA_NOTIFICATION_ROUTER_BASE_URL;
    } else {
      process.env.MIRA_NOTIFICATION_ROUTER_BASE_URL = previousBaseUrl;
    }
  }
});
