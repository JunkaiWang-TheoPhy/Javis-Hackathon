import type {
  NotificationDispatchResponse,
  OutboundMessageIntent,
} from "../../../../packages/contracts/src/index.ts";

function isRecipientShape(input: unknown) {
  if (input === undefined) {
    return true;
  }

  if (!input || typeof input !== "object") {
    return false;
  }

  const recipient = input as Record<string, unknown>;
  return (
    (recipient.id === undefined || typeof recipient.id === "string") &&
    (recipient.address === undefined || typeof recipient.address === "string") &&
    (recipient.display_name === undefined || typeof recipient.display_name === "string")
  );
}

function isStringArrayOrUndefined(value: unknown) {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function isValidOutboundMessageIntent(intent: unknown): intent is OutboundMessageIntent {
  if (!intent || typeof intent !== "object") {
    return false;
  }

  const candidate = intent as Record<string, unknown>;
  return (
    typeof candidate.intent_id === "string" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.message_kind === "string" &&
    typeof candidate.recipient_scope === "string" &&
    typeof candidate.risk_tier === "string" &&
    typeof candidate.privacy_level === "string" &&
    typeof candidate.content === "string" &&
    isStringArrayOrUndefined(candidate.preferred_channels) &&
    isStringArrayOrUndefined(candidate.fallback_channels) &&
    isStringArrayOrUndefined(candidate.tags) &&
    isRecipientShape(candidate.recipient)
  );
}

export async function handleOutboundDispatchRequest(
  body: unknown,
  dispatchOutboundIntent: (
    intent: OutboundMessageIntent,
  ) => Promise<NotificationDispatchResponse>,
) {
  const intent = (body as { intent?: OutboundMessageIntent })?.intent;
  if (!isValidOutboundMessageIntent(intent)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Invalid outbound message intent payload.",
      },
    };
  }

  const result = await dispatchOutboundIntent(intent);
  return {
    status: 200,
    body: result,
  };
}
