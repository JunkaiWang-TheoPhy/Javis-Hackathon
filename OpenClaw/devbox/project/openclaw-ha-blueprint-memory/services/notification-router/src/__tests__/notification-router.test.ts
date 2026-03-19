import assert from "node:assert/strict";
import http from "node:http";
import test, { afterEach } from "node:test";

import { createNotificationRouterServer } from "../server.ts";
import type { ChannelDeliveryResult, OutboundMessageIntent } from "../types.ts";

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
    res.end(JSON.stringify({ ok: true, id: "dm-msg-001" }));
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
    throw new Error("receiver server failed to bind");
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}/hook`,
  };
}

async function createResendReceiver() {
  const requests: Array<{
    body: unknown;
    headers: http.IncomingHttpHeaders;
    method?: string;
    url?: string;
  }> = [];

  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString("utf8");
    requests.push({
      body: raw ? JSON.parse(raw) : null,
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ id: "email-msg-001" }));
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
    throw new Error("resend receiver failed to bind");
  }

  return {
    requests,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

function buildIntent(
  overrides: Partial<OutboundMessageIntent> = {},
): OutboundMessageIntent {
  return {
    intent_id: "intent-001",
    created_at: "2026-03-17T10:00:00.000Z",
    source: "heartbeat",
    message_kind: "checkin",
    recipient_scope: "self",
    risk_tier: "low",
    privacy_level: "private",
    content: "Time for a quick check-in.",
    preferred_channels: ["openclaw_channel_dm"],
    recipient: {
      id: "user-self",
      address: "user-self",
    },
    tags: ["wellbeing"],
    ...overrides,
  };
}

test("notification-router types support canonical outbound intent and delivery result shapes", () => {
  const intent: OutboundMessageIntent = buildIntent();
  const delivery: ChannelDeliveryResult = {
    ok: true,
    channel: "openclaw_channel_dm",
    delivery_status: "sent",
    external_message_id: "dm-msg-001",
  };

  assert.equal(intent.message_kind, "checkin");
  assert.equal(intent.preferred_channels?.[0], "openclaw_channel_dm");
  assert.equal(delivery.delivery_status, "sent");
});

test("POST /v1/dispatch sends an allowed self checkin to the openclaw_channel_dm webhook", async () => {
  const receiver = await createWebhookReceiver();
  const router = createNotificationRouterServer({
    channels: {
      openclaw_channel_dm: {
        kind: "webhook",
        url: receiver.url,
        secret: "router-secret",
      },
    },
  });
  await router.listen(0);
  closers.push(() => router.close());

  const response = await fetch(`${router.baseUrl}/v1/dispatch`, {
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
  assert.equal(body.delivery.external_message_id, "dm-msg-001");
  assert.equal(receiver.requests.length, 1);
  assert.equal(
    receiver.requests[0]?.headers["x-mira-router-secret"],
    "router-secret",
  );
  assert.deepEqual(receiver.requests[0]?.body, {
    intent: buildIntent(),
    channel: "openclaw_channel_dm",
  });
});

test("POST /v1/dispatch does not send when the policy decision is ask", async () => {
  const receiver = await createWebhookReceiver();
  const router = createNotificationRouterServer({
    channels: {
      openclaw_channel_dm: {
        kind: "webhook",
        url: receiver.url,
      },
    },
  });
  await router.listen(0);
  closers.push(() => router.close());

  const response = await fetch(`${router.baseUrl}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: buildIntent({
        intent_id: "intent-002",
        message_kind: "escalation",
        recipient_scope: "caregiver",
        risk_tier: "medium",
        recipient: {
          id: "caregiver-001",
          address: "caregiver-001",
        },
      }),
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "ask");
  assert.equal(body.decision.matchedRule, "caregiver_escalation");
  assert.equal(body.delivery.channel, "openclaw_channel_dm");
  assert.equal(body.delivery.delivery_status, "skipped");
  assert.equal(receiver.requests.length, 0);
});

test("POST /v1/dispatch sends an allowed self checkin to the email channel through the Resend API", async () => {
  const receiver = await createResendReceiver();
  const router = createNotificationRouterServer({
    channels: {
      email: {
        kind: "resend_email",
        apiKey: "resend-test-key",
        from: "Mira <mira@example.com>",
        replyTo: "reply@example.com",
        apiBaseUrl: receiver.baseUrl,
      },
    },
  });
  await router.listen(0);
  closers.push(() => router.close());

  const response = await fetch(`${router.baseUrl}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: buildIntent({
        preferred_channels: ["email"],
        recipient: {
          id: "user-self-email",
          address: "user@example.com",
        },
        subject: "Mira check-in",
      }),
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "allow");
  assert.equal(body.decision.matchedRule, "user_self_checkin");
  assert.equal(body.delivery.channel, "email");
  assert.equal(body.delivery.delivery_status, "sent");
  assert.equal(body.delivery.external_message_id, "email-msg-001");
  assert.equal(receiver.requests.length, 1);
  assert.equal(receiver.requests[0]?.method, "POST");
  assert.equal(receiver.requests[0]?.url, "/emails");
  assert.equal(
    receiver.requests[0]?.headers.authorization,
    "Bearer resend-test-key",
  );
  assert.deepEqual(receiver.requests[0]?.body, {
    from: "Mira <mira@example.com>",
    to: ["user@example.com"],
    subject: "Mira check-in",
    text: "Time for a quick check-in.",
    reply_to: "reply@example.com",
  });
});
