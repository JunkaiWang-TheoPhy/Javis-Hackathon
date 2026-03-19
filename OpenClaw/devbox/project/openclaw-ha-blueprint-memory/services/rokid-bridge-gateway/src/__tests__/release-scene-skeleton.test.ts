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
const definitionsModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/scenes/sceneDefinitions.ts",
  ),
).href;
const resolverModuleUrl = pathToFileURL(
  resolve(
    repoRoot,
    "Mira_Released_Version/modules/home-assistant/plugin/src/scenes/sceneResolver.ts",
  ),
).href;

test("loadDevicesRegistry normalizes the example registry", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);

  const registry = await loadDevicesRegistry();
  assert.equal(registry.devices.length, 5);

  const fan = registry.devices.find((device: { deviceId: string }) => device.deviceId === "mi-bedroom-fan");
  assert.ok(fan);
  assert.equal(fan.area, "bedroom");
  assert.equal(fan.aliases.includes("xiaomi fan"), true);
  assert.equal(
    fan.sceneBindings.some((binding: { role: string }) => binding.role === "cooling.primary_fan"),
    true,
  );
});

test("sceneDefinitions exports arrival_cooling and the additional release scenes", async () => {
  const { getSceneDefinition, listSceneDefinitions } = await import(definitionsModuleUrl);

  const definition = getSceneDefinition("arrival_cooling");
  assert.ok(definition);
  assert.equal(definition.id, "arrival_cooling");
  assert.equal(definition.selectors.some((item: { role: string }) => item.role === "cooling.primary_climate"), true);

  const sceneIds = listSceneDefinitions().map((item: { id: string }) => item.id);
  assert.deepEqual(sceneIds, [
    "arrival_cooling",
    "post_workout_recovery",
    "quiet_evening",
    "high_heart_rate_response",
  ]);
});

test("resolveScenePlan returns ready for quiet_evening when quiet-hours preconditions are satisfied", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);

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

  assert.equal(plan.planStatus, "ready");
  assert.equal(plan.steps.some((step: { role?: string }) => step.role === "lighting.quiet_evening"), true);
  assert.equal(plan.steps.some((step: { role?: string }) => step.role === "security.entry_lock"), true);
  assert.equal(
    plan.steps.some((step: { kind: string; outboundDecision?: string }) =>
      step.kind === "outbound_message" && step.outboundDecision === "allow"
    ),
    true,
  );
});

test("resolveScenePlan returns needs_confirmation for high_heart_rate_response because cooling temperature changes require confirmation", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);

  const registry = await loadDevicesRegistry();
  const plan = resolveScenePlan({
    sceneId: "high_heart_rate_response",
    context: {
      atHome: true,
      heartRateBpm: 121,
      triggeredBy: "event",
      targetTemperatureC: 21,
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: false,
    },
  });

  assert.equal(plan.planStatus, "needs_confirmation");
  assert.equal(
    plan.steps.some((step: { role?: string; status: string }) =>
      step.role === "cooling.primary_climate" && step.status === "needs_confirmation"
    ),
    true,
  );
  assert.equal(
    plan.steps.some((step: { kind: string; outboundDecision?: string }) =>
      step.kind === "outbound_message" && step.outboundDecision === "allow"
    ),
    true,
  );
});

test("resolveScenePlan returns needs_confirmation for arrival_cooling when a capability requires confirmation", async () => {
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
    },
    registry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: false,
    },
  });

  assert.equal(plan.planStatus, "needs_confirmation");
  assert.equal(plan.steps.some((step: { role?: string }) => step.role === "cooling.primary_fan"), true);
  assert.equal(plan.steps.some((step: { role?: string }) => step.role === "cooling.primary_climate"), true);
});

test("resolveScenePlan returns blocked when a required role is missing", async () => {
  const { loadDevicesRegistry } = await import(loaderModuleUrl);
  const { resolveScenePlan } = await import(resolverModuleUrl);

  const registry = await loadDevicesRegistry();
  const filteredRegistry = {
    ...registry,
    devices: registry.devices.filter((device: { deviceId: string }) => device.deviceId !== "bedroom-climate"),
  };

  const plan = resolveScenePlan({
    sceneId: "arrival_cooling",
    context: {
      atHome: true,
      postWorkout: true,
      heartRateBpm: 118,
      triggeredBy: "event",
    },
    registry: filteredRegistry,
    stateSnapshot: {},
    policyContext: {
      requiresHumanApprovalDefault: true,
    },
  });

  assert.equal(plan.planStatus, "blocked");
  assert.equal(plan.reasons.some((reason: string) => /cooling\.primary_climate/.test(reason)), true);
});
