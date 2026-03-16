import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import type { MemoryEventInput, MemoryEventRecord } from "./memoryEvent.ts";
import type { MemoryLongTermFact, MemoryLifecycleUpdate } from "./memoryFact.ts";
import type { MemoryLedger } from "./memoryLedger.ts";
import type { MemoryRuntimeState, MemoryRuntimeStatePatch } from "./memoryRuntimeState.ts";

type EventRow = {
  event_id: string;
  event_type: string;
  source_type: string;
  source_event_id: string | null;
  session_id: string | null;
  actor_id: string | null;
  target_id: string | null;
  occurred_at: string;
  ingested_at: string;
  modality: string;
  scope: string;
  payload_json: string;
  dedupe_key: string;
  privacy_level: string;
  salience_hint: number;
  retention_class: string;
  parent_event_id: string | null;
  importance_score: number | null;
  consolidated_at: string | null;
  consolidation_batch_id: string | null;
  forgotten_at: string | null;
};

type FactRow = {
  fact_key: string;
  content: string;
  score: number;
  privacy_level: string | null;
  source_event_id: string | null;
  updated_at: string;
};

type RuntimeStateRow = {
  last_user_request_at: string | null;
  last_sleep_started_at: string | null;
  last_sleep_completed_at: string | null;
  last_sleep_triggered_for_request_at: string | null;
  last_sleep_batch_id: string | null;
};

function rowToRecord(row: EventRow): MemoryEventRecord {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    sourceType: row.source_type,
    ...(row.source_event_id ? { sourceEventId: row.source_event_id } : {}),
    ...(row.session_id ? { sessionId: row.session_id } : {}),
    ...(row.actor_id ? { actorId: row.actor_id } : {}),
    ...(row.target_id ? { targetId: row.target_id } : {}),
    occurredAt: row.occurred_at,
    ingestedAt: row.ingested_at,
    modality: row.modality,
    scope: row.scope,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    dedupeKey: row.dedupe_key,
    privacyLevel: row.privacy_level,
    salienceHint: row.salience_hint,
    retentionClass: row.retention_class,
    ...(row.parent_event_id ? { parentEventId: row.parent_event_id } : {}),
    ...(row.importance_score === null ? {} : { importanceScore: row.importance_score }),
    ...(row.consolidated_at ? { consolidatedAt: row.consolidated_at } : {}),
    ...(row.consolidation_batch_id ? { consolidationBatchId: row.consolidation_batch_id } : {}),
    ...(row.forgotten_at ? { forgottenAt: row.forgotten_at } : {}),
  };
}

function rowToFact(row: FactRow): MemoryLongTermFact {
  return {
    factKey: row.fact_key,
    content: row.content,
    score: row.score,
    privacyLevel: row.privacy_level ?? "private",
    ...(row.source_event_id ? { sourceEventId: row.source_event_id } : {}),
    updatedAt: row.updated_at,
  };
}

function rowToRuntimeState(row: RuntimeStateRow | undefined): MemoryRuntimeState {
  if (!row) {
    return {};
  }

  return {
    ...(row.last_user_request_at ? { lastUserRequestAt: row.last_user_request_at } : {}),
    ...(row.last_sleep_started_at ? { lastSleepStartedAt: row.last_sleep_started_at } : {}),
    ...(row.last_sleep_completed_at ? { lastSleepCompletedAt: row.last_sleep_completed_at } : {}),
    ...(row.last_sleep_triggered_for_request_at
      ? { lastSleepTriggeredForRequestAt: row.last_sleep_triggered_for_request_at }
      : {}),
    ...(row.last_sleep_batch_id ? { lastSleepBatchId: row.last_sleep_batch_id } : {}),
  };
}

