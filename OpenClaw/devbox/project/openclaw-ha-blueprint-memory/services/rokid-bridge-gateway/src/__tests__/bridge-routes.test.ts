import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";

import { SQLiteMemoryLedger } from "../memory/sqliteMemoryLedger.ts";
import { createBridgeServer } from "../server.ts";

const closers: Array<() => Promise<void>> = [];
const tempDirs: string[] = [];

afterEach(async () => {
  while (closers.length > 0) {
    const close = closers.pop();
    if (close) {
      await close();
    }
  }

  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

function createLedger() {
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-ledger-"));
  tempDirs.push(dir);
  return new SQLiteMemoryLedger(join(dir, "memory.sqlite"));
}

function buildObservation() {
  return {
    schemaVersion: "0.1.0",
    sessionId: "sess-rokid-001",
    observationId: "obs-0001",
    observedAt: "2026-03-14T10:15:00.000Z",
    source: {
      deviceFamily: "rokid_glasses",
      appId: "com.example.rokid.companion",
      appVersion: "0.1.0",
    },
    capture: {
      mode: "snapshot",
      frameRef: "cache://frame-0001.jpg",
      width: 3024,
      height: 4032,
    },
    detections: [
      {
        id: "det-1",
        label: "coffee_machine",
        score: 0.94,
        bbox: { x: 1180, y: 900, w: 860, h: 1120 },
      },
    ],
    ocr: [
      {
        text: "Latte Ready",
        score: 0.98,
        bbox: { x: 1450, y: 1180, w: 360, h: 90 },
      },
    ],
    selectedDetectionId: "det-1",
    userEvent: {
      type: "voice_query",
      text: "What is this and can you start it?",
    },
    summary: "User selected a coffee machine. OCR suggests it is ready.",
    privacy: {
      redactFaces: true,
      retainFrame: false,
    },
  };
}

function buildAmbientObservation(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "0.1.0",
    sessionId: "sess-mac-001",
    observationId: "amb-0001",
    observedAt: "2026-03-15T08:00:00.000Z",
    source: {
      deviceFamily: "mac_webcam",
      deviceName: "Thomas的MacBook Air",
      appVersion: "0.1.0",
    },
    capture: {
      mode: "snapshot",
      frameRef: "cache://localmac/latest.jpg",
      width: 1600,
      height: 900,
    },
    event: {
      changeScore: 0.32,
      personPresent: true,
      personCount: 1,
      activityState: "person_present",
      reasons: ["person_appeared", "scene_changed"],
    },
    privacy: {
      retainFrame: false,
    },
    ...overrides,
  };
}

test("POST /v1/observe returns a confirm-tier coffee machine envelope", async () => {
  const ledger = createLedger();
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
    haControlConfig: {
      baseUrl: "http://homeassistant:8123",
      token: "test-token",
      ecosystems: [
        {
          id: "demo-home",
          vendor: "xiaomi",
          integration: "home_assistant",
          devices: [
            {
              id: "coffee-scene",
              entityId: "scene.morning_coffee",
              kind: "scene",
              aliases: ["coffee machine", "coffee_machine"],
              capabilities: [
                {
                  intent: "activate",
                  domain: "scene",
                  service: "turn_on",
                  riskTier: "confirm",
                  requiresConfirmation: true,
                },
              ],
            },
          ],
        },
      ],
    },
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildObservation() }),
  });

  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.safetyTier, "confirm");
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "overlay_panel"),
    true,
  );
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "highlight_target"),
    true,
  );
  assert.equal(
    envelope.actions.some(
      (action: { kind: string; body?: string }) =>
        action.kind === "overlay_panel" && /scene\.morning_coffee/.test(action.body ?? ""),
    ),
    true,
  );

  const events = ledger.listEvents();
  assert.equal(events.some((event) => event.eventType === "vision.observe"), true);
});

test("POST /v1/outbound/evaluate returns an allow decision for user self reminders", async () => {
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/outbound/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: {
        messageKind: "reminder",
        recipientScope: "self",
        riskTier: "low",
        channel: "email",
        firstContact: false,
        contentTags: [],
      },
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "allow");
  assert.equal(body.decision.matchedRule, "user_self_reminder");
});

test("POST /v1/outbound/evaluate returns a block decision for public posts", async () => {
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/outbound/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: {
        messageKind: "summary",
        recipientScope: "public",
        riskTier: "low",
        channel: "public_post",
        firstContact: false,
        contentTags: [],
      },
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decision.action, "block");
  assert.equal(body.decision.matchedRule, "block_public_posting");
});

