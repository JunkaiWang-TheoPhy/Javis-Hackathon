import { loadOutboundPolicy } from "./outboundPolicyLoader.ts";
import type {
  LoadedOutboundPolicy,
  OutboundDecision,
  OutboundIntent,
  OutboundPolicyAction,
  OutboundPolicyRule,
} from "./outboundPolicyTypes.ts";

function classifyChannel(policy: LoadedOutboundPolicy, channel: string) {
  if (policy.channel_classes?.private?.includes(channel)) {
    return "private";
  }
  if (policy.channel_classes?.shared?.includes(channel)) {
    return "shared";
  }
  if (policy.channel_classes?.public?.includes(channel)) {
    return "public";
  }
  return "unknown";
}

function intersects(left: string[] | undefined, right: string[] | undefined) {
  if (!left?.length || !right?.length) {
    return false;
  }

  return left.some((value) => right.includes(value));
}

function matchesRule(
  policy: LoadedOutboundPolicy,
  intent: OutboundIntent,
  rule: OutboundPolicyRule,
) {
  if (rule.enabled === false) {
    return false;
  }

  if (rule.recipient_scope && !rule.recipient_scope.includes(intent.recipientScope)) {
    return false;
  }
  if (rule.message_kind && !rule.message_kind.includes(intent.messageKind)) {
    return false;
  }
  if (rule.risk_tier && !rule.risk_tier.includes(intent.riskTier)) {
    return false;
  }
  if (rule.allowed_channels && !rule.allowed_channels.includes(intent.channel)) {
    return false;
  }
  if (typeof rule.first_contact === "boolean" && Boolean(intent.firstContact) !== rule.first_contact) {
    return false;
  }
  if (rule.content_tags && !intersects(rule.content_tags, intent.contentTags)) {
    return false;
  }
  if (rule.content_tags_allowed?.length && intent.contentTags?.length) {
    const allAllowed = intent.contentTags.every((tag) => rule.content_tags_allowed?.includes(tag));
    if (!allAllowed) {
      return false;
    }
  }

  const channelClass = classifyChannel(policy, intent.channel);

  if (rule.conditions?.first_contact_allowed === false && intent.firstContact) {
    return false;
  }
  if (rule.conditions?.known_recipient_required === true) {
    const knownRecipient = intent.knownRecipient ?? !intent.firstContact;
    if (!knownRecipient) {
      return false;
    }
  }
  if (rule.conditions?.private_channel_required === true && channelClass !== "private") {
    return false;
  }
  if (rule.conditions?.respect_quiet_hours === true && intent.quietHoursActive) {
    return false;
  }

  return true;
}

function actionPriority(action: OutboundPolicyAction) {
  switch (action) {
    case "block":
      return 3;
    case "ask":
      return 2;
    case "allow":
      return 1;
  }
}

export function evaluateOutboundIntent(
  policy: LoadedOutboundPolicy,
  intent: OutboundIntent,
): OutboundDecision {
  const matches = policy.rules.filter((rule) => matchesRule(policy, intent, rule));

  if (matches.length === 0) {
    return {
      action: policy.defaults.action,
      matchedRule: null,
      reasons: ["No explicit outbound rule matched; falling back to default action."],
    };
  }

  const selected = [...matches].sort((left, right) =>
    actionPriority(right.action) - actionPriority(left.action)
  )[0]!;

  return {
    action: selected.action,
    matchedRule: selected.name,
    reasons: [
      selected.description ?? `Matched outbound policy rule '${selected.name}'.`,
    ],
  };
}

export { loadOutboundPolicy };
