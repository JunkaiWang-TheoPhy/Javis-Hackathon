import {
  findDevicesByRole,
  type DeviceCapability,
  type DevicesRegistry,
  type LoadedDevice,
} from "../registry/loadDevicesRegistry.ts";
import { evaluateConfirmationDecision } from "../policies/confirmationPolicy.ts";
import { evaluateOutboundStep } from "../policies/outboundPolicyAdapter.ts";
import { evaluateActionRisk } from "../policies/riskPolicy.ts";
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

function deriveStepStatusFromConfirmation(
  decision: "auto" | "ask" | "double_confirm" | "block",
): ScenePlanStep["status"] {
  if (decision === "auto") {
    return "planned";
  }
  if (decision === "block") {
    return "blocked";
  }
  return "needs_confirmation";
}

function deriveStepStatusFromOutboundDecision(
  decision: "allow" | "ask" | "block",
): ScenePlanStep["status"] {
  if (decision === "allow") {
    return "planned";
  }
  if (decision === "block") {
    return "blocked";
  }
  return "needs_confirmation";
}

function derivePlanStatus(steps: ScenePlanStep[], hasMissingRequiredRoles: boolean) {
  if (hasMissingRequiredRoles) {
    return "blocked" as const;
  }

  const hasBlocked = steps.some((step) => step.status === "blocked");
  const hasConfirmation = steps.some((step) => step.status === "needs_confirmation");
  const hasPlanned = steps.some((step) => step.status === "planned");

  if (hasBlocked && hasPlanned) {
    return "partially_blocked" as const;
  }
  if (hasBlocked && !hasPlanned) {
    return "blocked" as const;
  }
  if (hasConfirmation) {
    return "needs_confirmation" as const;
  }
  return "ready" as const;
}

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

function materializeCapabilityData(
  capability: DeviceCapability,
  resolvedTemplatePayload: Record<string, unknown>,
) {
  const source = capability.dataTemplate ?? capability.data ?? resolvedTemplatePayload;
  const materializedEntries = Object.entries(source ?? {}).map(([key, value]) => {
    if (value === "{{value}}") {
      return [key, resolvedTemplatePayload.value ?? null];
    }
    return [key, value];
  });

  const materialized = Object.fromEntries(materializedEntries);
  return Object.keys(materialized).length > 0 ? materialized : undefined;
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
        const resolvedTemplatePayload = resolveValueFromContext(input, template);

        const risk = evaluateActionRisk({
          device,
          capability,
          sceneId: definition.id,
          context: input.context,
        });
        const confirmation = evaluateConfirmationDecision({
          actionRiskTier: risk.riskTier,
          capabilityRequiresConfirmation: capability.requiresConfirmation,
          requiresHumanApprovalDefault: input.policyContext.requiresHumanApprovalDefault,
          confirmationMode: input.policyContext.confirmationMode,
          triggeredBy: input.context.triggeredBy,
        });
        const stepStatus = deriveStepStatusFromConfirmation(confirmation.decision);
        if (stepStatus === "needs_confirmation") {
          requiredConfirmations.push(`${device.deviceId}:${template.intent}`);
        }

        steps.push({
          stepId: `${selector.role}:${device.deviceId}:${template.intent}`,
          kind: "device_intent",
          role: selector.role,
          targetId: device.deviceId,
          status: stepStatus,
          actionRiskTier: risk.riskTier,
          confirmationDecision: confirmation.decision,
          payload: {
            deviceId: device.deviceId,
            displayName: device.displayName,
            entityId: capability.entityId ?? device.entityId,
            intent: template.intent,
            domain: capability.domain,
            service: capability.service,
            data: materializeCapabilityData(capability, resolvedTemplatePayload),
          },
          reasons: [...risk.reasons, ...confirmation.reasons],
        });
      }
    }
  }

  for (const notification of definition.optionalNotifications ?? []) {
    const outbound = evaluateOutboundStep({
      messageKind: notification.message_kind,
      recipientScope: notification.recipient_scope,
      privacyLevel: "private",
      knownRecipient: notification.recipient_scope === "self",
      quietHoursActive: input.context.quietHours,
    });
    const stepStatus = deriveStepStatusFromOutboundDecision(outbound.decision);
    if (stepStatus === "needs_confirmation") {
      requiredConfirmations.push(`notify:${notification.message_kind}:${notification.recipient_scope}`);
    }

    steps.push({
      stepId: `notify:${notification.message_kind}:${notification.recipient_scope}`,
      kind: "outbound_message",
      status: stepStatus,
      outboundRiskTier: notification.message_kind === "alert" ? "medium" : "low",
      outboundDecision: outbound.decision,
      payload: {
        messageKind: notification.message_kind,
        recipientScope: notification.recipient_scope,
        content: notification.contentTemplate,
        source: input.context.triggeredBy ?? "event",
        preferredChannels: ["openclaw_channel_dm"],
        fallbackChannels: ["email"],
        privacyLevel: "private",
      },
      reasons: outbound.reasons,
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
    planStatus: derivePlanStatus(steps, false),
    summary: `Scene '${definition.id}' resolved into ${steps.length} plan step(s).`,
    reasons: [],
    requiredConfirmations,
    steps,
  };
}
