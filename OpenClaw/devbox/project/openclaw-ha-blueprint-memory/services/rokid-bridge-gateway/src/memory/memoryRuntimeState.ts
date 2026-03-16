export type MemoryRuntimeState = {
  lastUserRequestAt?: string;
  lastSleepStartedAt?: string;
  lastSleepCompletedAt?: string;
  lastSleepTriggeredForRequestAt?: string;
  lastSleepBatchId?: string;
};

export type MemoryRuntimeStatePatch = {
  lastUserRequestAt?: string | null;
  lastSleepStartedAt?: string | null;
  lastSleepCompletedAt?: string | null;
  lastSleepTriggeredForRequestAt?: string | null;
  lastSleepBatchId?: string | null;
};
