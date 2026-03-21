import type {
  DeviceCapability,
  DeviceRiskTier,
  LoadedDevice,
} from "../registry/loadDevicesRegistry.ts";

export type ActionRiskAssessment = {
  riskTier: DeviceRiskTier;
  reasons: string[];
};

export type EvaluateActionRiskInput = {
  device: LoadedDevice;
  capability: DeviceCapability;
  sceneId: string;
  context: Record<string, unknown>;
};

export function evaluateActionRisk(
  input: EvaluateActionRiskInput,
): ActionRiskAssessment {
  if (input.capability.riskTier) {
    return {
      riskTier: input.capability.riskTier,
      reasons: ["Used explicit risk tier from capability metadata."],
    };
  }

  if (input.device.kind === "lock" && input.capability.intent === "unlock") {
    return {
      riskTier: "confirm",
      reasons: ["Unlocking a security device defaults to confirm risk."],
    };
  }

  if (input.capability.requiresConfirmation) {
    return {
      riskTier: "confirm",
      reasons: ["Capability metadata requires confirmation."],
    };
  }

  return {
    riskTier: "side_effect",
    reasons: ["Defaulted to side_effect for a device action."],
  };
}
