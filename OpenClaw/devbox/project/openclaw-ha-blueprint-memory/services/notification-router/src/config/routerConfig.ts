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

  return {
    channels: {
      ...envConfig.channels,
      ...(overrides.channels ?? {}),
    },
  };
}
