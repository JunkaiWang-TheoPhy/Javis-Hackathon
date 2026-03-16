import { Value } from "@sinclair/typebox/value";

import type { MemoryLedger } from "../memory/memoryLedger.ts";
import { MemoryEventInputSchema, type MemoryEventInput } from "../memory/memoryEvent.ts";

export async function handleMemoryIngestRequest(body: unknown, ledger: MemoryLedger) {
  const event = (body as { event?: MemoryEventInput })?.event;

  if (!event || !Value.Check(MemoryEventInputSchema, event)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Invalid memory event payload.",
      },
    };
  }

  const record = ledger.record(event);
  return {
    status: 202,
    body: {
      ok: true,
      eventId: record.eventId,
      dedupeKey: record.dedupeKey,
    },
  };
}
