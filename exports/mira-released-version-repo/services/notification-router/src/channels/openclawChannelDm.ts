import type {
  ChannelDeliveryResult,
  NotificationRouterWebhookChannelConfig,
  OutboundMessageIntent,
} from "../types.ts";

function extractExternalMessageId(body: unknown) {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.external_message_id === "string") {
    return candidate.external_message_id;
  }
  if (typeof candidate.id === "string") {
    return candidate.id;
  }
  return undefined;
}

export async function dispatchOpenClawChannelDm(
  intent: OutboundMessageIntent,
  config: NotificationRouterWebhookChannelConfig,
): Promise<ChannelDeliveryResult> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.secret ? { "x-mira-router-secret": config.secret } : {}),
    },
    body: JSON.stringify({
      intent,
      channel: "openclaw_channel_dm",
    }),
  });

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      channel: "openclaw_channel_dm",
      delivery_status: "failed",
      reason:
        typeof parsed === "string"
          ? parsed
          : `openclaw_channel_dm webhook failed with ${response.status}`,
    };
  }

  return {
    ok: true,
    channel: "openclaw_channel_dm",
    delivery_status: "sent",
    external_message_id: extractExternalMessageId(parsed),
  };
}
