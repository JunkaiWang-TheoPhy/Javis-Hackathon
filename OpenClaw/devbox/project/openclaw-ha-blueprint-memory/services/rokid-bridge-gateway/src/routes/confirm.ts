import { normalizeDispatchPayload } from "../../../../plugins/openclaw-plugin-rokid-bridge/src/index.ts";
import { DeterministicOpenClawClient } from "../orchestration/openclawClient.ts";
import { buildNoopEnvelope } from "../orchestration/actionNormalizer.ts";
import { buildConfirmEvent } from "../memory/eventFactory.ts";
import type { MemoryLedger } from "../memory/memoryLedger.ts";
import type { TransientMemoryStore } from "../store/transientMemory.ts";

type ConfirmBody = {
  sessionId?: string;
  panelId?: string;
  buttonId?: string;
  observationId?: string;
};

export async function handleConfirmRequest(
  body: unknown,
  store: TransientMemoryStore,
  ledger: MemoryLedger | undefined,
  dispatchHomeAssistantAction: (action: {
    domain: string;
    service: string;
    entityId?: string;
    data?: Record<string, unknown>;
  }) => Promise<unknown>,
  client = new DeterministicOpenClawClient(),
) {
  const request = (body ?? {}) as ConfirmBody;

  if (
    !request.sessionId ||
    !request.panelId ||
    !request.buttonId ||
    !request.observationId
  ) {
    return {
      status: 400,
      body: buildNoopEnvelope("unknown", "invalid-confirm", "Invalid confirm payload."),
    };
  }

  const cached = store.getConfirmed(
    request.sessionId,
    request.observationId,
    request.panelId,
    request.buttonId,
  );
  if (cached) {
    return {
      status: 200,
      body: cached,
    };
  }

  const pending = store.getPending(
    request.sessionId,
    request.observationId,
    request.panelId,
    request.buttonId,
  );
  if (!pending) {
    return {
      status: 404,
      body: buildNoopEnvelope(
        request.sessionId,
        request.observationId,
        "No pending action was found for this confirmation.",
      ),
    };
  }

  const normalized = normalizeDispatchPayload(pending.service);
  await dispatchHomeAssistantAction({
    domain: normalized.domain,
    service: normalized.service,
    entityId: pending.service.entityId,
    data: pending.service.data,
  });

  const envelope = client.buildConfirmResponse(pending.observation, {
    sessionId: request.sessionId,
    observationId: request.observationId,
    panelId: request.panelId,
    buttonId: request.buttonId,
  }, pending.service);

  store.saveConfirmed(
    request.sessionId,
    request.observationId,
    request.panelId,
    request.buttonId,
    envelope,
  );

  ledger?.record(buildConfirmEvent({
    sessionId: request.sessionId,
    observationId: request.observationId,
    panelId: request.panelId,
    buttonId: request.buttonId,
    service: pending.service,
  }));

  return {
    status: 200,
    body: envelope,
  };
}
