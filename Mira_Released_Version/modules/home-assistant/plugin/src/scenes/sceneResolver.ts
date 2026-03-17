import {
  findDevicesByRole,
  type DeviceCapability,
  type DevicesRegistry,
  type LoadedDevice,
} from "../registry/loadDevicesRegistry.ts";
import { getSceneDefinition, type SceneDefinition, type SceneSelector } from "./sceneDefinitions.ts";

export type SceneResolveInput = {
  sceneId: string;
  context: {
    atHome?: boolean;
    postWorkout?: boolean;
    heartRateBpm?: number;
    quietHours?: boolean;
    currentHour?: number;
    userPresentArea?: string;
    triggeredBy?: "manual" | "heartbeat" | "cron" | "event";
    sourceEventId?: string;
    targetTemperatureC?: number;
  };
  registry: DevicesRegistry;
  stateSnapshot: Record<string, unknown>;
  policyContext: {
    requiresHumanApprovalDefault: boolean;
    outboundPolicyPath?: string;
    confirmationMode?: "normal" | "strict";
  };
};

export type ScenePlanStep = {
  stepId: string;
  kind: "device_intent" | "outbound_message";
  role?: string;
  targetId?: string;
  status: "planned" | "needs_confirmation" | "blocked";
  actionRiskTier?: "inform" | "confirm" | "side_effect";
  outboundRiskTier?: "low" | "medium" | "high";
  confirmationDecision?: "auto" | "ask" | "double_confirm" | "block";
  outboundDecision?: "allow" | "ask" | "block";
  payload: Record<string, unknown>;
  reasons: string[];
};

export type ResolvedScenePlan = {
  sceneId: string;
  planStatus: "ready" | "needs_confirmation" | "partially_blocked" | "blocked";
  summary: string;
  reasons: string[];
  requiredConfirmations: string[];
  steps: ScenePlanStep[];
};

function checkPreconditions(definition: SceneDefinition, context: SceneResolveInput["context"]) {
  for (const condition of definition.preconditions) {
    const value = context[condition.field as keyof SceneResolveInput["context"]];
    if (Object.prototype.hasOwnProperty.call(condition, "equals") && value !== condition.equals) {
      return `Precondition '${condition.field}' must equal '${String(condition.equals)}'.`;
    }
    if (typeof condition.min === "number" && typeof value === "number" && value < condition.min) {
      return `Precondition '${condition.field}' must be >= ${condition.min}.`;
    }
  }
  return null;
}

function selectDevices(registry: DevicesRegistry, selector: SceneSelector) {
  const devices = findDevicesByRole(registry, selector.role);
  if (!selector.maxCount || devices.length <= selector.maxCount) {
    return devices;
  }
  return devices.slice(0, selector.maxCount);
}

function resolveValueFromContext(
  input: SceneResolveInput,
  template: { fixedPayload?: Record<string, unknown>; valueFromContext?: string; fallbackValue?: unknown },
) {
  const payload = { ...(template.fixedPayload ?? {}) };

  if (template.valueFromContext) {
    const contextValue = input.context[template.valueFromContext as keyof SceneResolveInput["context"]];
    payload.value = contextValue ?? template.fallbackValue ?? null;
  }

  return payload;
}

function findCapability(device: LoadedDevice, intent: string): DeviceCapability | null {
  return device.capabilities.find((capability) => capability.intent === intent) ?? null;
}

export function resolveScenePlan(input: SceneResolveInput): ResolvedScenePlan {
  const definition = getSceneDefinition(input.sceneId);
  if (!definition) {
    return {
      sceneId: input.sceneId,
      planStatus: "blocked",
      summary: "Scene definition not found.",
      reasons: [`Scene '${input.sceneId}' does not exist.`],
      requiredConfirmations: [],
      steps: [],
    };
  }

  const preconditionFailure = checkPreconditions(definition, input.context);
  if (preconditionFailure) {
    return {
      sceneId: input.sceneId,
      planStatus: "blocked",
      summary: "Scene preconditions are not satisfied.",
      reasons: [preconditionFailure],
      requiredConfirmations: [],
      steps: [],
    };
  }

  const reasons: string[] = [];
  const requiredConfirmations: string[] = [];
  const steps: ScenePlanStep[] = [];

  for (const selector of definition.selectors) {
    const selectedDevices = selectDevices(input.registry, selector);
    if (selector.required && selectedDevices.length === 0) {
      reasons.push(`Missing required scene role '${selector.role}'.`);
      continue;
    }

    const templates = definition.actionTemplates.filter((template) => template.role === selector.role);
    for (const device of selectedDevices) {
      for (const template of templates) {
        const capability = findCapability(device, template.intent);
        if (!capability) {
          continue;
        }

        const confirmationDecision = capability.requiresConfirmation || input.policyContext.requiresHumanApprovalDefault
          ? "ask"
          : "auto";
        if (confirmationDecision !== "auto") {
          requiredConfirmations.push(`${device.deviceId}:${template.intent}`);
        }

        steps.push({
          stepId: `${selector.role}:${device.deviceId}:${template.intent}`,
          kind: "device_intent",
          role: selector.role,
          targetId: device.deviceId,
          status: "planned",
          actionRiskTier: capability.riskTier ?? "side_effect",
          confirmationDecision,
          payload: {
            deviceId: device.deviceId,
            displayName: device.displayName,
            entityId: capability.entityId ?? device.entityId,
            intent: template.intent,
            domain: capability.domain,
            service: capability.service,
            data: resolveValueFromContext(input, template),
          },
          reasons: [],
        });
      }
    }
  }

  for (const notification of definition.optionalNotifications ?? []) {
    steps.push({
      stepId: `notify:${notification.message_kind}:${notification.recipient_scope}`,
      kind: "outbound_message",
      status: "planned",
      outboundRiskTier: notification.message_kind === "alert" ? "medium" : "low",
      outboundDecision: notification.recipient_scope === "self" ? "allow" : "ask",
      payload: {
        messageKind: notification.message_kind,
        recipientScope: notification.recipient_scope,
        content: notification.contentTemplate,
      },
      reasons: [],
    });
  }

  if (reasons.length > 0) {
    return {
      sceneId: input.sceneId,
      planStatus: "blocked",
      summary: "Scene could not be resolved because required roles are missing.",
      reasons,
      requiredConfirmations: [],
      steps,
    };
  }

  return {
    sceneId: input.sceneId,
    planStatus: "ready",
    summary: `Scene '${definition.id}' resolved into ${steps.length} planned steps.`,
    reasons: [],
    requiredConfirmations,
    steps,
  };
}
