type ToolContent = { type: "text"; text: string };

type AlexaConfig = {
  skillId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accountLinkingEnabled?: boolean;
  awsRegion?: string;
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

const PLUGIN_ID = "alexa";

function asTextContent(data: unknown): { content: ToolContent[] } {
  return {
    content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
  };
}

function getCfg(api: PluginApi): AlexaConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as AlexaConfig;
}

function buildChecklist(cfg: AlexaConfig) {
  const steps = [
    { id: "clientId", label: "Alexa OAuth client id is set", done: Boolean(cfg.clientId) },
    { id: "clientSecret", label: "Alexa OAuth client secret is set", done: Boolean(cfg.clientSecret) },
    { id: "redirectUri", label: "Alexa redirect URI is set", done: Boolean(cfg.redirectUri) },
    {
      id: "accountLinkingEnabled",
      label: "Alexa account linking is enabled",
      done: cfg.accountLinkingEnabled === true,
    },
  ];

  return {
    ready: steps.every((step) => step.done),
    missing: steps.filter((step) => !step.done).map((step) => step.id),
    steps,
  };
}

function exportStatus(cfg: AlexaConfig) {
  const checklist = buildChecklist(cfg);
  return {
    plugin: PLUGIN_ID,
    configured: Boolean(cfg.skillId),
    skillId: cfg.skillId ?? null,
    awsRegion: cfg.awsRegion ?? "us-east-1",
    authMode: "account_linking_required",
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
      name: "alexa_status",
      description: "Report Alexa plugin status and readiness.",
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
      name: "alexa_skill_config_summary",
      description: "Return a sanitized summary of the Alexa smart-home configuration.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        return asTextContent({
          plugin: PLUGIN_ID,
          skillId: cfg.skillId ?? null,
          awsRegion: cfg.awsRegion ?? "us-east-1",
          configuredOAuth: Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri),
          accountLinkingEnabled: cfg.accountLinkingEnabled ?? false,
          note: "Alexa support remains readiness-only until a broader runtime strategy is added.",
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "alexa_account_linking_checklist",
      description: "Return the Alexa smart-home account-linking readiness checklist.",
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
        });
      },
    },
    { optional: true },
  );
}