test("POST /v1/confirm returns a side-effect envelope after Start", async () => {
  let dispatchCount = 0;
  const ledger = createLedger();
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => {
      dispatchCount += 1;
      return { ok: true };
    },
    memoryLedger: ledger,
  });
  await server.listen(0);
  closers.push(() => server.close());

  await fetch(`${server.baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildObservation() }),
  });

  const response = await fetch(`${server.baseUrl}/v1/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: "sess-rokid-001",
      panelId: "panel-1",
      buttonId: "start_scene",
      observationId: "obs-0001",
    }),
  });

  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.safetyTier, "side_effect");
  assert.equal(dispatchCount, 1);
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "home_assistant_service"),
    true,
  );

  const events = ledger.listEvents();
  assert.equal(events.some((event) => event.eventType === "device.action_confirmed"), true);
});

test("POST /v1/confirm is idempotent for the same pending action", async () => {
  let dispatchCount = 0;
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => {
      dispatchCount += 1;
      return { ok: true };
    },
  });
  await server.listen(0);
  closers.push(() => server.close());

  await fetch(`${server.baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildObservation() }),
  });

  const confirmPayload = {
    sessionId: "sess-rokid-001",
    panelId: "panel-1",
    buttonId: "start_scene",
    observationId: "obs-0001",
  };

  const first = await fetch(`${server.baseUrl}/v1/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(confirmPayload),
  });
  const second = await fetch(`${server.baseUrl}/v1/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(confirmPayload),
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(dispatchCount, 1);

  const firstEnvelope = await first.json();
  const secondEnvelope = await second.json();
  assert.deepEqual(secondEnvelope, firstEnvelope);
});

test("POST /v1/ambient/observe returns a noop envelope for low-change ambient events", async () => {
  const ledger = createLedger();
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/ambient/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observation: buildAmbientObservation({
        event: {
          changeScore: 0.05,
          personPresent: false,
          personCount: 0,
          activityState: "idle",
          reasons: ["heartbeat"],
        },
      }),
    }),
  });

  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.safetyTier, "inform");
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "noop"),
    true,
  );

  const events = ledger.listEvents();
  assert.equal(events.some((event) => event.eventType === "ambient.observe"), true);
});

test("POST /v1/ambient/observe returns an escalation-style envelope for high-change ambient events", async () => {
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/ambient/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildAmbientObservation() }),
  });

  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.safetyTier, "inform");
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "overlay_panel"),
    true,
  );
  assert.equal(
    envelope.actions.some((action: { kind: string }) => action.kind === "speech"),
    true,
  );
});

test("POST /v1/ambient/observe rejects invalid payloads", async () => {
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/ambient/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observation: {
        schemaVersion: "0.1.0",
        source: { deviceFamily: "rokid_glasses" },
      },
    }),
  });

  assert.equal(response.status, 400);
});

test("POST /v1/memory/events writes a normalized external event", async () => {
  const ledger = createLedger();
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "wearable.sleep_session",
        sourceType: "wearable",
        sourceEventId: "sleep-001",
        sessionId: "sleep-session-1",
        actorId: "wearable:mi-band-9-pro",
        occurredAt: "2026-03-15T01:00:00.000Z",
        modality: "sensor",
        scope: "personal",
        payload: {
          durationMinutes: 425,
          efficiency: 0.91,
        },
        dedupeKey: "wearable:sleep-001",
        privacyLevel: "private",
        salienceHint: 0.87,
        retentionClass: "candidate_long_term",
      },
    }),
  });

  assert.equal(response.status, 202);
  const events = ledger.listEvents();
  assert.equal(events.some((event) => event.eventType === "wearable.sleep_session"), true);
});

test("POST /v1/observe records the last user request timestamp", async () => {
  const ledger = createLedger() as SQLiteMemoryLedger & {
    getRuntimeState: () => Record<string, string | null>;
  };
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildObservation() }),
  });

  assert.equal(response.status, 200);
  const state = ledger.getRuntimeState();
  assert.equal(state.lastUserRequestAt, "2026-03-14T10:15:00.000Z");
});

test("POST /v1/memory/events records chat user messages as the latest user request", async () => {
  const ledger = createLedger() as SQLiteMemoryLedger & {
    getRuntimeState: () => Record<string, string | null>;
  };
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "chat.user_message",
        sourceType: "chat",
        sourceEventId: "chat-001",
        sessionId: "sess-chat-001",
        actorId: "user:thomas",
        targetId: "agent:mira",
        occurredAt: "2026-03-15T10:00:00.000Z",
        modality: "text",
        scope: "direct",
        payload: {
          text: "记住：晚上提醒尽量轻一点。",
        },
        dedupeKey: "chat:chat-001",
        privacyLevel: "private",
        salienceHint: 0.95,
        retentionClass: "candidate_long_term",
      },
    }),
  });

  assert.equal(response.status, 202);
  const state = ledger.getRuntimeState();
  assert.equal(state.lastUserRequestAt, "2026-03-15T10:00:00.000Z");
});

test("POST /v1/memory/sleep consolidates events into daily and long-term memory", async () => {
  const ledger = createLedger();
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-sleep-"));
  tempDirs.push(dir);

  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
    memoryWorkspaceDir: dir,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const ingest = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "chat.user_message",
        sourceType: "chat",
        sourceEventId: "msg-memory-2",
        sessionId: "sleep-main",
        actorId: "user:thomas",
        targetId: "agent:mira",
        occurredAt: "2026-03-15T12:00:00.000Z",
        modality: "text",
        scope: "direct",
        payload: {
          text: "记住：我不喜欢晚上被突然提醒。",
        },
        dedupeKey: "chat:msg-memory-2",
        privacyLevel: "private",
        salienceHint: 0.9,
        retentionClass: "candidate_long_term",
      },
    }),
  });
  assert.equal(ingest.status, 202);

  const response = await fetch(`${server.baseUrl}/v1/memory/sleep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: "2026-03-15",
      now: "2026-03-18T00:00:00.000Z",
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.promotedFactCount, 1);
});

