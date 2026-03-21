import type {
  NotificationRouterChannelConfig,
  NotificationRouterConfig,
} from "../types.ts";

export type NotificationRouterConfigOverrides = Partial<NotificationRouterConfig>;

function readWebhookConfig(
  urlEnv: string,
  secretEnv: string,
): NotificationRouterChannelConfig | null {
  const url = process.env[urlEnv];
  if (!url) {
    return null;
  }

  return {
    kind: "webhook",
    url,
    ...(process.env[secretEnv] ? { secret: process.env[secretEnv] } : {}),
  };
}

function readResendEmailConfig(): NotificationRouterChannelConfig | null {
  const apiKey = process.env.MIRA_NOTIFICATION_ROUTER_RESEND_API_KEY;
  const from = process.env.MIRA_NOTIFICATION_ROUTER_RESEND_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return {
    kind: "resend_email",
    apiKey,
    from,
    ...(process.env.MIRA_NOTIFICATION_ROUTER_RESEND_REPLY_TO
      ? { replyTo: process.env.MIRA_NOTIFICATION_ROUTER_RESEND_REPLY_TO }
      : {}),
    ...(process.env.MIRA_NOTIFICATION_ROUTER_RESEND_API_BASE_URL
      ? { apiBaseUrl: process.env.MIRA_NOTIFICATION_ROUTER_RESEND_API_BASE_URL }
      : {}),
  };
}

export function loadNotificationRouterConfig(
  overrides: NotificationRouterConfigOverrides = {},
): NotificationRouterConfig {
  const envConfig: NotificationRouterConfig = {
    channels: {},
  };

  const directMessage = readWebhookConfig(
    "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_URL",
    "MIRA_NOTIFICATION_ROUTER_OPENCLAW_DM_WEBHOOK_SECRET",
  );

  if (directMessage) {
    envConfig.channels.openclaw_channel_dm = directMessage;
  }

  const resendEmail = readResendEmailConfig();
  if (resendEmail) {
    envConfig.channels.email = resendEmail;
  }

  return {
    channels: {
      ...envConfig.channels,
      ...(overrides.channels ?? {}),
    },
  };
}
