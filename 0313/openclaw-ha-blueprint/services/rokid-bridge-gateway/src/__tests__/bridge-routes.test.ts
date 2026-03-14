import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

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

test("POST /v1/observe returns a confirm-tier coffee machine envelope", async () => {
  const server = createBridgeServer({
    dispatchHomeAssistantAction: async () => ({ ok: true }),
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
});

test("POST /v1/confirm returns a side-effect envelope after Start", async () => {
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
