import type {
  HomeAssistantServiceAction,
  VisualObservationEvent,
} from "../../../../packages/contracts/src/index.ts";
import { buildObservationPrompt } from "./promptBuilder.ts";
import {
  buildCoffeeConfirmEnvelope,
  buildConfirmedServiceEnvelope,
  buildNoopEnvelope,
} from "./actionNormalizer.ts";

export type ConfirmRequest = {
  sessionId: string;
  observationId: string;
  panelId: string;
  buttonId: string;
};

export class DeterministicOpenClawClient {
  buildObservationResponse(observation: VisualObservationEvent) {
    const { summary } = buildObservationPrompt(observation);
    const ocrText = summary.ocr.join(" ").toLowerCase();
    const selectedLabel = summary.selectedLabel ?? "";

    if (
      selectedLabel === "coffee_machine" &&
      /(ready|latte|espresso|brew)/.test(ocrText)
    ) {
      return {
        envelope: buildCoffeeConfirmEnvelope(
          observation,
          summary.ocr[0] ?? "Ready",
        ),
        pendingAction: {
          sessionId: observation.sessionId,
          observationId: observation.observationId,
          panelId: "panel-1",
          buttonId: "start_scene",
          service: {
            domain: "scene",
            service: "turn_on",
            entityId: process.env.ROKID_COFFEE_SCENE_ENTITY_ID ?? "scene.morning_coffee",
            data: {},
          },
          observation,
        },
      };
    }

    return {
      envelope: buildNoopEnvelope(
        observation.sessionId,
        observation.observationId,
        "No actionable coffee-machine context was detected.",
      ),
    };
  }

  buildConfirmResponse(
    observation: VisualObservationEvent,
    request: ConfirmRequest,
    service: {
      domain: string;
      service: string;
      entityId?: string;
      data?: Record<string, unknown>;
    },
  ) {
    if (request.buttonId !== "start_scene") {
      return buildNoopEnvelope(
        observation.sessionId,
        observation.observationId,
        `No side effect is defined for button '${request.buttonId}'.`,
      );
    }

    const serviceAction: HomeAssistantServiceAction = {
      kind: "home_assistant_service",
      confirmRequired: false,
      service,
    };

    return buildConfirmedServiceEnvelope(observation, serviceAction);
  }
}
