export type OutboundPolicyAction = "allow" | "ask" | "block";

export type OutboundIntent = {
  messageKind: string;
  recipientScope: string;
  riskTier: string;
  channel: string;
  firstContact?: boolean;
  knownRecipient?: boolean;
  quietHoursActive?: boolean;
  contentTags?: string[];
};

export type OutboundPolicyRule = {
  name: string;
  enabled?: boolean;
  description?: string;
  action: OutboundPolicyAction;
  recipient_scope?: string[];
  message_kind?: string[];
  risk_tier?: string[];
  allowed_channels?: string[];
  content_tags?: string[];
  content_tags_allowed?: string[];
  first_contact?: boolean;
  conditions?: {
    first_contact_allowed?: boolean;
    known_recipient_required?: boolean;
    private_channel_required?: boolean;
    respect_quiet_hours?: boolean;
    require_minimal_content?: boolean;
  };
};

export type LoadedOutboundPolicy = {
  version: number;
  policy_name: string;
  effective_date?: string;
  current_runtime_path?: string;
  defaults: {
    action: OutboundPolicyAction;
    known_recipient_required?: boolean;
    private_channel_required?: boolean;
    respect_quiet_hours?: boolean;
    log_all_attempts?: boolean;
    log_reason?: boolean;
  };
  quiet_hours?: {
    timezone?: string;
    start?: string;
    end?: string;
  };
  rate_limits?: {
    per_hour?: number;
    per_day?: number;
    per_rule?: Record<string, number>;
  };
  channel_classes?: {
    private?: string[];
    shared?: string[];
    public?: string[];
  };
  rules: OutboundPolicyRule[];
};

export type OutboundDecision = {
  action: OutboundPolicyAction;
  matchedRule: string | null;
  reasons: string[];
};
