export type OutboundMessageSource = "heartbeat" | "cron" | "event" | "manual";

export type OutboundMessageIntent = {
  intent_id: string;
  created_at: string;
  source: OutboundMessageSource;
  message_kind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
  recipient_scope: "self" | "known_contact" | "caregiver" | "group" | "public";
  risk_tier: "low" | "medium" | "high";
  privacy_level: "private" | "sensitive";
  subject?: string;
  content: string;
  preferred_channels?: string[];
  fallback_channels?: string[];
  requires_ack?: boolean;
  respect_quiet_hours?: boolean;
  tags?: string[];
  context?: Record<string, unknown>;
  recipient?: {
    id?: string;
    address?: string;
    display_name?: string;
  };
  first_contact?: boolean;
  known_recipient?: boolean;
  quiet_hours_active?: boolean;
};

export type ChannelDeliveryResult = {
  ok: boolean;
  channel: string;
  delivery_status: "sent" | "queued" | "blocked" | "skipped" | "failed";
  reason?: string;
  external_message_id?: string;
};

export type NotificationRouterChannelConfig = {
  kind: "webhook";
  url: string;
  secret?: string;
};

export type NotificationRouterConfig = {
  channels: Record<string, NotificationRouterChannelConfig>;
};
