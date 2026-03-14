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
    baseUrl: cfg.baseUrl ?? "https://api.smartthings.com",
    locationId: cfg.locationId ?? null,
    homeApiEnabled: cfg.homeApiEnabled ?? false,
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
}
