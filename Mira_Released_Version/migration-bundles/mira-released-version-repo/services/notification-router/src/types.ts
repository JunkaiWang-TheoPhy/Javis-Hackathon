export type OutboundMessageSource = "heartbeat" | "cron" | "event" | "manual";
export type OutboundMessageKind =
  | "reminder"
  | "checkin"
  | "summary"
  | "alert"
  | "escalation";
export type OutboundRecipientScope =
  | "self"
  | "known_contact"
  | "caregiver"
  | "group"
  | "public";
export type OutboundRiskTier = "low" | "medium" | "high";
export type OutboundPrivacyLevel = "private" | "sensitive";

export type OutboundRecipient = {
  id?: string;
  address?: string;
  display_name?: string;
};

export type OutboundMessageIntent = {
  intent_id: string;
  created_at: string;
  source: OutboundMessageSource;
  message_kind: OutboundMessageKind;
  recipient_scope: OutboundRecipientScope;
  risk_tier: OutboundRiskTier;
  privacy_level: OutboundPrivacyLevel;
  subject?: string;
  content: string;
  preferred_channels?: string[];
  fallback_channels?: string[];
  requires_ack?: boolean;
  respect_quiet_hours?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
  recipient?: OutboundRecipient;
  first_contact?: boolean;
  known_recipient?: boolean;
  quiet_hours_active?: boolean;
};

export type ChannelDeliveryStatus =
  | "sent"
  | "queued"
  | "blocked"
  | "skipped"
  | "failed";

export type ChannelDeliveryResult = {
  ok: boolean;
  channel: string;
  delivery_status: ChannelDeliveryStatus;
  reason?: string;
  external_message_id?: string;
};

export type OutboundDecisionAction = "allow" | "ask" | "block";

export type OutboundDecision = {
  action: OutboundDecisionAction;
  matchedRule: string | null;
  reasons: string[];
};

export type NotificationDispatchResponse = {
  ok: boolean;
  decision: OutboundDecision;
  delivery: ChannelDeliveryResult;
};

export type NotificationRouterWebhookChannelConfig = {
  kind: "webhook";
  url: string;
  secret?: string;
};

export type NotificationRouterResendEmailChannelConfig = {
  kind: "resend_email";
  apiKey: string;
  from: string;
  replyTo?: string;
  apiBaseUrl?: string;
};

export type NotificationRouterChannelConfig =
  | NotificationRouterWebhookChannelConfig
  | NotificationRouterResendEmailChannelConfig;

export type NotificationRouterConfig = {
  channels: Record<string, NotificationRouterChannelConfig>;
};
