import type {
  HomeAssistantServiceAction,
  NotificationDispatchResponse,
  OutboundMessageIntent,
} from "../../../../../../OpenClaw/devbox/project/openclaw-ha-blueprint-memory/packages/contracts/src/index.ts";

import type { ResolvedScenePlan, ScenePlanStep } from "./sceneResolver.ts";

export type SceneStepExecutionResult = {
  stepId: string;
  executionStatus: "executed" | "skipped" | "blocked" | "failed";
  reasons: string[];
  output?: unknown;
};

export type ExecuteScenePlanDeps = {
  dispatchHomeAssistantAction: (
    action: HomeAssistantServiceAction,
    step: ScenePlanStep,
  ) => Promise<unknown>;
  dispatchOutboundIntent: (
    intent: OutboundMessageIntent,
    step: ScenePlanStep,
  ) => Promise<NotificationDispatchResponse | unknown>;
  now?: () => string;
};

export type SceneExecutionReport = {
  sceneId: string;
  executionStatus: "executed" | "partially_executed" | "blocked" | "failed";
  summary: string;
  stepResults: SceneStepExecutionResult[];
};

function createHomeAssistantServiceAction(step: ScenePlanStep): HomeAssistantServiceAction {
  const payload = step.payload as {
    domain?: string;
    service?: string;
    entityId?: string;
    data?: Record<string, unknown>;
  };

  if (!payload.domain || !payload.service) {
    throw new Error(`Step '${step.stepId}' is missing Home Assistant domain/service metadata.`);
  }

  return {
    kind: "home_assistant_service",
    confirmRequired: step.confirmationDecision !== "auto",
    service: {
      domain: payload.domain,
      service: payload.service,
      ...(payload.entityId ? { entityId: payload.entityId } : {}),
      ...(payload.data && Object.keys(payload.data).length > 0 ? { data: payload.data } : {}),
    },
  };
}

function createOutboundIntent(
  plan: ResolvedScenePlan,
  step: ScenePlanStep,
  now: () => string,
): OutboundMessageIntent {
  const payload = step.payload as {
    messageKind?: OutboundMessageIntent["message_kind"];
    recipientScope?: OutboundMessageIntent["recipient_scope"];
    content?: string;
    source?: OutboundMessageIntent["source"];
    preferredChannels?: string[];
    fallbackChannels?: string[];
    privacyLevel?: OutboundMessageIntent["privacy_level"];
  };

  if (!payload.messageKind || !payload.recipientScope || !payload.content) {
    throw new Error(`Step '${step.stepId}' is missing outbound intent metadata.`);
  }

  return {
    intent_id: `scene:${plan.sceneId}:${step.stepId}`,
    created_at: now(),
    source: payload.source ?? "event",
    message_kind: payload.messageKind,
    recipient_scope: payload.recipientScope,
    risk_tier: step.outboundRiskTier ?? "low",
    privacy_level: payload.privacyLevel ?? "private",
    content: payload.content,
    preferred_channels: payload.preferredChannels ?? ["openclaw_channel_dm"],
    fallback_channels: payload.fallbackChannels ?? ["email"],
    recipient:
      payload.recipientScope === "self"
        ? {
            id: "user-self",
          }
        : undefined,
    known_recipient: payload.recipientScope === "self",
    quiet_hours_active: false,
    tags: [`scene:${plan.sceneId}`],
  };
}

async function executeStep(
  plan: ResolvedScenePlan,
  step: ScenePlanStep,
  deps: ExecuteScenePlanDeps,
): Promise<SceneStepExecutionResult> {
  if (step.status === "blocked") {
    return {
      stepId: step.stepId,
      executionStatus: "blocked",
      reasons: ["Step was blocked at planning time.", ...step.reasons],
    };
  }

  if (step.status === "needs_confirmation") {
    return {
      stepId: step.stepId,
      executionStatus: "skipped",
      reasons: ["Step is awaiting confirmation.", ...step.reasons],
    };
  }

  try {
    if (step.kind === "device_intent") {
      const output = await deps.dispatchHomeAssistantAction(
        createHomeAssistantServiceAction(step),
        step,
      );
      return {
        stepId: step.stepId,
        executionStatus: "executed",
        reasons: [],
        output,
      };
    }

    if (step.kind === "outbound_message") {
      const output = await deps.dispatchOutboundIntent(
        createOutboundIntent(plan, step, deps.now ?? (() => new Date().toISOString())),
        step,
      );
      return {
        stepId: step.stepId,
        executionStatus: "executed",
        reasons: [],
        output,
      };
    }

    return {
      stepId: step.stepId,
      executionStatus: "skipped",
      reasons: ["Unsupported step kind in the release skeleton executor."],
    };
  } catch (error) {
    return {
      stepId: step.stepId,
      executionStatus: "failed",
      reasons: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export async function executeScenePlan(
  plan: ResolvedScenePlan,
  deps: ExecuteScenePlanDeps,
): Promise<SceneExecutionReport> {
  const stepResults: SceneStepExecutionResult[] = [];

  for (const step of plan.steps) {
    stepResults.push(await executeStep(plan, step, deps));
  }

  const executedCount = stepResults.filter((result) => result.executionStatus === "executed").length;
  const failedCount = stepResults.filter((result) => result.executionStatus === "failed").length;

  let executionStatus: SceneExecutionReport["executionStatus"] = "blocked";
  if (failedCount > 0) {
    executionStatus = "failed";
  } else if (executedCount === stepResults.length && stepResults.length > 0) {
    executionStatus = "executed";
  } else if (executedCount > 0) {
    executionStatus = "partially_executed";
  }

  return {
    sceneId: plan.sceneId,
    executionStatus,
    summary: `Scene '${plan.sceneId}' execution produced ${executedCount} executed step(s).`,
    stepResults,
  };
}
