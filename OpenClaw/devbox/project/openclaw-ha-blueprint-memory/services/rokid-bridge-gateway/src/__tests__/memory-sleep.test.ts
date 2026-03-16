import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";

import { MemorySleepConsolidator } from "../memory/memorySleepConsolidator.ts";
import { SQLiteMemoryLedger } from "../memory/sqliteMemoryLedger.ts";

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
  const dir = mkdtempSync(join(tmpdir(), "mira-memory-sleep-"));
  tempDirs.push(dir);
  mkdirSync(join(dir, "workspace"), { recursive: true });
  return {
    dir,
    workspaceDir: join(dir, "workspace"),
    ledger: new SQLiteMemoryLedger(join(dir, "memory.sqlite")),
  };
}

test("MemorySleepConsolidator forgets low-value noise and promotes explicit long-term facts", () => {
  const fixture = createFixture();

  fixture.ledger.record({
    eventType: "chat.user_message",
    sourceType: "chat",
    sourceEventId: "msg-remember-1",
    sessionId: "sess-main",
    actorId: "user:thomas",
    targetId: "agent:mira",
    occurredAt: "2026-03-15T10:00:00.000Z",
    modality: "text",
    scope: "direct",
    payload: {
      text: "记住：我晚上运动后不想被打扰。",
    },
    dedupeKey: "chat:msg-remember-1",
    privacyLevel: "private",
    salienceHint: 0.91,
    retentionClass: "candidate_long_term",
  });

  fixture.ledger.record({
    eventType: "ambient.observe",
    sourceType: "ambient",
    sourceEventId: "amb-low-1",
    sessionId: "ambient-session",
    actorId: "sensor:mac-webcam",
    occurredAt: "2026-03-15T11:00:00.000Z",
    modality: "image",
    scope: "ambient",
    payload: {
      activityState: "idle",
      changeScore: 0.03,
      personPresent: false,
    },
    dedupeKey: "ambient:amb-low-1",
    privacyLevel: "sensitive",
    salienceHint: 0.05,
    retentionClass: "episodic",
  });

  const consolidator = new MemorySleepConsolidator({
    ledger: fixture.ledger,
    workspaceDir: fixture.workspaceDir,
  });

  const result = consolidator.run({
    date: "2026-03-15",
    now: "2026-03-18T00:00:00.000Z",
  });

  assert.equal(result.consolidatedCount, 2);
  assert.equal(result.forgottenCount, 1);
  assert.equal(result.promotedFactCount, 1);

  const dailyNote = readFileSync(join(fixture.workspaceDir, "memory", "2026-03-15.md"), "utf8");
  assert.match(dailyNote, /我晚上运动后不想被打扰/);
  assert.match(dailyNote, /Forgotten Noise/);

  const longTermMemory = readFileSync(join(fixture.workspaceDir, "MEMORY.md"), "utf8");
  assert.match(longTermMemory, /我晚上运动后不想被打扰/);

  const facts = fixture.ledger.listLongTermFacts();
  assert.equal(facts.length, 1);
  assert.equal(facts[0]?.content, "我晚上运动后不想被打扰。");
});

test("MemorySleepConsolidator forgets same-day idle ambient noise during sleep", () => {
  const fixture = createFixture();

  fixture.ledger.record({
    eventType: "ambient.observe",
    sourceType: "ambient",
    sourceEventId: "amb-same-day-1",
    sessionId: "ambient-session",
    actorId: "sensor:mac-webcam",
    occurredAt: "2026-03-15T13:15:00.000Z",
    modality: "image",
    scope: "ambient",
    payload: {
      activityState: "idle",
      changeScore: 0.02,
      personPresent: false,
    },
    dedupeKey: "ambient:amb-same-day-1",
    privacyLevel: "sensitive",
    salienceHint: 0.03,
    retentionClass: "episodic",
  });

  const consolidator = new MemorySleepConsolidator({
    ledger: fixture.ledger,
    workspaceDir: fixture.workspaceDir,
  });

  const result = consolidator.run({
    date: "2026-03-15",
    now: "2026-03-15T15:30:00.000Z",
  });

  assert.equal(result.consolidatedCount, 1);
  assert.equal(result.forgottenCount, 1);

  const event = fixture.ledger.listEvents()[0];
  assert.ok(event?.forgottenAt);

  const dailyNote = readFileSync(join(fixture.workspaceDir, "memory", "2026-03-15.md"), "utf8");
  assert.match(dailyNote, /Forgotten Noise/);
});
