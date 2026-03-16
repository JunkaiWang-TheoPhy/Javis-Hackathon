import { MemoryContextRetriever } from "../memory/memoryContextRetriever.ts";

type MemoryContextBody = {
  audience?: "direct" | "shared";
  sessionId?: string;
  queryText?: string;
  workingLimit?: number;
  factLimit?: number;
};

export async function handleMemoryContextRequest(
  body: unknown,
  retriever: MemoryContextRetriever,
) {
  const input = (body ?? {}) as MemoryContextBody;

  if (input.audience !== "direct" && input.audience !== "shared") {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Invalid memory context payload.",
      },
    };
  }

  const context = retriever.retrieve({
    audience: input.audience,
    ...(typeof input.sessionId === "string" ? { sessionId: input.sessionId } : {}),
    ...(typeof input.queryText === "string" ? { queryText: input.queryText } : {}),
    ...(typeof input.workingLimit === "number" ? { workingLimit: input.workingLimit } : {}),
    ...(typeof input.factLimit === "number" ? { factLimit: input.factLimit } : {}),
  });

  return {
    status: 200,
    body: {
      ok: true,
      ...context,
    },
  };
}
