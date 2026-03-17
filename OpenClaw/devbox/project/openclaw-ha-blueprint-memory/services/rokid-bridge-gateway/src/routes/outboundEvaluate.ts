import type { LoadedOutboundPolicy, OutboundIntent } from "../outbound/outboundPolicyTypes.ts";

function isValidIntent(intent: unknown): intent is OutboundIntent {
  if (!intent || typeof intent !== "object") {
    return false;
  }

  const candidate = intent as Record<string, unknown>;
  return (
    typeof candidate.messageKind === "string" &&
    typeof candidate.recipientScope === "string" &&
    typeof candidate.riskTier === "string" &&
    typeof candidate.channel === "string"
  );
}

export function handleOutboundEvaluateRequest(
  body: unknown,
  policy: LoadedOutboundPolicy,
  evaluateOutboundIntent: (policy: LoadedOutboundPolicy, intent: OutboundIntent) => {
    action: "allow" | "ask" | "block";
    matchedRule: string | null;
    reasons: string[];
  },
) {
  const intent = (body as { intent?: OutboundIntent })?.intent;

  if (!isValidIntent(intent)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "Invalid outbound intent payload.",
      },
    };
  }

  const decision = evaluateOutboundIntent(policy, intent);

  return {
    status: 200,
    body: {
      ok: true,
      decision,
    },
  };
}
