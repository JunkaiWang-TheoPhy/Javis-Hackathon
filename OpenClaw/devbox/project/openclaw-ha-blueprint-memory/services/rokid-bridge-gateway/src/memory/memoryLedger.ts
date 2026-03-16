import type { MemoryEventInput, MemoryEventRecord } from "./memoryEvent.ts";
import type { MemoryLongTermFact, MemoryLifecycleUpdate } from "./memoryFact.ts";

export interface MemoryLedger {
  record(input: MemoryEventInput): MemoryEventRecord;
  listEvents(): MemoryEventRecord[];
  listEventsForDate(date: string): MemoryEventRecord[];
  applySleepUpdates(updates: MemoryLifecycleUpdate[], facts: MemoryLongTermFact[]): void;
  listLongTermFacts(): MemoryLongTermFact[];
}