export class SQLiteMemoryLedger implements MemoryLedger {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_event_id TEXT,
        session_id TEXT,
        actor_id TEXT,
        target_id TEXT,
        occurred_at TEXT NOT NULL,
        ingested_at TEXT NOT NULL,
        modality TEXT NOT NULL,
        scope TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        privacy_level TEXT NOT NULL,
        salience_hint REAL NOT NULL,
        retention_class TEXT NOT NULL,
        parent_event_id TEXT,
        importance_score REAL,
        consolidated_at TEXT,
        consolidation_batch_id TEXT,
        forgotten_at TEXT
      );

      CREATE TABLE IF NOT EXISTS memory_long_term_facts (
        fact_key TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        score REAL NOT NULL,
        privacy_level TEXT,
        source_event_id TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memory_runtime_state (
        singleton_key INTEGER PRIMARY KEY CHECK (singleton_key = 1),
        last_user_request_at TEXT,
        last_sleep_started_at TEXT,
        last_sleep_completed_at TEXT,
        last_sleep_triggered_for_request_at TEXT,
        last_sleep_batch_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memory_events_occurred_at
        ON memory_events (occurred_at);
      CREATE INDEX IF NOT EXISTS idx_memory_events_session_id
        ON memory_events (session_id);
      CREATE INDEX IF NOT EXISTS idx_memory_events_event_type
        ON memory_events (event_type);
      CREATE INDEX IF NOT EXISTS idx_memory_events_source_type
        ON memory_events (source_type);
    `);
    this.ensureColumn("memory_events", "importance_score", "REAL");
    this.ensureColumn("memory_events", "consolidated_at", "TEXT");
    this.ensureColumn("memory_events", "consolidation_batch_id", "TEXT");
    this.ensureColumn("memory_events", "forgotten_at", "TEXT");
    this.ensureColumn("memory_long_term_facts", "privacy_level", "TEXT");
    this.db.prepare(`
      INSERT INTO memory_runtime_state (
        singleton_key,
        last_user_request_at,
        last_sleep_started_at,
        last_sleep_completed_at,
        last_sleep_triggered_for_request_at,
        last_sleep_batch_id
      ) VALUES (1, NULL, NULL, NULL, NULL, NULL)
      ON CONFLICT(singleton_key) DO NOTHING
    `).run();
  }

  record(input: MemoryEventInput): MemoryEventRecord {
    const existing = this.findByDedupeKey(input.dedupeKey);
    if (existing) {
      return existing;
    }

    const record: MemoryEventRecord = {
      eventId: randomUUID(),
      ingestedAt: new Date().toISOString(),
      ...input,
    };

    this.db.prepare(`
      INSERT INTO memory_events (
        event_id,
        event_type,
        source_type,
        source_event_id,
        session_id,
        actor_id,
        target_id,
        occurred_at,
        ingested_at,
        modality,
        scope,
        payload_json,
        dedupe_key,
        privacy_level,
        salience_hint,
        retention_class,
        parent_event_id
      ) VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
    `).run(
      record.eventId,
      record.eventType,
      record.sourceType,
      record.sourceEventId ?? null,
      record.sessionId ?? null,
      record.actorId ?? null,
      record.targetId ?? null,
      record.occurredAt,
      record.ingestedAt,
      record.modality,
      record.scope,
      JSON.stringify(record.payload),
      record.dedupeKey,
      record.privacyLevel,
      record.salienceHint,
      record.retentionClass,
      record.parentEventId ?? null,
    );

    return record;
  }

  listEvents(): MemoryEventRecord[] {
    return this.selectEvents();
  }

  listEventsForDate(date: string): MemoryEventRecord[] {
    return this.selectEvents("WHERE substr(occurred_at, 1, 10) = ?", [date]);
  }

  listEventDatesBetween(startOccurredAt: string, endOccurredAt: string): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT substr(occurred_at, 1, 10) AS date
      FROM memory_events
      WHERE occurred_at >= ? AND occurred_at <= ?
      ORDER BY date ASC
    `).all(startOccurredAt, endOccurredAt) as Array<{ date: string }>;

    return rows.map((row) => row.date);
  }

  applySleepUpdates(updates: MemoryLifecycleUpdate[], facts: MemoryLongTermFact[]): void {
    const updateStmt = this.db.prepare(`
      UPDATE memory_events
      SET
        importance_score = ?,
        consolidated_at = ?,
        consolidation_batch_id = ?,
        forgotten_at = ?
      WHERE event_id = ?
    `);

    const factStmt = this.db.prepare(`
      INSERT INTO memory_long_term_facts (
        fact_key,
        content,
        score,
        privacy_level,
        source_event_id,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(fact_key) DO UPDATE SET
        content = excluded.content,
        score = excluded.score,
        privacy_level = excluded.privacy_level,
        source_event_id = excluded.source_event_id,
        updated_at = excluded.updated_at
    `);

    this.db.exec("BEGIN");
    try {
      for (const update of updates) {
        updateStmt.run(
          update.importanceScore,
          update.consolidatedAt,
          update.consolidationBatchId,
          update.forgottenAt ?? null,
          update.eventId,
        );
      }

      for (const fact of facts) {
        factStmt.run(
          fact.factKey,
          fact.content,
          fact.score,
          fact.privacyLevel,
          fact.sourceEventId ?? null,
          fact.updatedAt,
        );
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  listLongTermFacts(): MemoryLongTermFact[] {
    const rows = this.db.prepare(`
      SELECT fact_key, content, score, privacy_level, source_event_id, updated_at
      FROM memory_long_term_facts
      ORDER BY updated_at DESC, fact_key ASC
    `).all() as FactRow[];

    return rows.map(rowToFact);
  }

  getRuntimeState(): MemoryRuntimeState {
    const row = this.db.prepare(`
      SELECT
        last_user_request_at,
        last_sleep_started_at,
        last_sleep_completed_at,
        last_sleep_triggered_for_request_at,
        last_sleep_batch_id
      FROM memory_runtime_state
      WHERE singleton_key = 1
    `).get() as RuntimeStateRow | undefined;

    return rowToRuntimeState(row);
  }

  updateRuntimeState(patch: MemoryRuntimeStatePatch): MemoryRuntimeState {
    const current = this.getRuntimeState();
    const next: MemoryRuntimeState = {
      ...(current.lastUserRequestAt ? { lastUserRequestAt: current.lastUserRequestAt } : {}),
      ...(current.lastSleepStartedAt ? { lastSleepStartedAt: current.lastSleepStartedAt } : {}),
      ...(current.lastSleepCompletedAt ? { lastSleepCompletedAt: current.lastSleepCompletedAt } : {}),
      ...(current.lastSleepTriggeredForRequestAt
        ? { lastSleepTriggeredForRequestAt: current.lastSleepTriggeredForRequestAt }
        : {}),
      ...(current.lastSleepBatchId ? { lastSleepBatchId: current.lastSleepBatchId } : {}),
    };

    const applyField = <K extends keyof MemoryRuntimeState>(
      field: K,
      value: string | null | undefined,
    ) => {
      if (value === undefined) {
        return;
      }
      if (value === null) {
        delete next[field];
        return;
      }
      next[field] = value;
    };

    applyField("lastUserRequestAt", patch.lastUserRequestAt);
    applyField("lastSleepStartedAt", patch.lastSleepStartedAt);
    applyField("lastSleepCompletedAt", patch.lastSleepCompletedAt);
    applyField("lastSleepTriggeredForRequestAt", patch.lastSleepTriggeredForRequestAt);
    applyField("lastSleepBatchId", patch.lastSleepBatchId);

    this.db.prepare(`
      UPDATE memory_runtime_state
      SET
        last_user_request_at = ?,
        last_sleep_started_at = ?,
        last_sleep_completed_at = ?,
        last_sleep_triggered_for_request_at = ?,
        last_sleep_batch_id = ?
      WHERE singleton_key = 1
    `).run(
      next.lastUserRequestAt ?? null,
      next.lastSleepStartedAt ?? null,
      next.lastSleepCompletedAt ?? null,
      next.lastSleepTriggeredForRequestAt ?? null,
      next.lastSleepBatchId ?? null,
    );

    return next;
  }

  private selectEvents(whereClause = "", params: unknown[] = []) {
    const rows = this.db.prepare(`
      SELECT
        event_id,
        event_type,
        source_type,
        source_event_id,
        session_id,
        actor_id,
        target_id,
        occurred_at,
        ingested_at,
        modality,
        scope,
        payload_json,
        dedupe_key,
        privacy_level,
        salience_hint,
        retention_class,
        parent_event_id,
        importance_score,
        consolidated_at,
        consolidation_batch_id,
        forgotten_at
      FROM memory_events
      ${whereClause}
      ORDER BY occurred_at ASC, ingested_at ASC
    `).all(...params) as EventRow[];

    return rows.map(rowToRecord);
  }

  private findByDedupeKey(dedupeKey: string) {
    const row = this.db.prepare(`
      SELECT
        event_id,
        event_type,
        source_type,
        source_event_id,
        session_id,
        actor_id,
        target_id,
        occurred_at,
        ingested_at,
        modality,
        scope,
        payload_json,
        dedupe_key,
        privacy_level,
        salience_hint,
        retention_class,
        parent_event_id,
        importance_score,
        consolidated_at,
        consolidation_batch_id,
        forgotten_at
      FROM memory_events
      WHERE dedupe_key = ?
      LIMIT 1
    `).get(dedupeKey) as EventRow | undefined;

    return row ? rowToRecord(row) : null;
  }

  private ensureColumn(table: string, column: string, definition: string) {
    const rows = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (rows.some((row) => row.name === column)) {
      return;
    }

    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
