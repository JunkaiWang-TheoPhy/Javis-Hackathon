import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { afterEach } from "node:test";

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

function createLedger() {
  const dir = mkdtempSync(join(tmpdir(), "mira-memory-ledger-"));
  tempDirs.push(dir);
  return new SQLiteMemoryLedger(join(dir, "memory.sqlite"));
}

test("SQLiteMemoryLedger records and lists persisted events", () => {
  const ledger = createLedger();

  ledger.record({
    eventType: "chat.user_message",
    sourceType: "chat",
    sourceEventId: "msg-001",
    sessionId: "sess-1",
    actorId: "user:thomas",
    targetId: "agent:mira",
    occurredAt: "2026-03-15T10:00:00.000Z",
    modality: "text",
    scope: "direct",
    payload: {
      text: "记住我晚上运动后不想被打扰。",
    },
    dedupeKey: "chat:msg-001",
    privacyLevel: "private",
    salienceHint: 0.92,
    retentionClass: "candidate_long_term",
  });

  const events = ledger.listEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventType, "chat.user_message");
  assert.equal(events[0]?.sourceType, "chat");
  assert.equal(events[0]?.sessionId, "sess-1");
  assert.deepEqual(events[0]?.payload, {
    text: "记住我晚上运动后不想被打扰。",
  });
});

test("SQLiteMemoryLedger treats duplicate dedupe keys as idempotent", () => {
  const ledger = createLedger();

  const input = {
    eventType: "ambient.observe",
    sourceType: "ambient",
    sourceEventId: "amb-001",
    sessionId: "sess-ambient-1",
    actorId: "sensor:mac-webcam",
    occurredAt: "2026-03-15T10:05:00.000Z",
    modality: "image",
    scope: "ambient",
    payload: {
      activityState: "person_present",
      changeScore: 0.32,
    },
    dedupeKey: "ambient:amb-001",
    privacyLevel: "sensitive",
    salienceHint: 0.44,
    retentionClass: "episodic",
  } as const;

  ledger.record(input);
  ledger.record(input);

  const events = ledger.listEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0]?.dedupeKey, "ambient:amb-001");
});
