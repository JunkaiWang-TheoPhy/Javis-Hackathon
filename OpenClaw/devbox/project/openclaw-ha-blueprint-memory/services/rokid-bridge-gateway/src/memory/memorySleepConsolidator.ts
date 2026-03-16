import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { MemoryLongTermFact, MemoryLifecycleUpdate } from "./memoryFact.ts";
import type { MemoryLedger } from "./memoryLedger.ts";
import type { MemoryEventRecord } from "./memoryEvent.ts";

type MemorySleepConsolidatorOptions = {
  ledger: MemoryLedger;
  workspaceDir: string;
};

type RunOptions = {
  date: string;
  now?: string;
};

export type RunResult = {
  batchId: string;
  consolidatedCount: number;
  forgottenCount: number;
  promotedFactCount: number;
  dailyNotePath: string;
  memoryFilePath: string;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function ageDays(occurredAt: string, now: string) {
  const ms = new Date(now).getTime() - new Date(occurredAt).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function extractText(event: MemoryEventRecord) {
  const text = event.payload.text;
  return typeof text === "string" ? text.trim() : null;
}

function extractAmbientActivityState(event: MemoryEventRecord) {
  return typeof event.payload.activityState === "string" ? event.payload.activityState : null;
}

function extractAmbientChangeScore(event: MemoryEventRecord) {
  return typeof event.payload.changeScore === "number" ? event.payload.changeScore : null;
}

function normalizeFactContent(text: string) {
  const cleaned = text
    .replace(/^(请)?记住[:：\s]*/u, "")
    .trim();

  if (/[。！？.!?]$/u.test(cleaned)) {
    return cleaned;
  }

  return `${cleaned}。`;
}

function factKeyFromContent(content: string) {
  return `fact:${content.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "")}`;
}

function computeImportance(event: MemoryEventRecord) {
  let score = event.salienceHint;
  const text = extractText(event);

  if (event.retentionClass === "candidate_long_term") {
    score += 0.25;
  }
  if (event.eventType === "chat.user_message") {
    score += 0.1;
  }
  if (event.eventType === "ambient.observe") {
    score -= 0.35;
  }
  if (event.scope === "ambient") {
    score -= 0.1;
  }
  if (text && /(记住|remember|喜欢|不喜欢|不想|不要|偏好)/iu.test(text)) {
    score += 0.35;
  }

  return clamp(score);
}

function shouldForgetEvent(event: MemoryEventRecord, importanceScore: number, now: string) {
  if (event.eventType !== "ambient.observe") {
    return false;
  }

  const activityState = extractAmbientActivityState(event);
  const changeScore = extractAmbientChangeScore(event);
  const sameDayIdleNoise =
    activityState === "idle" &&
    changeScore !== null &&
    changeScore <= 0.08 &&
    importanceScore < 0.2;

  if (sameDayIdleNoise) {
    return true;
  }

  return importanceScore < 0.3 && ageDays(event.occurredAt, now) >= 2;
}

function summarizeEvent(event: MemoryEventRecord) {
  const text = extractText(event);
  if (text) {
    return text;
  }

  if (event.eventType === "ambient.observe") {
    const activityState =
      typeof event.payload.activityState === "string" ? event.payload.activityState : "unknown";
    const changeScore =
      typeof event.payload.changeScore === "number" ? event.payload.changeScore : null;
    return `ambient change ${activityState}${changeScore === null ? "" : ` (${changeScore.toFixed(2)})`}`;
  }

  return `${event.eventType} (${event.dedupeKey})`;
}

function buildFact(event: MemoryEventRecord, importanceScore: number, now: string): MemoryLongTermFact | null {
  const text = extractText(event);
  if (!text) {
    return null;
  }

  if (
    importanceScore < 0.7 ||
    !(
      event.retentionClass === "candidate_long_term" ||
      /(记住|remember|喜欢|不喜欢|不想|不要|偏好)/iu.test(text)
    )
  ) {
    return null;
  }

  const content = normalizeFactContent(text);
  return {
    factKey: factKeyFromContent(content),
    content,
    score: importanceScore,
    privacyLevel: event.privacyLevel,
    ...(event.eventId ? { sourceEventId: event.eventId } : {}),
    updatedAt: now,
  };
}

export class MemorySleepConsolidator {
  constructor(private readonly options: MemorySleepConsolidatorOptions) {}

  run(input: RunOptions): RunResult {
    const now = input.now ?? new Date().toISOString();
    const batchId = randomUUID();
    const events = this.options.ledger.listEventsForDate(input.date);

    const updates: MemoryLifecycleUpdate[] = [];
    const facts: MemoryLongTermFact[] = [];
    const kept: Array<{ event: MemoryEventRecord; importanceScore: number }> = [];
    const forgotten: Array<{ event: MemoryEventRecord; importanceScore: number }> = [];

    for (const event of events) {
      const importanceScore = computeImportance(event);
      const shouldForget = shouldForgetEvent(event, importanceScore, now);

      updates.push({
        eventId: event.eventId,
        importanceScore,
        consolidatedAt: now,
        consolidationBatchId: batchId,
        ...(shouldForget ? { forgottenAt: now } : {}),
      });

      const fact = buildFact(event, importanceScore, now);
      if (fact) {
        facts.push(fact);
      }

      if (shouldForget) {
        forgotten.push({ event, importanceScore });
      } else {
        kept.push({ event, importanceScore });
      }
    }

    this.options.ledger.applySleepUpdates(updates, facts);

    const dailyNotePath = this.writeDailyNote(input.date, kept, forgotten, facts);
    const memoryFilePath = this.writeMemoryFile(this.options.ledger.listLongTermFacts());

    return {
      batchId,
      consolidatedCount: events.length,
      forgottenCount: forgotten.length,
      promotedFactCount: facts.length,
      dailyNotePath,
      memoryFilePath,
    };
  }

  private writeDailyNote(
    date: string,
    kept: Array<{ event: MemoryEventRecord; importanceScore: number }>,
    forgotten: Array<{ event: MemoryEventRecord; importanceScore: number }>,
    facts: MemoryLongTermFact[],
  ) {
    const dir = join(this.options.workspaceDir, "memory");
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${date}.md`);

    const lines = [
      `# ${date}`,
      "",
      "## Summary",
      `- Consolidated ${kept.length + forgotten.length} events`,
      `- Forgot ${forgotten.length} low-value events`,
      `- Promoted ${facts.length} long-term facts`,
      "",
      "## Kept Memories",
      ...(kept.length === 0
        ? ["- None"]
        : kept.map(({ event, importanceScore }) => `- (${importanceScore.toFixed(2)}) ${summarizeEvent(event)}`)),
      "",
      "## Forgotten Noise",
      ...(forgotten.length === 0
        ? ["- None"]
        : forgotten.map(({ event, importanceScore }) => `- (${importanceScore.toFixed(2)}) ${summarizeEvent(event)}`)),
      "",
      "## Promoted Long-Term Facts",
      ...(facts.length === 0 ? ["- None"] : facts.map((fact) => `- ${fact.content}`)),
      "",
    ];

    writeFileSync(path, lines.join("\n"), "utf8");
    return path;
  }

  private writeMemoryFile(facts: MemoryLongTermFact[]) {
    const path = join(this.options.workspaceDir, "MEMORY.md");
    mkdirSync(this.options.workspaceDir, { recursive: true });

    const lines = [
      "# Mira Long-Term Memory",
      "",
      "## Stable Facts",
      ...(facts.length === 0
        ? ["- None yet"]
        : facts.map((fact) => `- ${fact.content} (updated ${fact.updatedAt.slice(0, 10)})`)),
      "",
    ];

    writeFileSync(path, lines.join("\n"), "utf8");
    return path;
  }
}