test("POST /v1/memory/auto-sleep runs after two idle hours and records completion state", async () => {
  const ledger = createLedger() as SQLiteMemoryLedger & {
    getRuntimeState: () => Record<string, string | null>;
  };
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-auto-sleep-"));
  tempDirs.push(dir);

  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
    memoryWorkspaceDir: dir,
  });
  await server.listen(0);
  closers.push(() => server.close());

  let response = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "chat.user_message",
        sourceType: "chat",
        sourceEventId: "chat-auto-sleep-1",
        sessionId: "sess-auto-sleep",
        actorId: "user:thomas",
        targetId: "agent:mira",
        occurredAt: "2026-03-15T10:00:00.000Z",
        modality: "text",
        scope: "direct",
        payload: {
          text: "记住：晚上不要突然打扰我。",
        },
        dedupeKey: "chat:auto-sleep-1",
        privacyLevel: "private",
        salienceHint: 0.93,
        retentionClass: "candidate_long_term",
      },
    }),
  });
  assert.equal(response.status, 202);

  response = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "ambient.observe",
        sourceType: "ambient",
        sourceEventId: "ambient-auto-sleep-1",
        sessionId: "sess-auto-sleep-ambient",
        actorId: "sensor:mac-webcam",
        occurredAt: "2026-03-15T10:05:00.000Z",
        modality: "image",
        scope: "ambient",
        payload: {
          activityState: "idle",
          changeScore: 0.02,
          personPresent: false,
        },
        dedupeKey: "ambient:auto-sleep-1",
        privacyLevel: "sensitive",
        salienceHint: 0.03,
        retentionClass: "episodic",
      },
    }),
  });
  assert.equal(response.status, 202);

  response = await fetch(`${server.baseUrl}/v1/memory/auto-sleep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      now: "2026-03-15T12:01:00.000Z",
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "slept");
  assert.equal(body.runCount, 1);

  const state = ledger.getRuntimeState();
  assert.equal(state.lastSleepCompletedAt, "2026-03-15T12:01:00.000Z");
  assert.equal(state.lastSleepTriggeredForRequestAt, "2026-03-15T10:00:00.000Z");
});

test("POST /v1/memory/auto-sleep does not stay blocked after a pending action is confirmed", async () => {
  const ledger = createLedger();
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-auto-sleep-confirmed-"));
  tempDirs.push(dir);

  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
    memoryWorkspaceDir: dir,
  });
  await server.listen(0);
  closers.push(() => server.close());

  let response = await fetch(`${server.baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation: buildObservation() }),
  });
  assert.equal(response.status, 200);

  response = await fetch(`${server.baseUrl}/v1/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: "sess-rokid-001",
      panelId: "panel-1",
      buttonId: "start_scene",
      observationId: "obs-0001",
    }),
  });
  assert.equal(response.status, 200);

  response = await fetch(`${server.baseUrl}/v1/memory/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: {
        eventType: "chat.user_message",
        sourceType: "chat",
        sourceEventId: "chat-after-confirm-1",
        sessionId: "sess-after-confirm",
        actorId: "user:thomas",
        targetId: "agent:mira",
        occurredAt: "2026-03-15T10:00:00.000Z",
        modality: "text",
        scope: "direct",
        payload: {
          text: "记住：确认后的对话也应该能睡眠整理。",
        },
        dedupeKey: "chat:after-confirm-1",
        privacyLevel: "private",
        salienceHint: 0.92,
        retentionClass: "candidate_long_term",
      },
    }),
  });
  assert.equal(response.status, 202);

  response = await fetch(`${server.baseUrl}/v1/memory/auto-sleep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      now: "2026-03-15T12:01:00.000Z",
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "slept");
});

test("POST /v1/memory/context returns a prompt-ready memory snippet", async () => {
  const ledger = createLedger();
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-context-"));
  tempDirs.push(dir);

  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
    memoryLedger: ledger,
    memoryWorkspaceDir: dir,
  });
  await server.listen(0);
  closers.push(() => server.close());

  const ingest = async (event: Record<string, unknown>) =>
    fetch(`${server.baseUrl}/v1/memory/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event }),
    });

  let response = await ingest({
    eventType: "chat.user_message",
    sourceType: "chat",
    sourceEventId: "msg-context-1",
    sessionId: "sess-context",
    actorId: "user:thomas",
    targetId: "agent:mira",
    occurredAt: "2026-03-15T12:00:00.000Z",
    modality: "text",
    scope: "direct",
    payload: {
      text: "记住：我喜欢回家后先安静一下。",
    },
    dedupeKey: "chat:msg-context-1",
    privacyLevel: "private",
    salienceHint: 0.94,
    retentionClass: "candidate_long_term",
  });
  assert.equal(response.status, 202);

  response = await fetch(`${server.baseUrl}/v1/memory/sleep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: "2026-03-15",
      now: "2026-03-18T00:00:00.000Z",
    }),
  });
  assert.equal(response.status, 200);

  response = await fetch(`${server.baseUrl}/v1/memory/context`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience: "direct",
      sessionId: "sess-context",
      queryText: "回家",
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.match(body.prompt, /我喜欢回家后先安静一下/);
});

test("createBridgeServer auto-configures runtime memory storage from environment defaults", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mira-bridge-runtime-memory-"));
  tempDirs.push(dir);
  const sqlitePath = join(dir, "memory", "mira-memory.sqlite");
  const workspaceDir = join(dir, "workspace");
  const previousSqlitePath = process.env.MIRA_MEMORY_SQLITE_PATH;
  const previousWorkspaceDir = process.env.MIRA_MEMORY_WORKSPACE_DIR;

  process.env.MIRA_MEMORY_SQLITE_PATH = sqlitePath;
  process.env.MIRA_MEMORY_WORKSPACE_DIR = workspaceDir;

  try {
    const server = createBridgeServer({
      dispatchHomeAssistantAction: async () => ({ ok: true }),
    });
    await server.listen(0);
    closers.push(() => server.close());

    let response = await fetch(`${server.baseUrl}/v1/memory/context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience: "direct",
        sessionId: "sess-auto-runtime",
        queryText: "提醒",
      }),
    });

    assert.equal(response.status, 200);
    let body = await response.json();
    assert.equal(body.ok, true);
    assert.match(body.prompt, /Working Memory/);

    response = await fetch(`${server.baseUrl}/v1/memory/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: {
          eventType: "chat.user_message",
          sourceType: "chat",
          sourceEventId: "msg-runtime-1",
          sessionId: "sess-auto-runtime",
          actorId: "user:thomas",
          targetId: "agent:mira",
          occurredAt: "2026-03-15T13:00:00.000Z",
          modality: "text",
          scope: "direct",
          payload: {
            text: "记住：晚上提醒要更轻一点。",
          },
          dedupeKey: "chat:msg-runtime-1",
          privacyLevel: "private",
          salienceHint: 0.8,
          retentionClass: "episodic",
        },
      }),
    });

    assert.equal(response.status, 202);
    assert.equal(existsSync(sqlitePath), true);

    response = await fetch(`${server.baseUrl}/v1/memory/context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience: "direct",
        sessionId: "sess-auto-runtime",
        queryText: "提醒",
      }),
    });

    assert.equal(response.status, 200);
    body = await response.json();
    assert.equal(body.ok, true);
    assert.match(body.prompt, /晚上提醒要更轻一点/);
  } finally {
    if (previousSqlitePath === undefined) {
      delete process.env.MIRA_MEMORY_SQLITE_PATH;
    } else {
      process.env.MIRA_MEMORY_SQLITE_PATH = previousSqlitePath;
    }

    if (previousWorkspaceDir === undefined) {
      delete process.env.MIRA_MEMORY_WORKSPACE_DIR;
    } else {
      process.env.MIRA_MEMORY_WORKSPACE_DIR = previousWorkspaceDir;
    }
  }
});
