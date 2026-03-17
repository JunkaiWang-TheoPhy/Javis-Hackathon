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

test("sceneDefinitions exports arrival_cooling", async () => {
  const { getSceneDefinition } = await import(definitionsModuleUrl);

  const definition = getSceneDefinition("arrival_cooling");
  assert.ok(definition);
  assert.equal(definition.id, "arrival_cooling");
  assert.equal(definition.selectors.some((item: { role: string }) => item.role === "cooling.primary_climate"), true);
});

test("resolveScenePlan returns a ready plan for arrival_cooling", async () => {
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
      requiresHumanApprovalDefault: true,
    },
  });

  assert.equal(plan.planStatus, "ready");
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
