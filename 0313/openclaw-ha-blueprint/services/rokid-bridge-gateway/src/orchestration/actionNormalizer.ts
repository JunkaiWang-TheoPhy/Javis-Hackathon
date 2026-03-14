import type {
  ActionEnvelope,
  AmbientVisionEvent,
  HomeAssistantServiceAction,
  VisualObservationEvent,
} from "../../../../packages/contracts/src/index.ts";

export function buildCoffeeConfirmEnvelope(
  observation: VisualObservationEvent,
  ocrText: string,
): ActionEnvelope {
  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${observation.observationId}-confirm`,
    sessionId: observation.sessionId,
    correlationId: observation.observationId,
    createdAt: new Date().toISOString(),
    safetyTier: "confirm",
    actions: [
      {
        kind: "highlight_target",
        targetDetectionId: observation.selectedDetectionId ?? observation.detections[0]?.id ?? "unknown",
        style: "pulse",
      },
      {
        kind: "overlay_panel",
        panelId: "panel-1",
        title: "Coffee machine",
        body: `It looks ready. OCR reads '${ocrText}'. Start the morning coffee scene?`,
        anchorDetectionId: observation.selectedDetectionId,
        buttons: [
          { id: "start_scene", label: "Start", role: "primary" },
          { id: "show_steps", label: "Steps", role: "secondary" },
          { id: "dismiss", label: "Dismiss", role: "dismiss" },
        ],
      },
      {
        kind: "speech",
        text: "I found a coffee machine. It appears ready. Do you want me to start it?",
        interrupt: false,
      },
    ],
  };
}

export function buildConfirmedServiceEnvelope(
  observation: VisualObservationEvent,
  serviceAction: HomeAssistantServiceAction,
): ActionEnvelope {
  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${observation.observationId}-side-effect`,
    sessionId: observation.sessionId,
    correlationId: observation.observationId,
    createdAt: new Date().toISOString(),
    safetyTier: "side_effect",
    actions: [
      serviceAction,
      {
        kind: "speech",
        text: "Starting the coffee machine scene now.",
        interrupt: true,
      },
    ],
  };
}

export function buildNoopEnvelope(
  sessionId: string,
  correlationId: string,
  reason: string,
): ActionEnvelope {
  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${correlationId}-noop`,
    sessionId,
    correlationId,
    createdAt: new Date().toISOString(),
    safetyTier: "inform",
    actions: [
      {
        kind: "noop",
        reason,
      },
    ],
  };
}

export function buildAmbientEscalationEnvelope(
  observation: AmbientVisionEvent,
  escalation: "snap" | "clip",
): ActionEnvelope {
  const title =
    escalation === "clip" ? "Ambient activity detected" : "Ambient scene change detected";
  const body =
    escalation === "clip"
      ? "Meaningful motion was detected. Capture a short camera clip if more context is needed."
      : "A meaningful visual change was detected. Capture a fresh snapshot if more context is needed.";
  const speech =
    escalation === "clip"
      ? "I detected sustained activity on the Mac webcam. A short clip may help."
      : "I detected a meaningful change on the Mac webcam. A fresh snapshot may help.";

  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${observation.observationId}-ambient-${escalation}`,
    sessionId: observation.sessionId,
    correlationId: observation.observationId,
    createdAt: new Date().toISOString(),
    safetyTier: "inform",
    actions: [
      {
        kind: "overlay_panel",
        panelId: "ambient-panel-1",
        title,
        body,
      },
      {
        kind: "speech",
        text: speech,
        interrupt: false,
      },
    ],
  };
}
