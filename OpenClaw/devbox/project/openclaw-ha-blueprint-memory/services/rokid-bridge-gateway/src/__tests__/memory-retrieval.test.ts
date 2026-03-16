import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";

import { MemoryContextRetriever } from "../memory/memoryContextRetriever.ts";
import { SQLiteMemoryLedger } from "../memory/sqliteMemoryLedger.ts";
import { MemorySleepConsolidator } from "../memory/memorySleepConsolidator.ts";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

function createFixture() {
  const dir = mkdtempSync(join(tmpdir(), "mira-memory-retrieval-"));
  tempDirs.push(dir);
  mkdirSync(join(dir, "workspace"), { recursive: true });
  return {
    dir,
    workspaceDir: join(dir, "workspace"),
    ledger: new SQLiteMemoryLedger(join(dir, "memory.sqlite")),
  };
}

function seedMemoryFixture() {
  const fixture = createFixture();

  fixture.ledger.record({
    eventType: "chat.user_message",
    sourceType: "chat",
    sourceEventId: "msg-pref-1",
    sessionId: "sess-main",
    actorId: "user:thomas",
    targetId: "agent:mira",
    occurredAt: "2026-03-15T10:00:00.000Z",
    modality: "text",
    scope: "direct",
    payload: {
      text: "记住：我不喜欢晚上被突然提醒。",
    },
    dedupeKey: "chat:msg-pref-1",
    privacyLevel: "private",
    salienceHint: 0.9,
    retentionClass: "candidate_long_term",
  });

  fixture.ledger.record({
    eventType: "chat.user_message",
    sourceType: "chat",
    sourceEventId: "msg-state-1",
    sessionId: "sess-main",
    actorId: "user:thomas",
    targetId: "agent:mira",
    occurredAt: "2026-03-15T10:30:00.000Z",
    modality: "text",
    scope: "direct",
    payload: {
      text: "我今天下班很累，想安静一点。",
    },
    dedupeKey: "chat:msg-state-1",
    privacyLevel: "private",
    salienceHint: 0.6,
    retentionClass: "episodic",
  });

  fixture.ledger.record({
    eventType: "ambient.observe",
    sourceType: "ambient",
    sourceEventId: "amb-low-2",
    sessionId: "ambient-session",
    actorId: "sensor:mac-webcam",
    occurredAt: "2026-03-15T11:00:00.000Z",
    modality: "image",
    scope: "ambient",
    payload: {
      activityState: "idle",
      changeScore: 0.02,
      personPresent: false,
    },
    dedupeKey: "ambient:amb-low-2",
    privacyLevel: "sensitive",
    salienceHint: 0.04,
    retentionClass: "episodic",
  });

  const consolidator = new MemorySleepConsolidator({
    ledger: fixture.ledger,
    workspaceDir: fixture.workspaceDir,
  });
  consolidator.run({
    date: "2026-03-15",
    now: "2026-03-18T00:00:00.000Z",
  });

  return fixture;
}

test("MemoryContextRetriever returns direct-session memory and promoted facts", () => {
  const fixture = seedMemoryFixture();
  const retriever = new MemoryContextRetriever({ ledger: fixture.ledger });

  const context = retriever.retrieve({
    audience: "direct",
    sessionId: "sess-main",
    queryText: "晚上提醒",
  });

  assert.equal(context.longTermFacts.length, 1);
  assert.match(context.longTermFacts[0]?.content ?? "", /不喜欢晚上被突然提醒/);
  assert.equal(
    context.workingMemory.some((item) => /下班很累/.test(item.summary)),
    true,
  );
  assert.equal(
    context.workingMemory.some((item) => item.eventType === "ambient.observe"),
    false,
  );
  assert.match(context.prompt, /Long-Term Memory/);
  assert.match(context.prompt, /不喜欢晚上被突然提醒/);
});

test("MemoryContextRetriever excludes private memory for shared audiences", () => {
  const fixture = seedMemoryFixture();
  const retriever = new MemoryContextRetriever({ ledger: fixture.ledger });

  const context = retriever.retrieve({
    audience: "shared",
    sessionId: "sess-main",
    queryText: "晚上提醒",
  });

  assert.equal(context.longTermFacts.length, 0);
  assert.equal(context.workingMemory.length, 0);
  assert.doesNotMatch(context.prompt, /不喜欢晚上被突然提醒/);
});
