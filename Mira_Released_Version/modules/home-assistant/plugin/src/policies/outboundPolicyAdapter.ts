export type OutboundDecision = "allow" | "ask" | "block";

export type OutboundStepAssessment = {
  decision: OutboundDecision;
  matchedRule: string | null;
  reasons: string[];
};

export type EvaluateOutboundStepInput = {
  messageKind: "reminder" | "checkin" | "summary" | "alert" | "escalation";
  recipientScope: "self" | "known_contact" | "caregiver" | "group" | "public";
  privacyLevel?: "private" | "sensitive";
  firstContact?: boolean;
  knownRecipient?: boolean;
  quietHoursActive?: boolean;
};

export function evaluateOutboundStep(
  input: EvaluateOutboundStepInput,
): OutboundStepAssessment {
  if (input.recipientScope === "public") {
    return {
      decision: "block",
      matchedRule: "block_public_posting",
      reasons: ["Public outbound posting is blocked by default."],
    };
  }

  if (input.recipientScope !== "self" && input.firstContact) {
    return {
      decision: "ask",
      matchedRule: "new_recipient_requires_confirmation",
      reasons: ["First contact to a non-self recipient requires confirmation."],
    };
  }

  if (input.messageKind === "escalation" && input.recipientScope === "caregiver") {
    return {
      decision: "ask",
      matchedRule: "caregiver_escalation",
      reasons: ["Caregiver escalation requires confirmation before outbound delivery."],
    };
  }

  if (
    input.recipientScope === "self" &&
    ["reminder", "checkin", "summary"].includes(input.messageKind)
  ) {
    return {
      decision: "allow",
      matchedRule:
        input.messageKind === "reminder"
          ? "user_self_reminder"
          : input.messageKind === "checkin"
            ? "user_self_checkin"
            : "user_self_summary",
      reasons: ["Low-risk self-directed outbound messaging is allowed."],
    };
  }

  if (
    input.recipientScope === "self" &&
    input.messageKind === "alert" &&
    input.privacyLevel === "private"
  ) {
    return {
      decision: "allow",
      matchedRule: "user_self_private_alert",
      reasons: ["Private self alerts are allowed by the release-side outbound policy."],
    };
  }

  return {
    decision: "ask",
    matchedRule: null,
    reasons: ["No explicit release-side outbound rule matched; defaulting to ask."],
  };
}
