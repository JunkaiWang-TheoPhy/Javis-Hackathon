import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type DeviceRiskTier = "inform" | "confirm" | "side_effect";

export type DeviceCapability = {
  intent: string;
  domain: string;
  service: string;
  entityId?: string;
  data?: Record<string, unknown>;
  dataTemplate?: Record<string, unknown>;
  supportedValues?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  riskTier?: DeviceRiskTier;
};

export type SceneBinding = {
  role: string;
  priority: number;
};

export type LoadedDevice = {
  deviceId: string;
  displayName: string;
  ecosystemId: string;
  vendor: string;
  integration: string;
  connectionMode: string;
  directAdapter?: string;
  kind: string;
  area?: string;
  entityId?: string;
  aliases: string[];
  normalizedAliases: string[];
  traits: string[];
  externalIds?: Record<string, string>;
  capabilityProfiles: string[];
  capabilities: DeviceCapability[];
  sceneBindings: SceneBinding[];
  stateHints: {
    presenceSensitive?: boolean;
    quietHoursRelevant?: boolean;
  };
};

export type DevicesRegistry = {
  schemaVersion: string;
  registryName?: string;
  devices: LoadedDevice[];
};

type RawDevicesRegistry = {
  schemaVersion: string;
  registryName?: string;
  devices?: Array<{
    id: string;
    displayName?: string;
    ecosystemId: string;
    vendor?: string;
    integration?: string;
    connectionMode?: string;
    directAdapter?: string;
    kind: string;
    area?: string;
    entityId?: string;
    aliases?: string[];
    traits?: string[];
    externalIds?: Record<string, string>;
    capabilityProfiles?: string[];
    capabilities?: DeviceCapability[];
    sceneBindings?: SceneBinding[];
    stateHints?: {
      presenceSensitive?: boolean;
      quietHoursRelevant?: boolean;
    };
  }>;
};

const DEFAULT_REGISTRY_URL = new URL("../../../registry/devices.example.json", import.meta.url);

function normalizeAlias(value: string) {
  return value.trim().toLowerCase();
}

export function findDevicesByRole(registry: DevicesRegistry, role: string) {
  return registry.devices
    .filter((device) => device.sceneBindings.some((binding) => binding.role === role))
    .sort((left, right) => {
      const leftPriority = left.sceneBindings.find((binding) => binding.role === role)?.priority ?? 0;
      const rightPriority = right.sceneBindings.find((binding) => binding.role === role)?.priority ?? 0;
      return rightPriority - leftPriority;
    });
}

export async function loadDevicesRegistry(pathOrUrl?: string | URL): Promise<DevicesRegistry> {
  const resolvedPath = typeof pathOrUrl === "string"
    ? pathOrUrl
    : fileURLToPath(pathOrUrl ?? DEFAULT_REGISTRY_URL);

  const raw = JSON.parse(await readFile(resolvedPath, "utf8")) as RawDevicesRegistry;

  return {
    schemaVersion: raw.schemaVersion,
    registryName: raw.registryName,
    devices: (raw.devices ?? []).map((device) => ({
      deviceId: device.id,
      displayName: device.displayName ?? device.id,
      ecosystemId: device.ecosystemId,
      vendor: device.vendor ?? "unknown",
      integration: device.integration ?? "home_assistant",
      connectionMode: device.connectionMode ?? device.integration ?? "home_assistant",
      directAdapter: device.directAdapter,
      kind: device.kind,
      area: device.area,
      entityId: device.entityId,
      aliases: device.aliases ?? [],
      normalizedAliases: (device.aliases ?? []).map(normalizeAlias),
      traits: device.traits ?? [],
      externalIds: device.externalIds,
      capabilityProfiles: device.capabilityProfiles ?? [],
      capabilities: device.capabilities ?? [],
      sceneBindings: device.sceneBindings ?? [],
      stateHints: device.stateHints ?? {},
    })),
  };
}
