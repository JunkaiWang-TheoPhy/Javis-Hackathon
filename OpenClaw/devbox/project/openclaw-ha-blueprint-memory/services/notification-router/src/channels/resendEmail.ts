import type {
  ChannelDeliveryResult,
  NotificationRouterResendEmailChannelConfig,
  OutboundMessageIntent,
} from "../types.ts";

function extractExternalMessageId(body: unknown) {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.id === "string") {
    return candidate.id;
  }
  if (typeof candidate.external_message_id === "string") {
    return candidate.external_message_id;
  }
  return undefined;
}

function resolveApiUrl(config: NotificationRouterResendEmailChannelConfig) {
  const baseUrl = config.apiBaseUrl ?? "https://api.resend.com";
  return `${baseUrl.replace(/\/+$/, "")}/emails`;
}

function resolveSubject(intent: OutboundMessageIntent) {
  return intent.subject ?? `Mira ${intent.message_kind}`;
}

export async function dispatchResendEmail(
  channel: string,
  intent: OutboundMessageIntent,
  config: NotificationRouterResendEmailChannelConfig,
): Promise<ChannelDeliveryResult> {
  const recipientAddress = intent.recipient?.address;
  if (!recipientAddress) {
    return {
      ok: false,
      channel,
      delivery_status: "failed",
      reason: "Email delivery requires intent.recipient.address.",
    };
  }

  const response = await fetch(resolveApiUrl(config), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [recipientAddress],
      subject: resolveSubject(intent),
      text: intent.content,
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
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
      channel,
      delivery_status: "failed",
      reason:
        typeof parsed === "string"
          ? parsed
          : `resend_email request failed with ${response.status}`,
    };
  }

  return {
    ok: true,
    channel,
    delivery_status: "sent",
    external_message_id: extractExternalMessageId(parsed),
  };
}
