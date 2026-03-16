import { MemorySleepConsolidator } from "../memory/memorySleepConsolidator.ts";

type MemorySleepBody = {
  date?: string;
  now?: string;
};

export async function handleMemorySleepRequest(
  body: unknown,
  consolidator: MemorySleepConsolidator,
) {
  const input = (body ?? {}) as MemorySleepBody;

  if (!input.date || typeof input.date !== "string") {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Invalid sleep consolidation payload.",
      },
    };
  }

  const result = consolidator.run({
    date: input.date,
    ...(typeof input.now === "string" ? { now: input.now } : {}),
  });

  return {
    status: 200,
    body: {
      ok: true,
      ...result,
    },
  };
}
