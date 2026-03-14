export type RiskTier = "inform" | "confirm" | "side_effect";

export type HomeCapabilityConfig = {
  intent: string;
  domain: string;
  service: string;
  entityId?: string;
  data?: Record<string, unknown>;
  dataTemplate?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  riskTier?: RiskTier;
};

export type HomeDeviceConfig = {
  id: string;
  entityId?: string;
  kind: string;
  area?: string;
  aliases?: string[];
  externalIds?: Record<string, string>;
  capabilities?: HomeCapabilityConfig[];
};

export type HomeEcosystemConfig = {
  id: string;
  vendor: string;
  integration?: "home_assistant" | string;
  connectionMode?: "home_assistant" | "bridge" | "cloud_api" | "hybrid" | string;
  directAdapter?: string;
  region?: string;
  devices?: HomeDeviceConfig[];
};

export type HaControlConfig = {
  baseUrl: string;
  token: string;
  webhookSecret?: string;
  presenceEntityId?: string;
  coolingSceneEntityId?: string;
  fanEntityId?: string;
  climateEntityId?: string;
  targetTemperatureC?: number;
  climateHvacMode?: string;
  notification?: {
    domain?: string;
    service?: string;
    title?: string;
    extraData?: Record<string, unknown>;
  };
  mechanicalSwitch?: {
    thirdRealityEntityId?: string;
    switchBotEntityId?: string;
    onHighHeartRate?: boolean;
    onArrivalCooling?: boolean;
  };
  mirrorEntities?: {
    latestHeartRate?: string;
    recentHighHr?: string;
    presence?: string;
  };
  policies?: {
    highHrThresholdBpm?: number;
    highHrSustainSec?: number;
    recentHrWindowSec?: number;
    dedupeWindowSec?: number;
    autoCoolOnHighHrAtHome?: boolean;
  };
  ecosystems?: HomeEcosystemConfig[];
};

type IndexedDevice = {
  ecosystemId: string;
  vendor: string;
  region?: string;
  integration: string;
  connectionMode?: string;
  directAdapter?: string;
  deviceId: string;
  entityId?: string;
  area?: string;
  kind: string;
  aliases: string[];
  externalIds?: Record<string, string>;
  capabilities: HomeCapabilityConfig[];
};

export type EcosystemRegistry = {
  devices: IndexedDevice[];
};

export type CapabilityFilters = {
  ecosystem?: string;
  vendor?: string;
  area?: string;
  kind?: string;
  connectionMode?: string;
};

export type CapabilitySummary = {
  ecosystemId: string;
  vendor: string;
  region?: string;
  integration: string;
  connectionMode?: string;
  directAdapter?: string;
  deviceId: string;
  entityId?: string;
  area?: string;
  kind: string;
  aliases: string[];
  externalIds?: Record<string, string>;
  intents: string[];
};

export type IntentExecutionRequest = {
  deviceId?: string;
  alias?: string;
  intent: string;
  value?: unknown;
  confirmed?: boolean;
};

export type IntentExecution = {
  ecosystemId: string;
  vendor: string;
  deviceId: string;
  requiresConfirmation: boolean;
  riskTier: RiskTier;
  serviceCall: {
    domain: string;
    service: string;
    data: Record<string, unknown>;
  };
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function applyTemplateValue(template: unknown, value: unknown): unknown {
  if (template === "{{value}}") {
    return value;
  }
  if (Array.isArray(template)) {
    return template.map((item) => applyTemplateValue(item, value));
  }
  if (template && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template as Record<string, unknown>).map(([key, item]) => [
        key,
        applyTemplateValue(item, value),
      ]),
    );
  }
  if (typeof template === "string") {
    return template.replaceAll("{{value}}", String(value ?? ""));
  }
  return template;
}

