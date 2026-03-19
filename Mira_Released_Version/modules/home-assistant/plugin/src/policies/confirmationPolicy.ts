import type { DeviceRiskTier } from "../registry/loadDevicesRegistry.ts";

export type ConfirmationDecision = "auto" | "ask" | "double_confirm" | "block";

export type ConfirmationAssessment = {
  decision: ConfirmationDecision;
  reasons: string[];
};

export type EvaluateConfirmationInput = {
  actionRiskTier: DeviceRiskTier;
  capabilityRequiresConfirmation?: boolean;
  requiresHumanApprovalDefault: boolean;
  confirmationMode?: "normal" | "strict";
  triggeredBy?: "manual" | "heartbeat" | "cron" | "event";
};

export function evaluateConfirmationDecision(
  input: EvaluateConfirmationInput,
): ConfirmationAssessment {
  if (input.capabilityRequiresConfirmation) {
    return {
      decision: "ask",
      reasons: ["Capability metadata requires human confirmation."],
    };
  }

  if (input.requiresHumanApprovalDefault) {
    return {
      decision: "ask",
      reasons: ["Policy context requires human approval by default."],
    };
  }

  if (input.confirmationMode === "strict" && input.actionRiskTier !== "inform") {
    return {
      decision: "ask",
      reasons: ["Strict confirmation mode asks before non-inform device actions."],
    };
  }

  if (input.actionRiskTier === "confirm") {
    return {
      decision: "ask",
      reasons: ["Confirm-tier actions require a confirmation step."],
    };
  }

  return {
    decision: "auto",
    reasons: ["No confirmation gate blocked automatic execution."],
  };
}
