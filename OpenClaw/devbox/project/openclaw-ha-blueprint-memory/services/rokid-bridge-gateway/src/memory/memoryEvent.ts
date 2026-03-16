import { Type, type Static } from "@sinclair/typebox";

export const MemoryEventInputSchema = Type.Object(
  {
    eventType: Type.String(),
    sourceType: Type.String(),
    sourceEventId: Type.Optional(Type.String()),
    sessionId: Type.Optional(Type.String()),
    actorId: Type.Optional(Type.String()),
    targetId: Type.Optional(Type.String()),
    occurredAt: Type.String(),
    modality: Type.String(),
    scope: Type.String(),
    payload: Type.Record(Type.String(), Type.Unknown()),
    dedupeKey: Type.String(),
    privacyLevel: Type.String(),
    salienceHint: Type.Number(),
    retentionClass: Type.String(),
    parentEventId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type MemoryEventInput = Static<typeof MemoryEventInputSchema>;

export type MemoryEventRecord = MemoryEventInput & {
  eventId: string;
  ingestedAt: string;
  importanceScore?: number;
  consolidatedAt?: string;
  consolidationBatchId?: string;
  forgottenAt?: string;
};
