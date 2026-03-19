import { Type, type Static } from "@sinclair/typebox";

export const OutboundMessageSourceSchema = Type.Union([
  Type.Literal("heartbeat"),
  Type.Literal("cron"),
  Type.Literal("event"),
  Type.Literal("manual"),
]);

export const OutboundMessageKindSchema = Type.Union([
  Type.Literal("reminder"),
  Type.Literal("checkin"),
  Type.Literal("summary"),
  Type.Literal("alert"),
  Type.Literal("escalation"),
]);

export const OutboundRecipientScopeSchema = Type.Union([
  Type.Literal("self"),
  Type.Literal("known_contact"),
  Type.Literal("caregiver"),
  Type.Literal("group"),
  Type.Literal("public"),
]);

export const OutboundRiskTierSchema = Type.Union([
  Type.Literal("low"),
  Type.Literal("medium"),
  Type.Literal("high"),
]);

export const OutboundPrivacyLevelSchema = Type.Union([
  Type.Literal("private"),
  Type.Literal("sensitive"),
]);

export const OutboundRecipientSchema = Type.Object(
  {
    id: Type.Optional(Type.String()),
    address: Type.Optional(Type.String()),
    display_name: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const OutboundMessageIntentSchema = Type.Object(
  {
    intent_id: Type.String(),
    created_at: Type.String(),
    source: OutboundMessageSourceSchema,
    message_kind: OutboundMessageKindSchema,
    recipient_scope: OutboundRecipientScopeSchema,
    risk_tier: OutboundRiskTierSchema,
    privacy_level: OutboundPrivacyLevelSchema,
    subject: Type.Optional(Type.String()),
    content: Type.String(),
    preferred_channels: Type.Optional(Type.Array(Type.String())),
    fallback_channels: Type.Optional(Type.Array(Type.String())),
    requires_ack: Type.Optional(Type.Boolean()),
    respect_quiet_hours: Type.Optional(Type.Boolean()),
    tags: Type.Optional(Type.Array(Type.String())),
    context: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    recipient: Type.Optional(OutboundRecipientSchema),
    first_contact: Type.Optional(Type.Boolean()),
    known_recipient: Type.Optional(Type.Boolean()),
    quiet_hours_active: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const ChannelDeliveryStatusSchema = Type.Union([
  Type.Literal("sent"),
  Type.Literal("queued"),
  Type.Literal("blocked"),
  Type.Literal("skipped"),
  Type.Literal("failed"),
]);

export const ChannelDeliveryResultSchema = Type.Object(
  {
    ok: Type.Boolean(),
    channel: Type.String(),
    delivery_status: ChannelDeliveryStatusSchema,
    reason: Type.Optional(Type.String()),
    external_message_id: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const OutboundDecisionActionSchema = Type.Union([
  Type.Literal("allow"),
  Type.Literal("ask"),
  Type.Literal("block"),
]);

export const OutboundDecisionSchema = Type.Object(
  {
    action: OutboundDecisionActionSchema,
    matchedRule: Type.Union([Type.String(), Type.Null()]),
    reasons: Type.Array(Type.String()),
  },
  { additionalProperties: false },
);

export const NotificationDispatchResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    decision: OutboundDecisionSchema,
    delivery: ChannelDeliveryResultSchema,
  },
  { additionalProperties: false },
);

export type OutboundMessageSource = Static<typeof OutboundMessageSourceSchema>;
export type OutboundMessageKind = Static<typeof OutboundMessageKindSchema>;
export type OutboundRecipientScope = Static<typeof OutboundRecipientScopeSchema>;
export type OutboundRiskTier = Static<typeof OutboundRiskTierSchema>;
export type OutboundPrivacyLevel = Static<typeof OutboundPrivacyLevelSchema>;
export type OutboundRecipient = Static<typeof OutboundRecipientSchema>;
export type OutboundMessageIntent = Static<typeof OutboundMessageIntentSchema>;
export type ChannelDeliveryStatus = Static<typeof ChannelDeliveryStatusSchema>;
export type ChannelDeliveryResult = Static<typeof ChannelDeliveryResultSchema>;
export type OutboundDecisionAction = Static<typeof OutboundDecisionActionSchema>;
export type OutboundDecision = Static<typeof OutboundDecisionSchema>;
export type NotificationDispatchResponse = Static<typeof NotificationDispatchResponseSchema>;
