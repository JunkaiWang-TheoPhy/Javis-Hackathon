import type { VisualObservationEvent } from "../../../../packages/contracts/src/index.ts";

export function buildCoffeeMachineObservation(): VisualObservationEvent {
  return {
    schemaVersion: "0.1.0",
    sessionId: "sess-rokid-001",
    observationId: "obs-0001",
    observedAt: new Date().toISOString(),
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

export async function postCoffeeMachineDemo(baseUrl = "http://127.0.0.1:3301") {
  const observation = buildCoffeeMachineObservation();

  const first = await fetch(`${baseUrl}/v1/observe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ observation }),
  });

  const explainEnvelope = await first.json();

  const second = await fetch(`${baseUrl}/v1/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: observation.sessionId,
      observationId: observation.observationId,
      panelId: "panel-1",
      buttonId: "start_scene",
    }),
  });

  const confirmedEnvelope = await second.json();
  return { explainEnvelope, confirmedEnvelope };
}
