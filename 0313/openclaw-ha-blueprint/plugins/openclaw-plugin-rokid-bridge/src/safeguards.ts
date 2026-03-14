export type DispatchInput = {
  domain: string;
  service: string;
  entityId?: string;
  data?: Record<string, unknown>;
};

export type NormalizedDispatchPayload = {
  domain: string;
  service: string;
  payload: Record<string, unknown>;
};

export function normalizeDispatchPayload(
  input: DispatchInput,
): NormalizedDispatchPayload {
  if (!input.domain || !input.service) {
    throw new Error("domain and service are required");
  }

  return {
    domain: input.domain,
    service: input.service,
    payload: {
      ...(input.entityId ? { entity_id: input.entityId } : {}),
      ...(input.data ?? {}),
    },
  };
}
