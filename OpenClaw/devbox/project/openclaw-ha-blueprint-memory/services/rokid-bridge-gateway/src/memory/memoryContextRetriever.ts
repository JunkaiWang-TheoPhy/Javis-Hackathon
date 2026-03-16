import type { MemoryLongTermFact } from "./memoryFact.ts";
import type { MemoryLedger } from "./memoryLedger.ts";
import type { MemoryEventRecord } from "./memoryEvent.ts";

type Audience = "direct" | "shared";

type RetrieveOptions = {
  audience: Audience;
  sessionId?: string;
  queryText?: string;
  workingLimit?: number;
  factLimit?: number;
};

type WorkingMemoryItem = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  summary: string;
};

type MemoryContext = {
  audience: Audience;
  workingMemory: WorkingMemoryItem[];
  longTermFacts: MemoryLongTermFact[];
  prompt: string;
};

type MemoryContextRetrieverOptions = {
  ledger: MemoryLedger;
};

function tokenize(value: string | undefined) {
  return (value ?? "")
    .toLowerCase()
    .split(/[\s,.;:!?，。；：！？]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function overlapScore(queryText: string | undefined, candidate: string) {
  const tokens = tokenize(queryText);
  if (tokens.length === 0) {
    return 0;
  }

  const haystack = candidate.toLowerCase();
  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 0.15 : score), 0);
}

function summarizeEvent(event: MemoryEventRecord) {
  const text = event.payload.text;
  if (typeof text === "string" && text.trim().length > 0) {
    return text.trim();
  }

  if (event.eventType === "device.action_confirmed") {
    const service = event.payload.service;
    if (service && typeof service === "object") {
      const domain = typeof service.domain === "string" ? service.domain : "unknown";
      const action = typeof service.service === "string" ? service.service : "unknown";
      return `confirmed ${domain}.${action}`;
    }
  }

  if (event.eventType === "vision.observe") {
    const selectedLabel = event.payload.selectedLabel;
    if (typeof selectedLabel === "string" && selectedLabel.length > 0) {
      return `observed ${selectedLabel}`;
    }
  }

  return event.eventType;
}

function isAllowedPrivacy(privacyLevel: string, audience: Audience) {
  if (audience === "direct") {
    return true;
  }

  return privacyLevel === "public";
}

export class MemoryContextRetriever {
  constructor(private readonly options: MemoryContextRetrieverOptions) {}

  retrieve(input: RetrieveOptions): MemoryContext {
    const workingLimit = input.workingLimit ?? 4;
    const factLimit = input.factLimit ?? 4;

    const workingMemory = this.options.ledger
      .listEvents()
      .filter((event) => !event.forgottenAt)
      .filter((event) => isAllowedPrivacy(event.privacyLevel, input.audience))
      .filter((event) => event.scope !== "ambient")
      .filter((event) => (input.sessionId ? event.sessionId === input.sessionId : true))
      .map((event) => ({
        event,
        score:
          (event.importanceScore ?? event.salienceHint) +
          overlapScore(input.queryText, summarizeEvent(event)),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return right.event.occurredAt.localeCompare(left.event.occurredAt);
      })
      .slice(0, workingLimit)
      .map(({ event }) => ({
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        summary: summarizeEvent(event),
      }));

    const longTermFacts = this.options.ledger
      .listLongTermFacts()
      .filter((fact) => isAllowedPrivacy(fact.privacyLevel, input.audience))
      .map((fact) => ({
        fact,
        score: fact.score + overlapScore(input.queryText, fact.content),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return right.fact.updatedAt.localeCompare(left.fact.updatedAt);
      })
      .slice(0, factLimit)
      .map(({ fact }) => fact);

    const prompt = [
      "## Working Memory",
      ...(workingMemory.length === 0 ? ["- None"] : workingMemory.map((item) => `- ${item.summary}`)),
      "",
      "## Long-Term Memory",
      ...(longTermFacts.length === 0 ? ["- None"] : longTermFacts.map((fact) => `- ${fact.content}`)),
    ].join("\n");

    return {
      audience: input.audience,
      workingMemory,
      longTermFacts,
      prompt,
    };
  }
}
