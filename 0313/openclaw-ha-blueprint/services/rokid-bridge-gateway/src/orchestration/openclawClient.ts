import type {
  HomeAssistantServiceAction,
  VisualObservationEvent,
} from "../../../../packages/contracts/src/index.ts";
import {
  buildEcosystemRegistry,
  resolveIntentExecution,
  type HaControlConfig,
} from "../../../../plugins/openclaw-plugin-ha-control/src/ecosystem.ts";
import { buildObservationPrompt } from "./promptBuilder.ts";
import {
  buildCapabilityConfirmEnvelope,
  buildCapabilityConfirmedEnvelope,
  buildCoffeeConfirmEnvelope,
  buildNoopEnvelope,
  buildConfirmedServiceEnvelope,
} from "./actionNormalizer.ts";

export type ConfirmRequest = {
  sessionId: string;
  observationId: string;
  panelId: string;
  buttonId: string;
};

function normalizeLabel(value: string | undefined) {
  return (value ?? "").trim().toLowerCase().replaceAll("_", " ");
}

export class DeterministicOpenClawClient {
  constructor(private readonly haControlConfig?: HaControlConfig) {}

  private buildRegistryResponse(observation: VisualObservationEvent) {
    if (!this.haControlConfig?.ecosystems?.length) {
      return null;
    }

    const registry = buildEcosystemRegistry(this.haControlConfig);
    const selected = observation.detections.find(
      (item) => item.id === observation.selectedDetectionId,
    );
    const candidates = [selected?.label, observation.detections[0]?.label]
      .map((value) => normalizeLabel(value))
      .filter((value) => value.length > 0);

    const matchedDevice = registry.devices.find((device) =>
      device.aliases.some((alias) => candidates.includes(normalizeLabel(alias))),
    );

    if (!matchedDevice) {
      return null;
    }

    const preferredIntent = matchedDevice.capabilities.find((item) => item.intent === "activate")
      ?.intent ?? matchedDevice.capabilities[0]?.intent;

    if (!preferredIntent) {
      return null;
    }

    const resolved = resolveIntentExecution(registry, {
      deviceId: matchedDevice.deviceId,
      intent: preferredIntent,
      confirmed: true,
    });

    return {
      envelope: buildCapabilityConfirmEnvelope(observation, {
        label: matchedDevice.aliases[0] ?? matchedDevice.deviceId,
        deviceId: matchedDevice.deviceId,
        domain: resolved.serviceCall.domain,
        service: resolved.serviceCall.service,
        entityId:
          typeof resolved.serviceCall.data.entity_id === "string"
            ? resolved.serviceCall.data.entity_id
            : undefined,
      }),
      pendingAction: {
        sessionId: observation.sessionId,
        observationId: observation.observationId,
        panelId: "panel-1",
        buttonId: "start_scene",
        service: {
          domain: resolved.serviceCall.domain,
          service: resolved.serviceCall.service,
          entityId:
            typeof resolved.serviceCall.data.entity_id === "string"
              ? resolved.serviceCall.data.entity_id
              : undefined,
          data: Object.fromEntries(
            Object.entries(resolved.serviceCall.data).filter(([key]) => key !== "entity_id"),
          ),
        },
        observation,
      },
    };
  }

  buildObservationResponse(observation: VisualObservationEvent) {
    const registryResponse = this.buildRegistryResponse(observation);
    if (registryResponse) {
      return registryResponse;
    }

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

    if (this.haControlConfig?.ecosystems?.length) {
      return buildCapabilityConfirmedEnvelope(observation, serviceAction, {
        label: normalizeLabel(
          observation.detections.find((item) => item.id === observation.selectedDetectionId)?.label,
        ) || "device",
        domain: service.domain,
        service: service.service,
        entityId: service.entityId,
      });
    }

    return buildConfirmedServiceEnvelope(observation, serviceAction);
  }
}
