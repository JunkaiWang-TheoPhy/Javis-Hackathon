type ToolContent = { type: "text"; text: string };

type SmartThingsConfig = {
  baseUrl?: string;
  personalAccessToken?: string;
  locationId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  homeApiEnabled?: boolean;
};

type PluginApi = {
  config: any;
  logger: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };
  registerTool: (tool: any, options?: { optional?: boolean }) => void;
  registerGatewayMethod: (name: string, handler: (ctx: any) => void) => void;
};

const PLUGIN_ID = "smartthings";

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function asTextContent(data: unknown): { content: ToolContent[] } {
  return { content: [{ type: "text", text: typeof data === "string" ? data : jsonText(data) }] };
}

function getCfg(api: PluginApi): SmartThingsConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as SmartThingsConfig;
}

function normalizeBaseUrl(baseUrl: string | undefined) {
  return (baseUrl ?? "https://api.smartthings.com").replace(/\/+$/, "");
}

async function callSmartThings(
  cfg: SmartThingsConfig,
  pathname: string,
  init: RequestInit = {},
) {
  if (!cfg.personalAccessToken) {
    throw new Error("SmartThings personal access token is not configured.");
  }

  const response = await fetch(`${normalizeBaseUrl(cfg.baseUrl)}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.personalAccessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SmartThings request failed (${response.status}): ${await response.text()}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function buildChecklist(cfg: SmartThingsConfig) {
  const steps = [
    {
      id: "personalAccessToken",
      label: "SmartThings personal access token is set",
      done: Boolean(cfg.personalAccessToken),
    },
  ];

  return {
    ready: steps.every((step) => step.done),
    missing: steps.filter((step) => !step.done).map((step) => step.id),
    steps,
  };
}

function exportStatus(cfg: SmartThingsConfig) {
  const checklist = buildChecklist(cfg);
  return {
    plugin: PLUGIN_ID,
    configured: Boolean(cfg.personalAccessToken || cfg.clientId),
    directAdapter: "smartthings-api",
    baseUrl: normalizeBaseUrl(cfg.baseUrl),
    locationId: cfg.locationId ?? null,
    homeApiEnabled: cfg.homeApiEnabled ?? false,
    controlReady: Boolean(cfg.personalAccessToken),
    setupReady: checklist.ready,
    missingSetup: checklist.missing,
  };
}

export default function register(api: PluginApi) {
  api.registerGatewayMethod(`${PLUGIN_ID}.status`, ({ respond }: any) => {
    respond(true, exportStatus(getCfg(api)));
  });

  api.registerTool(
    {
      name: "smartthings_status",
      description: "Report SmartThings plugin status and readiness.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        return asTextContent(exportStatus(getCfg(api)));
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "smartthings_config_summary",
      description: "Return a sanitized summary of the SmartThings cloud configuration.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        return asTextContent({
          plugin: PLUGIN_ID,
          baseUrl: cfg.baseUrl ?? "https://api.smartthings.com",
          locationId: cfg.locationId ?? null,
          homeApiEnabled: cfg.homeApiEnabled ?? false,
          configuredPat: Boolean(cfg.personalAccessToken),
          configuredOAuth: Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri),
          note: "Live SmartThings execution remains HA-first until a clearer direct auth and device-control layer is added.",
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "smartthings_validate_config",
      description: "Validate the minimum SmartThings cloud prerequisites configured for this repo.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const checklist = buildChecklist(getCfg(api));
        return asTextContent({
          plugin: PLUGIN_ID,
          ready: checklist.ready,
          missing: checklist.missing,
          steps: checklist.steps,
          liveControlReady: false,
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "smartthings_list_devices",
      description: "List SmartThings devices using the configured personal access token.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        const payload = (await callSmartThings(cfg, "/v1/devices")) as {
          items?: Array<Record<string, unknown>>;
        } | null;
        return asTextContent({
          plugin: PLUGIN_ID,
          devices: payload?.items ?? [],
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "smartthings_get_device_status",
      description: "Fetch the SmartThings status payload for a specific device.",
      parameters: {
        type: "object",
        required: ["deviceId"],
        properties: {
          deviceId: { type: "string" },
        },
      },
      async execute(_id: string, params: { deviceId: string }) {
        const cfg = getCfg(api);
        return asTextContent({
          plugin: PLUGIN_ID,
          deviceId: params.deviceId,
          status: await callSmartThings(cfg, `/v1/devices/${params.deviceId}/status`),
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "smartthings_execute_command",
      description: "Execute a minimal SmartThings command against a device.",
      parameters: {
        type: "object",
        required: ["deviceId", "capability", "command"],
        properties: {
          deviceId: { type: "string" },
          capability: { type: "string" },
          command: { type: "string" },
          component: { type: "string", default: "main" },
          arguments: {
            type: "array",
            items: {},
          },
        },
      },
      async execute(
        _id: string,
        params: {
          deviceId: string;
          capability: string;
          command: string;
          component?: string;
          arguments?: unknown[];
        },
      ) {
        const cfg = getCfg(api);
        const payload = {
          commands: [
            {
              component: params.component ?? "main",
              capability: params.capability,
              command: params.command,
              arguments: params.arguments ?? [],
            },
          ],
        };
        return asTextContent({
          plugin: PLUGIN_ID,
          deviceId: params.deviceId,
          results: (
            (await callSmartThings(cfg, `/v1/devices/${params.deviceId}/commands`, {
              method: "POST",
              body: JSON.stringify(payload),
            })) as { results?: Array<Record<string, unknown>> } | null
          )?.results ?? [],
        });
      },
    },
    { optional: true },
  );
}
