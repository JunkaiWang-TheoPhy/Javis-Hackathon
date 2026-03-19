import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";

import { createNotificationRouterServer } from "../server.ts";

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
    res.end(JSON.stringify({ ok: true, id: "release-router-local-test" }));
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
    throw new Error("webhook receiver failed to bind");
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}/hook`,
  };
}

test("release-side router can load an outbound policy from YAML and block a self checkin", async () => {
  const receiver = await createWebhookReceiver();
  const tempDir = await mkdtemp(join(tmpdir(), "mira-router-policy-"));
  closers.push(() => rm(tempDir, { recursive: true, force: true }));

  const policyPath = join(tempDir, "outbound-policy.yaml");
  await writeFile(
    policyPath,
    `version: 1
policy_name: test_policy
effective_date: "2026-03-19"
current_runtime_path: "config/outbound-policy.yaml"
defaults:
  action: ask
  known_recipient_required: false
  private_channel_required: false
  respect_quiet_hours: false
  log_all_attempts: true
  log_reason: true
rules:
  - name: block_self_checkin
    enabled: true
    action: block
    recipient_scope: [self]
    message_kind: [checkin]
    allowed_channels: [openclaw_channel_dm]
`,
    "utf8",
  );

  const router = createNotificationRouterServer({
    channels: {
      openclaw_channel_dm: {
        kind: "webhook",
        url: receiver.url,
        secret: "release-router-test-secret",
      },
    },
    outboundPolicyPath: policyPath,
  });
  await router.listen(0);
  closers.push(() => router.close());

  const response = await fetch(`${router.baseUrl}/v1/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: {
        intent_id: "local-release-test-001",
        created_at: "2026-03-19T13:00:00.000Z",
        source: "heartbeat",
        message_kind: "checkin",
        recipient_scope: "self",
        risk_tier: "low",
        privacy_level: "private",
        content: "Blocked by YAML-backed policy.",
        preferred_channels: ["openclaw_channel_dm"],
        recipient: {
          id: "user-self",
        },
      },
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "block");
  assert.equal(body.decision.matchedRule, "block_self_checkin");
  assert.equal(body.delivery.delivery_status, "blocked");
  assert.equal(receiver.requests.length, 0);
});
