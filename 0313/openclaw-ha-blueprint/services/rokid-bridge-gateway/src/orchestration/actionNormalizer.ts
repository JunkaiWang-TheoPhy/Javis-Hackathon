import type {
  ActionEnvelope,
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
