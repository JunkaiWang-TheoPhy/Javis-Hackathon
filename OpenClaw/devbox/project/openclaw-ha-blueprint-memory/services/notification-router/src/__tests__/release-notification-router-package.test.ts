import assert from "node:assert/strict";
import http from "node:http";
import test, { afterEach } from "node:test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(process.cwd(), "..", "..", "..", "..");
const releaseServerModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/services/notification-router/src/server.ts",
  ),
).href;

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
    res.end(JSON.stringify({ ok: true, id: "release-dm-001" }));
  });

  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolvePromise();
    });
  });

  closers.push(
    () =>
      new Promise<void>((resolvePromise, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolvePromise();
        });
      }),
  );

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("release webhook receiver failed to bind");
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}/hook`,
  };
}

test("release-side notification-router package serves health and dispatches an allowed self checkin", async () => {
  const { createNotificationRouterServer } = await import(releaseServerModuleUrl);
  const receiver = await createWebhookReceiver();

  const router = createNotificationRouterServer({
    channels: {
      openclaw_channel_dm: {
        kind: "webhook",
        url: receiver.url,
        secret: "release-router-secret",
      },
    },
  });
  await router.listen(0);
  closers.push(() => router.close());

  const healthResponse = await fetch(`${router.baseUrl}/v1/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), {
    ok: true,
    service: "notification-router",
  });

  const dispatchResponse = await fetch(`${router.baseUrl}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: {
        intent_id: "release-intent-001",
        created_at: "2026-03-19T12:00:00.000Z",
        source: "heartbeat",
        message_kind: "checkin",
        recipient_scope: "self",
        risk_tier: "low",
        privacy_level: "private",
        content: "Release-side router check-in.",
        preferred_channels: ["openclaw_channel_dm"],
        recipient: {
          id: "user-self",
        },
        tags: ["wellbeing"],
      },
    }),
  });

  assert.equal(dispatchResponse.status, 200);
  const body = await dispatchResponse.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "allow");
  assert.equal(body.delivery.channel, "openclaw_channel_dm");
  assert.equal(body.delivery.delivery_status, "sent");
  assert.equal(body.delivery.external_message_id, "release-dm-001");
  assert.equal(receiver.requests.length, 1);
});
