import type { DispatchMessageIntentResult } from "../dispatch/dispatchMessageIntent.ts";
import type { OutboundMessageIntent } from "../types.ts";

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

function isValidOutboundMessageIntent(intent: unknown): intent is OutboundMessageIntent {
  if (!intent || typeof intent !== "object") {
    return false;
  }

  const candidate = intent as Record<string, unknown>;
  const stringArrayOrUndefined = (value: unknown) =>
    value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));

  return (
    typeof candidate.intent_id === "string" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.message_kind === "string" &&
    typeof candidate.recipient_scope === "string" &&
    typeof candidate.risk_tier === "string" &&
    typeof candidate.privacy_level === "string" &&
    typeof candidate.content === "string" &&
    stringArrayOrUndefined(candidate.preferred_channels) &&
    stringArrayOrUndefined(candidate.fallback_channels) &&
    stringArrayOrUndefined(candidate.tags) &&
    isRecipientShape(candidate.recipient)
  );
}

export async function handleDispatchIntentRequest(
  body: unknown,
  dispatchMessageIntent: (intent: OutboundMessageIntent) => Promise<DispatchMessageIntentResult>,
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

  const result = await dispatchMessageIntent(intent);
  return {
    status: 200,
    body: {
      ok: true,
      decision: result.decision,
      delivery: result.delivery,
    },
  };
}
