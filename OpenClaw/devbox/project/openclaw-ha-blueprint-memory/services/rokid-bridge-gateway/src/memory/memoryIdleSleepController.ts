import type { MemoryLedger } from "./memoryLedger.ts";
import { MemorySleepConsolidator, type RunResult as SleepRunResult } from "./memorySleepConsolidator.ts";

type MemoryIdleSleepControllerOptions = {
  ledger: MemoryLedger;
  workspaceDir: string;
  idleThresholdMs?: number;
  hasPendingActions?: () => boolean;
};

type RunInput = {
  now?: string;
  idleThresholdMs?: number;
};

export type MemoryIdleSleepResult =
  | {
      ok: true;
      status: "skipped";
      reason:
        | "no_user_request"
        | "pending_confirmation"
        | "idle_threshold_not_met"
        | "already_slept_for_latest_request";
      idleThresholdMs: number;
      state: ReturnType<MemoryLedger["getRuntimeState"]>;
      idleForMs?: number;
    }
  | {
      ok: true;
      status: "slept";
      idleThresholdMs: number;
      runCount: number;
      runs: SleepRunResult[];
      state: ReturnType<MemoryLedger["getRuntimeState"]>;
    };

export class MemoryIdleSleepController {
  constructor(private readonly options: MemoryIdleSleepControllerOptions) {}

  run(input: RunInput = {}): MemoryIdleSleepResult {
    const now = input.now ?? new Date().toISOString();
    const idleThresholdMs = input.idleThresholdMs ?? this.options.idleThresholdMs ?? 2 * 60 * 60 * 1000;
    const state = this.options.ledger.getRuntimeState();

    if (!state.lastUserRequestAt) {
      return {
        ok: true,
        status: "skipped",
        reason: "no_user_request",
        idleThresholdMs,
        state,
      };
    }

    if (this.options.hasPendingActions?.()) {
      return {
        ok: true,
        status: "skipped",
        reason: "pending_confirmation",
        idleThresholdMs,
        state,
      };
    }

    if (state.lastSleepTriggeredForRequestAt === state.lastUserRequestAt) {
      return {
        ok: true,
        status: "skipped",
        reason: "already_slept_for_latest_request",
        idleThresholdMs,
        state,
      };
    }

    const idleForMs = new Date(now).getTime() - new Date(state.lastUserRequestAt).getTime();
    if (!Number.isFinite(idleForMs) || idleForMs < idleThresholdMs) {
      return {
        ok: true,
        status: "skipped",
        reason: "idle_threshold_not_met",
        idleThresholdMs,
        state,
        ...(Number.isFinite(idleForMs) ? { idleForMs } : {}),
      };
    }

    this.options.ledger.updateRuntimeState({
      lastSleepStartedAt: now,
    });

    const dates = this.options.ledger.listEventDatesBetween(state.lastUserRequestAt, now);
    const consolidator = new MemorySleepConsolidator({
      ledger: this.options.ledger,
      workspaceDir: this.options.workspaceDir,
    });
    const runs = dates.map((date) => consolidator.run({ date, now }));
    const lastBatchId = runs.length > 0 ? runs[runs.length - 1]?.batchId ?? null : null;
    const nextState = this.options.ledger.updateRuntimeState({
      lastSleepCompletedAt: now,
      lastSleepTriggeredForRequestAt: state.lastUserRequestAt,
      lastSleepBatchId: lastBatchId,
    });

    return {
      ok: true,
      status: "slept",
      idleThresholdMs,
      runCount: runs.length,
      runs,
      state: nextState,
    };
  }
}