function deviceMatchesFilters(device: IndexedDevice, filters: CapabilityFilters): boolean {
  if (filters.ecosystem && device.ecosystemId !== filters.ecosystem) {
    return false;
  }
  if (filters.vendor && device.vendor !== filters.vendor) {
    return false;
  }
  if (filters.area && device.area !== filters.area) {
    return false;
  }
  if (filters.kind && device.kind !== filters.kind) {
    return false;
  }
  if (filters.connectionMode && device.connectionMode !== filters.connectionMode) {
    return false;
  }
  return true;
}

function findDevice(registry: EcosystemRegistry, request: IntentExecutionRequest): IndexedDevice {
  if (request.deviceId) {
    const direct = registry.devices.find((device) => device.deviceId === request.deviceId);
    if (direct) {
      return direct;
    }
  }

  if (request.alias) {
    const normalizedAlias = normalizeToken(request.alias);
    const byAlias = registry.devices.find((device) =>
      device.aliases.some((alias) => normalizeToken(alias) === normalizedAlias),
    );
    if (byAlias) {
      return byAlias;
    }
  }

  throw new Error(
    `No configured device matches '${request.deviceId ?? request.alias ?? "unknown"}'.`,
  );
}

export function buildEcosystemRegistry(cfg: HaControlConfig): EcosystemRegistry {
  const devices: IndexedDevice[] = [];

  for (const ecosystem of cfg.ecosystems ?? []) {
    for (const device of ecosystem.devices ?? []) {
      devices.push({
        ecosystemId: ecosystem.id,
        vendor: ecosystem.vendor,
        region: ecosystem.region,
        integration: ecosystem.integration ?? "home_assistant",
        connectionMode: ecosystem.connectionMode ?? ecosystem.integration ?? "home_assistant",
        directAdapter: ecosystem.directAdapter,
        deviceId: device.id,
        entityId: device.entityId,
        area: device.area,
        kind: device.kind,
        aliases: device.aliases ?? [],
        externalIds: device.externalIds,
        capabilities: device.capabilities ?? [],
      });
    }
  }

  return { devices };
}

export function listCapabilities(
  registry: EcosystemRegistry,
  filters: CapabilityFilters = {},
): CapabilitySummary[] {
  return registry.devices
    .filter((device) => deviceMatchesFilters(device, filters))
    .map((device) => ({
      ecosystemId: device.ecosystemId,
      vendor: device.vendor,
      region: device.region,
      integration: device.integration,
      connectionMode: device.connectionMode,
      directAdapter: device.directAdapter,
      deviceId: device.deviceId,
      entityId: device.entityId,
      area: device.area,
      kind: device.kind,
      aliases: device.aliases,
      externalIds: device.externalIds,
      intents: device.capabilities.map((capability) => capability.intent),
    }));
}

export function resolveIntentExecution(
  registry: EcosystemRegistry,
  request: IntentExecutionRequest,
): IntentExecution {
  const device = findDevice(registry, request);
  const capability = device.capabilities.find((entry) => entry.intent === request.intent);

  if (!capability) {
    throw new Error(
      `Device '${device.deviceId}' does not support intent '${request.intent}'.`,
    );
  }

  if (capability.requiresConfirmation && !request.confirmed) {
    throw new Error(
      `Intent '${request.intent}' for device '${device.deviceId}' requires confirmation.`,
    );
  }

  const data: Record<string, unknown> = {
    ...(capability.entityId || device.entityId
      ? { entity_id: capability.entityId ?? device.entityId }
      : {}),
    ...(capability.data ?? {}),
    ...(capability.dataTemplate
      ? (applyTemplateValue(capability.dataTemplate, request.value) as Record<string, unknown>)
      : {}),
  };

  return {
    ecosystemId: device.ecosystemId,
    vendor: device.vendor,
    deviceId: device.deviceId,
    requiresConfirmation: capability.requiresConfirmation ?? false,
    riskTier: capability.riskTier ?? "side_effect",
    serviceCall: {
      domain: capability.domain,
      service: capability.service,
      data,
    },
  };
}
