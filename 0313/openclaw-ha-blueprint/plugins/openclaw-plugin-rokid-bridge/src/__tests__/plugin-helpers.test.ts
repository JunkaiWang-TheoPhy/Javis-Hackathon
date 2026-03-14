import assert from "node:assert/strict";
import test from "node:test";

import {
  buildObservationSummary,
  normalizeDispatchPayload,
} from "../index.ts";

test("buildObservationSummary picks the selected detection and sorts top detections", () => {
  const summary = buildObservationSummary({
    schemaVersion: "0.1.0",
    sessionId: "sess-1",
    observationId: "obs-1",
    observedAt: "2026-03-14T09:00:00.000Z",
    source: {
      deviceFamily: "rokid_glasses",
      appId: "demo.app",
      appVersion: "0.1.0",
    },
    capture: {
      mode: "snapshot",
    },
    detections: [
      {
        id: "det-low",
        label: "lamp",
        score: 0.3,
        bbox: { x: 1, y: 1, w: 10, h: 10 },
      },
      {
        id: "det-hi",
        label: "coffee_machine",
        score: 0.94,
        bbox: { x: 2, y: 2, w: 10, h: 10 },
      },
    ],
    ocr: [
      {
        text: "Latte Ready",
        score: 0.99,
        bbox: { x: 2, y: 2, w: 10, h: 10 },
      },
    ],
    selectedDetectionId: "det-hi",
    userEvent: {
      type: "voice_query",
      text: "What is this and can you start it?",
    },
    privacy: {
      redactFaces: true,
      retainFrame: false,
    },
  });

  assert.equal(summary.selectedLabel, "coffee_machine");
  assert.equal(summary.topDetections[0]?.id, "det-hi");
  assert.deepEqual(summary.ocr, ["Latte Ready"]);
});

test("normalizeDispatchPayload maps entityId into Home Assistant entity_id payload", () => {
  const normalized = normalizeDispatchPayload({
    domain: "scene",
    service: "turn_on",
    entityId: "scene.morning_coffee",
    data: {
      transition: 1,
    },
  });

  assert.deepEqual(normalized, {
    domain: "scene",
    service: "turn_on",
    payload: {
      entity_id: "scene.morning_coffee",
      transition: 1,
    },
  });
});

test("normalizeDispatchPayload rejects empty domain or service", () => {
  assert.throws(
    () =>
      normalizeDispatchPayload({
        domain: "",
        service: "turn_on",
      }),
    /domain and service are required/,
  );
});
