export type {
  ChannelDeliveryResult,
  NotificationDispatchResponse,
  OutboundDecision,
  OutboundMessageIntent,
  OutboundMessageSource,
} from "../../../packages/contracts/src/index.ts";

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
