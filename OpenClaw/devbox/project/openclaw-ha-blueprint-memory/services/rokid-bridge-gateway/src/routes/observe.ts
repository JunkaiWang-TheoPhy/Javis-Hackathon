import { Value } from "@sinclair/typebox/value";

import {
  VisualObservationEventSchema,
  type VisualObservationEvent,
} from "../../../../packages/contracts/src/index.ts";
import { DeterministicOpenClawClient } from "../orchestration/openclawClient.ts";
import { buildNoopEnvelope } from "../orchestration/actionNormalizer.ts";
import { buildVisionObserveEvent } from "../memory/eventFactory.ts";
import type { MemoryLedger } from "../memory/memoryLedger.ts";
import type { TransientMemoryStore } from "../store/transientMemory.ts";

export async function handleObserveRequest(
  body: unknown,
  store: TransientMemoryStore,
  ledger?: MemoryLedger,
  client = new DeterministicOpenClawClient(),
) {
  const observation = (body as { observation?: VisualObservationEvent })?.observation;

  if (!observation || !Value.Check(VisualObservationEventSchema, observation)) {
    return {
      status: 400,
      body: buildNoopEnvelope("unknown", "invalid-observation", "Invalid observation payload."),
    };
  }

  ledger?.record(buildVisionObserveEvent(observation));

  const result = client.buildObservationResponse(observation);
  if (result.pendingAction) {
    store.savePending(result.pendingAction);
  }

  return {
    status: 200,
    body: result.envelope,
  };
}
