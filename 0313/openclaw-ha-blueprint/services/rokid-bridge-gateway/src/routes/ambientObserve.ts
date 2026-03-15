import { Value } from "@sinclair/typebox/value";

import {
  AmbientVisionEventSchema,
  type AmbientVisionEvent,
} from "../../../../packages/contracts/src/index.ts";
import {
  buildAmbientEscalationEnvelope,
  buildNoopEnvelope,
} from "../orchestration/actionNormalizer.ts";

export async function handleAmbientObserveRequest(body: unknown) {
  const observation = (body as { observation?: AmbientVisionEvent })?.observation;

  if (!observation || !Value.Check(AmbientVisionEventSchema, observation)) {
    return {
      status: 400,
      body: buildNoopEnvelope("unknown", "invalid-ambient-observation", "Invalid ambient observation payload."),
    };
  }

  const { changeScore, activityState } = observation.event;

  if (changeScore < 0.18 && activityState === "idle") {
    return {
      status: 200,
      body: buildNoopEnvelope(
        observation.sessionId,
        observation.observationId,
        "Ambient change stayed below escalation threshold.",
      ),
    };
  }

  const escalation = activityState === "active_motion" || changeScore >= 0.45 ? "clip" : "snap";
  return {
    status: 200,
    body: buildAmbientEscalationEnvelope(observation, escalation),
  };
}
