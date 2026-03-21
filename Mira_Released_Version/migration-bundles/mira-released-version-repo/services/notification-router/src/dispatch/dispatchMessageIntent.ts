import {
  evaluateOutboundIntent,
  loadOutboundPolicy,
} from "../policy/outboundPolicyEvaluator.ts";
import type { LoadedOutboundPolicy, OutboundDecision } from "../policy/outboundPolicyTypes.ts";

import { dispatchOpenClawChannelDm } from "../channels/openclawChannelDm.ts";
import { dispatchResendEmail } from "../channels/resendEmail.ts";
import type {
  ChannelDeliveryResult,
  NotificationRouterConfig,
  OutboundMessageIntent,
} from "../types.ts";

export type DispatchMessageIntentResult = {
  decision: OutboundDecision;
  delivery: ChannelDeliveryResult;
};

function dedupeChannels(intent: OutboundMessageIntent) {
  const channels = [
    ...(intent.preferred_channels ?? []),
    ...(intent.fallback_channels ?? []),
  ];

  return [...new Set(channels)];
}

function toPolicyIntent(intent: OutboundMessageIntent, channel: string) {
  return {
    messageKind: intent.message_kind,
    recipientScope: intent.recipient_scope,
    riskTier: intent.risk_tier,
    channel,
    firstContact: intent.first_contact,
    knownRecipient: intent.known_recipient,
    quietHoursActive: intent.quiet_hours_active,
    contentTags: intent.tags,
  };
}

function buildDecisionOnlyDelivery(
  channel: string,
  decision: OutboundDecision,
): ChannelDeliveryResult {
  return {
    ok: decision.action === "allow",
    channel,
    delivery_status:
      decision.action === "block"
        ? "blocked"
        : decision.action === "ask"
          ? "skipped"
          : "failed",
    reason: decision.reasons.join(" "),
  };
}

async function dispatchAllowedChannel(
  channel: string,
  intent: OutboundMessageIntent,
  config: NotificationRouterConfig,
) {
  const channelConfig = config.channels[channel];
  if (!channelConfig) {
    return {
      ok: false,
      channel,
      delivery_status: "failed",
      reason: `No channel adapter is configured for '${channel}'.`,
    } satisfies ChannelDeliveryResult;
  }

  if (channel === "openclaw_channel_dm" && channelConfig.kind === "webhook") {
    return dispatchOpenClawChannelDm(intent, channelConfig);
  }

  if (channelConfig.kind === "resend_email") {
    return dispatchResendEmail(channel, intent, channelConfig);
  }

  return {
    ok: false,
    channel,
    delivery_status: "failed",
    reason: `Unsupported channel adapter '${channelConfig.kind}' for '${channel}'.`,
  } satisfies ChannelDeliveryResult;
}

export async function dispatchMessageIntent(
  intent: OutboundMessageIntent,
  config: NotificationRouterConfig,
  policyOverride?: LoadedOutboundPolicy,
  policyPath?: string | URL,
): Promise<DispatchMessageIntentResult> {
  const policy = await loadOutboundPolicy(policyOverride ?? policyPath);
  const channels = dedupeChannels(intent);

  if (channels.length === 0) {
    return {
      decision: {
        action: "ask",
        matchedRule: null,
        reasons: ["No preferred or fallback channels were provided."],
      },
      delivery: {
        ok: false,
        channel: "unresolved",
        delivery_status: "skipped",
        reason: "No preferred or fallback channels were provided.",
      },
    };
  }

  let firstNonDispatchable: DispatchMessageIntentResult | null = null;

  for (const channel of channels) {
    const decision = evaluateOutboundIntent(policy, toPolicyIntent(intent, channel));

    if (decision.action !== "allow") {
      firstNonDispatchable ??= {
        decision,
        delivery: buildDecisionOnlyDelivery(channel, decision),
      };
      continue;
    }

    const delivery = await dispatchAllowedChannel(channel, intent, config);
    if (delivery.ok) {
      return {
        decision,
        delivery,
      };
    }

    firstNonDispatchable ??= {
      decision,
      delivery,
    };
  }

  return (
    firstNonDispatchable ?? {
      decision: {
        action: "ask",
        matchedRule: null,
        reasons: ["No candidate channel could be dispatched."],
      },
      delivery: {
        ok: false,
        channel: channels[0] ?? "unresolved",
        delivery_status: "failed",
        reason: "No candidate channel could be dispatched.",
      },
    }
  );
}
