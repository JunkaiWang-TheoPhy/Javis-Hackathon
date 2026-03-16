import type { AmbientVisionEvent, VisualObservationEvent } from "../../../../packages/contracts/src/index.ts";
import type { MemoryEventInput } from "./memoryEvent.ts";

function retainFramePrivacyLevel(retainFrame: boolean) {
  return retainFrame ? "sensitive" : "private";
}

export function buildVisionObserveEvent(observation: VisualObservationEvent): MemoryEventInput {
  return {
    eventType: "vision.observe",
    sourceType: "vision",
    sourceEventId: observation.observationId,
    sessionId: observation.sessionId,
    actorId: `device:${observation.source.deviceFamily}`,
    ...(observation.selectedDetectionId ? { targetId: observation.selectedDetectionId } : {}),
    occurredAt: observation.observedAt,
    modality: "image",
    scope: "direct",
    payload: {
      summary: observation.summary ?? null,
      selectedDetectionId: observation.selectedDetectionId ?? null,
      selectedLabel:
        observation.detections.find((item) => item.id === observation.selectedDetectionId)?.label ??
        null,
      userEvent: observation.userEvent ?? null,
      ocr: observation.ocr.map((item) => item.text),
    },
    dedupeKey: `vision.observe:${observation.sessionId}:${observation.observationId}`,
    privacyLevel: retainFramePrivacyLevel(observation.privacy.retainFrame),
    salienceHint: observation.selectedDetectionId ? 0.82 : 0.58,
    retentionClass: "episodic",
  };
}

export function buildAmbientObserveEvent(observation: AmbientVisionEvent): MemoryEventInput {
  return {
    eventType: "ambient.observe",
    sourceType: "ambient",
    sourceEventId: observation.observationId,
    sessionId: observation.sessionId,
    actorId: `device:${observation.source.deviceFamily}`,
    occurredAt: observation.observedAt,
    modality: "image",
    scope: "ambient",
    payload: {
      activityState: observation.event.activityState,
      changeScore: observation.event.changeScore,
      personPresent: observation.event.personPresent,
      personCount: observation.event.personCount,
      reasons: observation.event.reasons,
    },
    dedupeKey: `ambient.observe:${observation.sessionId}:${observation.observationId}`,
    privacyLevel: retainFramePrivacyLevel(observation.privacy.retainFrame),
    salienceHint: observation.event.changeScore,
    retentionClass: "episodic",
  };
}

export function buildConfirmEvent(args: {
  sessionId: string;
  observationId: string;
  panelId: string;
  buttonId: string;
  service: {
    domain: string;
    service: string;
    entityId?: string;
    data?: Record<string, unknown>;
  };
  occurredAt?: string;
}): MemoryEventInput {
  return {
    eventType: "device.action_confirmed",
    sourceType: "bridge",
    sourceEventId: `${args.observationId}:${args.panelId}:${args.buttonId}`,
    sessionId: args.sessionId,
    actorId: "agent:mira",
    ...(args.service.entityId ? { targetId: args.service.entityId } : {}),
    occurredAt: args.occurredAt ?? new Date().toISOString(),
    modality: "action",
    scope: "direct",
    payload: {
      observationId: args.observationId,
      panelId: args.panelId,
      buttonId: args.buttonId,
      service: args.service,
    },
    dedupeKey: `device.action_confirmed:${args.sessionId}:${args.observationId}:${args.panelId}:${args.buttonId}`,
    privacyLevel: "private",
    salienceHint: 0.88,
    retentionClass: "episodic",
  };
}
