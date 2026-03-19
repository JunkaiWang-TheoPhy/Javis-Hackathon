import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(process.cwd(), "..", "..", "..", "..");
const loaderModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/registry/loadDevicesRegistry.ts",
  ),
).href;
const resolverModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/scenes/sceneResolver.ts",
  ),
).href;
const riskPolicyModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/policies/riskPolicy.ts",
  ),
).href;
const outboundPolicyModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/policies/outboundPolicyAdapter.ts",
  ),
).href;
const executorModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/scenes/scenePlanExecutor.ts",
  ),
).href;

test("riskPolicy preserves explicit capability risk for release registry devices", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { evaluateActionRisk } = await import(riskPolicyModuleUrl);

  const registry = await loadDevicesRegistry();
  const lock = registry.devices.find((device: { deviceId: string }) => device.deviceId === "front-door-lock");
  assert.ok(lock);

  const unlockCapability = lock.capabilities.find((capability: { intent: string }) => capability.intent === "unlock");
  assert.ok(unlockCapability);

  const assessment = evaluateActionRisk({
    device: lock,
    capability: unlockCapability,
    sceneId: "security_check",
    context: {},
  });

  assert.equal(assessment.riskTier, "confirm");
  assert.equal(assessment.reasons.some((reason: string) => /explicit risk tier/i.test(reason)), true);
});

test("outboundPolicyAdapter allows self alerts but asks for caregiver escalation", async () => {
  const { evaluateOutboundStep } = await import(outboundPolicyModuleUrl);

  const selfAlert = evaluateOutboundStep({
    messageKind: "alert",
    recipientScope: "self",
    privacyLevel: "private",
  });
  assert.equal(selfAlert.decision, "allow");

  const caregiverEscalation = evaluateOutboundStep({
    messageKind: "escalation",
    recipientScope: "caregiver",
    privacyLevel: "sensitive",
  });
  assert.equal(caregiverEscalation.decision, "ask");
});

test("resolveScenePlan uses policy hooks to require confirmation for arrival_cooling device steps", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);

  const registry = await loadDevicesRegistry();
  const plan = resolveScenePlan({
    sceneId: "arrival_cooling",
    context: {
      atHome: true,
      postWorkout: true,
      heartRateBpm: 118,
      triggeredBy: "event",
      targetTemperatureC: 23,
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: true,
    },
  });

  assert.equal(plan.planStatus, "needs_confirmation");
  assert.equal(plan.requiredConfirmations.length > 0, true);

  const climateStep = plan.steps.find((step: { role?: string; kind: string }) =>
    step.kind === "device_intent" && step.role === "cooling.primary_climate"
  );
  assert.ok(climateStep);
  assert.equal(climateStep.status, "needs_confirmation");

  const outboundStep = plan.steps.find((step: { kind: string }) => step.kind === "outbound_message");
  assert.ok(outboundStep);
  assert.equal(outboundStep.outboundDecision, "allow");
});

test("scenePlanExecutor executes planned outbound steps and skips steps awaiting confirmation", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);
  const { executeScenePlan } = await import(executorModuleUrl);

  const registry = await loadDevicesRegistry();
  const plan = resolveScenePlan({
    sceneId: "arrival_cooling",
    context: {
      atHome: true,
      postWorkout: true,
      heartRateBpm: 118,
      triggeredBy: "event",
      targetTemperatureC: 23,
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: true,
    },
  });

  const deviceCalls: unknown[] = [];
  const outboundCalls: unknown[] = [];

  const report = await executeScenePlan(plan, {
    dispatchHomeAssistantAction: async (payload: unknown) => {
      deviceCalls.push(payload);
      return { ok: true };
    },
    dispatchOutboundIntent: async (payload: unknown) => {
      outboundCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(deviceCalls.length, 0);
  assert.equal(outboundCalls.length, 1);
  assert.equal(report.executionStatus, "partially_executed");
});

test("scenePlanExecutor translates quiet_evening into Home Assistant service actions and a notification-router outbound intent", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);
  const { executeScenePlan } = await import(executorModuleUrl);

  const registry = await loadDevicesRegistry();
  const plan = resolveScenePlan({
    sceneId: "quiet_evening",
    context: {
      quietHours: true,
      currentHour: 23,
      triggeredBy: "cron",
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: false,
    },
  });

  const haActions: unknown[] = [];
  const outboundIntents: unknown[] = [];

  const report = await executeScenePlan(plan, {
    dispatchHomeAssistantAction: async (action: unknown) => {
      haActions.push(action);
      return { ok: true };
    },
    dispatchOutboundIntent: async (intent: unknown) => {
      outboundIntents.push(intent);
      return { ok: true };
    },
  });

  assert.equal(report.executionStatus, "executed");
  assert.equal(haActions.length, 3);
  assert.equal(outboundIntents.length, 1);

  assert.deepEqual(haActions[0], {
    kind: "home_assistant_service",
    confirmRequired: false,
    service: {
      domain: "scene",
      service: "turn_on",
      entityId: "scene.hue_arrival",
    },
  });

  assert.equal((outboundIntents[0] as { source: string }).source, "cron");
  assert.equal((outboundIntents[0] as { message_kind: string }).message_kind, "summary");
  assert.equal((outboundIntents[0] as { recipient_scope: string }).recipient_scope, "self");
  assert.equal(
    ((outboundIntents[0] as { preferred_channels?: string[] }).preferred_channels ?? [])[0],
    "openclaw_channel_dm",
  );
});

test("scenePlanExecutor materializes templated Home Assistant data for post_workout_recovery", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);
  const { executeScenePlan } = await import(executorModuleUrl);

  const registry = await loadDevicesRegistry();
  const plan = resolveScenePlan({
    sceneId: "post_workout_recovery",
    context: {
      atHome: true,
      postWorkout: true,
      triggeredBy: "event",
      targetTemperatureC: 22,
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: false,
    },
  });

  const haActions: unknown[] = [];

  await executeScenePlan(plan, {
    dispatchHomeAssistantAction: async (action: unknown) => {
      haActions.push(action);
      return { ok: true };
    },
    dispatchOutboundIntent: async () => ({ ok: true }),
  });

  assert.equal(
    haActions.some((action) =>
      JSON.stringify(action) === JSON.stringify({
        kind: "home_assistant_service",
        confirmRequired: false,
        service: {
          domain: "media_player",
          service: "play_media",
          entityId: "media_player.living_room_speaker",
          data: {
            media_content_id: "recovery_playlist",
            media_content_type: "music",
          },
        },
      })
    ),
    true,
  );
});
