import assert from "node:assert/strict";
import test from "node:test";
import { Value } from "@sinclair/typebox/value";

import {
  ActionEnvelopeSchema,
  AmbientVisionEventSchema,
  VisualObservationEventSchema,
} from "../index.ts";

test("accepts a valid visual observation event", () => {
  const observation = {
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
      frameRef: "cache://frame-1.jpg",
      width: 1920,
      height: 1080,
    },
    detections: [
      {
        id: "det-1",
        label: "coffee_machine",
        score: 0.94,
        bbox: { x: 10, y: 20, w: 100, h: 140 },
      },
    ],
    ocr: [
      {
        text: "Latte Ready",
        score: 0.98,
        bbox: { x: 40, y: 50, w: 80, h: 24 },
      },
    ],
    selectedDetectionId: "det-1",
    userEvent: {
      type: "voice_query",
      text: "What is this?",
    },
    summary: "User selected a coffee machine.",
    privacy: {
      redactFaces: true,
      retainFrame: false,
    },
  };

  assert.equal(Value.Check(VisualObservationEventSchema, observation), true);
});

test("rejects an invalid visual observation event missing ids", () => {
  const observation = {
    schemaVersion: "0.1.0",
    observedAt: "2026-03-14T09:00:00.000Z",
  };

  assert.equal(Value.Check(VisualObservationEventSchema, observation), false);
});

test("accepts a valid ambient vision event", () => {
  const event = {
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
  };

  assert.equal(Value.Check(AmbientVisionEventSchema, event), true);
});

test("rejects an invalid ambient vision event with the wrong device family", () => {
  const event = {
    schemaVersion: "0.1.0",
    sessionId: "sess-mac-001",
    observationId: "amb-0001",
    observedAt: "2026-03-15T08:00:00.000Z",
    source: {
      deviceFamily: "rokid_glasses",
      deviceName: "Thomas的MacBook Air",
      appVersion: "0.1.0",
    },
    capture: {
      mode: "snapshot",
      frameRef: "cache://localmac/latest.jpg",
    },
    event: {
      changeScore: 0.32,
      personPresent: true,
      personCount: 1,
      activityState: "person_present",
      reasons: ["person_appeared"],
    },
    privacy: {
      retainFrame: false,
    },
  };

  assert.equal(Value.Check(AmbientVisionEventSchema, event), false);
});

test("accepts an action envelope with overlay and speech actions", () => {
  const envelope = {
    schemaVersion: "0.1.0",
    envelopeId: "env-1",
    sessionId: "sess-1",
    correlationId: "obs-1",
    createdAt: "2026-03-14T09:00:01.000Z",
    safetyTier: "confirm",
    actions: [
      {
        kind: "overlay_panel",
        panelId: "panel-1",
        title: "Coffee machine",
        body: "It looks ready.",
      },
      {
        kind: "speech",
        text: "I found a coffee machine.",
        interrupt: false,
      },
    ],
  };

  assert.equal(Value.Check(ActionEnvelopeSchema, envelope), true);
});

test("rejects an action envelope with an unknown action kind", () => {
  const envelope = {
    schemaVersion: "0.1.0",
    envelopeId: "env-2",
    sessionId: "sess-1",
    correlationId: "obs-1",
    createdAt: "2026-03-14T09:00:01.000Z",
    safetyTier: "inform",
    actions: [
      {
        kind: "launch_rocket",
      },
    ],
  };

  assert.equal(Value.Check(ActionEnvelopeSchema, envelope), false);
});
