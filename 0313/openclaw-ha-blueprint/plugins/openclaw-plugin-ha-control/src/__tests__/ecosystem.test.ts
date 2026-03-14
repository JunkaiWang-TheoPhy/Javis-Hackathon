import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEcosystemRegistry,
  listCapabilities,
  resolveIntentExecution,
  type HaControlConfig,
} from "../ecosystem.ts";

function buildConfig(): HaControlConfig {
  return {
    baseUrl: "http://homeassistant:8123",
    token: "test-token",
    ecosystems: [
      {
        id: "xiaomi-home",
        vendor: "xiaomi",
        integration: "home_assistant",
        connectionMode: "hybrid",
        directAdapter: "xiaomi-miot",
        region: "cn",
        devices: [
          {
            id: "mi-bedroom-fan",
            entityId: "fan.mi_bedroom",
            kind: "fan",
            area: "bedroom",
            aliases: ["bedroom fan", "mi fan", "xiaomi fan"],
            capabilities: [
              {
                intent: "turn_on",
                domain: "fan",
                service: "turn_on",
                riskTier: "side_effect",
              },
              {
                intent: "turn_off",
                domain: "fan",
                service: "turn_off",
                riskTier: "side_effect",
              },
              {
                intent: "set_percentage",
                domain: "fan",
                service: "set_percentage",
                dataTemplate: {
                  percentage: "{{value}}",
                },
                riskTier: "side_effect",
                requiresConfirmation: true,
              },
            ],
          },
        ],
      },
      {
        id: "matter-home",
        vendor: "matter",
        integration: "home_assistant",
        connectionMode: "home_assistant",
        devices: [
          {
            id: "living-room-lamp",
            entityId: "light.living_room_lamp",
            kind: "light",
            area: "living_room",
            aliases: ["living room lamp", "matter lamp"],
            capabilities: [
              {
                intent: "turn_on",
                domain: "light",
                service: "turn_on",
                riskTier: "side_effect",
              },
            ],
          },
        ],
      },
      {
        id: "hue-home",
        vendor: "hue",
        integration: "home_assistant",
        connectionMode: "bridge",
        directAdapter: "hue-local",
        devices: [
          {
            id: "hue-living-room",
            entityId: "light.hue_living_room",
            kind: "light",
            area: "living_room",
            aliases: ["hue light", "living room hue"],
            externalIds: {
              hueLightId: "7",
              hueBridgeId: "bridge-1",
            },
            capabilities: [
              {
                intent: "turn_on",
                domain: "light",
                service: "turn_on",
                riskTier: "side_effect",
              },
            ],
          },
        ],
      },
      {
        id: "homekit-home",
        vendor: "homekit",
        integration: "home_assistant",
        connectionMode: "bridge",
        devices: [
          {
            id: "homekit-blinds",
            entityId: "cover.homekit_blinds",
            kind: "cover",
            area: "bedroom",
            aliases: ["homekit blinds", "bedroom blinds"],
            externalIds: {
              accessoryId: "hk-acc-1",
            },
            capabilities: [
              {
                intent: "open",
                domain: "cover",
                service: "open_cover",
                riskTier: "side_effect",
              },
            ],
          },
        ],
      },
      {
        id: "google-nest-home",
        vendor: "google",
        integration: "home_assistant",
        connectionMode: "cloud_api",
        directAdapter: "google-home",
        devices: [
          {
            id: "nest-thermostat",
            entityId: "climate.nest_thermostat",
            kind: "climate",
            area: "living_room",
            aliases: ["nest thermostat", "google thermostat"],
            externalIds: {
              googleDeviceId: "nest-device-1",
            },
            capabilities: [
              {
                intent: "set_temperature",
                domain: "climate",
                service: "set_temperature",
                dataTemplate: {
                  temperature: "{{value}}",
                },
                requiresConfirmation: true,
                riskTier: "side_effect",
              },
            ],
          },
        ],
      },
    ],
  };
}

test("listCapabilities filters configured devices by ecosystem and area", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  const capabilities = listCapabilities(registry, {
    ecosystem: "xiaomi-home",
    area: "bedroom",
  });

  assert.equal(capabilities.length, 1);
  assert.equal(capabilities[0]?.ecosystemId, "xiaomi-home");
  assert.equal(capabilities[0]?.vendor, "xiaomi");
  assert.equal(capabilities[0]?.deviceId, "mi-bedroom-fan");
  assert.equal(capabilities[0]?.aliases.includes("xiaomi fan"), true);
  assert.equal(capabilities[0]?.connectionMode, "hybrid");
  assert.equal(capabilities[0]?.directAdapter, "xiaomi-miot");
});

test("resolveIntentExecution matches aliases and injects the device entity_id", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  const resolved = resolveIntentExecution(registry, {
    alias: "xiaomi fan",
    intent: "turn_on",
    confirmed: true,
  });

  assert.deepEqual(resolved, {
    ecosystemId: "xiaomi-home",
    vendor: "xiaomi",
    deviceId: "mi-bedroom-fan",
    requiresConfirmation: false,
    riskTier: "side_effect",
    serviceCall: {
      domain: "fan",
      service: "turn_on",
      data: {
        entity_id: "fan.mi_bedroom",
      },
    },
  });
});

test("resolveIntentExecution blocks confirmation-gated capabilities until confirmed", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  assert.throws(
    () =>
      resolveIntentExecution(registry, {
        deviceId: "mi-bedroom-fan",
        intent: "set_percentage",
        value: 75,
      }),
    /requires confirmation/i,
  );
});

test("resolveIntentExecution expands template values when confirmed", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  const resolved = resolveIntentExecution(registry, {
    deviceId: "mi-bedroom-fan",
    intent: "set_percentage",
    value: 75,
    confirmed: true,
  });

  assert.deepEqual(resolved.serviceCall, {
    domain: "fan",
    service: "set_percentage",
    data: {
      entity_id: "fan.mi_bedroom",
      percentage: 75,
    },
  });
});

test("resolveIntentExecution rejects unknown aliases", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  assert.throws(
    () =>
      resolveIntentExecution(registry, {
        alias: "garage mystery device",
        intent: "turn_on",
        confirmed: true,
      }),
    /No configured device matches/,
  );
});

test("listCapabilities exposes future-compatible metadata for Hue and Google/Nest", () => {
  const registry = buildEcosystemRegistry(buildConfig());

  const bridgeCapabilities = listCapabilities(registry, {
    connectionMode: "bridge",
  });
  const googleCapabilities = listCapabilities(registry, {
    vendor: "google",
  });

  const hue = bridgeCapabilities.find((item) => item.ecosystemId === "hue-home");
  const homekit = bridgeCapabilities.find((item) => item.ecosystemId === "homekit-home");

  assert.equal(hue?.directAdapter, "hue-local");
  assert.deepEqual(hue?.externalIds, {
    hueLightId: "7",
    hueBridgeId: "bridge-1",
  });
  assert.equal(homekit?.directAdapter, undefined);
  assert.equal(googleCapabilities[0]?.connectionMode, "cloud_api");
  assert.equal(googleCapabilities[0]?.directAdapter, "google-home");
  assert.deepEqual(googleCapabilities[0]?.externalIds, {
    googleDeviceId: "nest-device-1",
  });
});
