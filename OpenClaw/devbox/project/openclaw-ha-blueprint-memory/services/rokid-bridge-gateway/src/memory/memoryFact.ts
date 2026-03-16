export type MemoryLongTermFact = {
  factKey: string;
  content: string;
  score: number;
  privacyLevel: string;
  sourceEventId?: string;
  updatedAt: string;
};

export type MemoryLifecycleUpdate = {
  eventId: string;
  importanceScore: number;
  consolidatedAt: string;
  consolidationBatchId: string;
  forgottenAt?: string;
};
