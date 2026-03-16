import type { MemoryEventInput, MemoryEventRecord } from "./memoryEvent.ts";
import type { MemoryLongTermFact, MemoryLifecycleUpdate } from "./memoryFact.ts";
import type { MemoryRuntimeState, MemoryRuntimeStatePatch } from "./memoryRuntimeState.ts";

export interface MemoryLedger {
  record(input: MemoryEventInput): MemoryEventRecord;
  listEvents(): MemoryEventRecord[];
  listEventsForDate(date: string): MemoryEventRecord[];
  listEventDatesBetween(startOccurredAt: string, endOccurredAt: string): string[];
  applySleepUpdates(updates: MemoryLifecycleUpdate[], facts: MemoryLongTermFact[]): void;
  listLongTermFacts(): MemoryLongTermFact[];
  getRuntimeState(): MemoryRuntimeState;
  updateRuntimeState(patch: MemoryRuntimeStatePatch): MemoryRuntimeState;
}
