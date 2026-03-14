type ToolContent = { type: "text"; text: string };

type GoogleHomeConfig = {
  projectId?: string;
  projectNumber?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  homeApiEnabled?: boolean;
  platforms?: string[];
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

const PLUGIN_ID = "google-home";

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function asTextContent(data: unknown): { content: ToolContent[] } {
  return { content: [{ type: "text", text: typeof data === "string" ? data : jsonText(data) }] };
}

function getCfg(api: PluginApi): GoogleHomeConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as GoogleHomeConfig;
}

function normalizePlatforms(cfg: GoogleHomeConfig): string[] {
  return Array.isArray(cfg.platforms)
    ? cfg.platforms.filter((platform): platform is string => typeof platform === "string" && platform.length > 0)
    : [];
}

function buildChecklist(cfg: GoogleHomeConfig) {
  const platforms = normalizePlatforms(cfg);
  const steps = [
    { id: "projectId", label: "Google Cloud project id is set", done: Boolean(cfg.projectId) },
    { id: "clientId", label: "OAuth client id is set", done: Boolean(cfg.clientId) },
    { id: "clientSecret", label: "OAuth client secret is set", done: Boolean(cfg.clientSecret) },
    { id: "redirectUri", label: "OAuth redirect URI is set", done: Boolean(cfg.redirectUri) },
    { id: "projectNumber", label: "Google Cloud project number is set", done: Boolean(cfg.projectNumber) },
    { id: "platforms", label: "At least one client platform is declared", done: platforms.length > 0 },
    { id: "homeApiEnabled", label: "Google Home API access is enabled", done: cfg.homeApiEnabled === true },
  ];

  return {
    ready: steps.every((step) => step.done),
    missing: steps.filter((step) => !step.done).map((step) => step.id),
    steps,
    platforms,
  };
}

function exportStatus(cfg: GoogleHomeConfig) {
  const checklist = buildChecklist(cfg);
  return {
    plugin: PLUGIN_ID,
    configured: Boolean(cfg.projectId),
    controlReady: false,
    authMode: "oauth_required",
    projectId: cfg.projectId ?? null,
    projectNumber: cfg.projectNumber ?? null,
    hasClientId: Boolean(cfg.clientId),
    hasClientSecret: Boolean(cfg.clientSecret),
    redirectUri: cfg.redirectUri ?? null,
    homeApiEnabled: cfg.homeApiEnabled ?? false,
    platforms: checklist.platforms,
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
      name: "google_home_status",
      description: "Report Google Home / Nest plugin status and readiness.",
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
      name: "google_home_config_summary",
      description: "Return a sanitized summary of the Google Home / Nest configuration.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        const checklist = buildChecklist(cfg);
        return asTextContent({
          plugin: PLUGIN_ID,
          projectId: cfg.projectId ?? null,
          projectNumber: cfg.projectNumber ?? null,
          redirectUri: cfg.redirectUri ?? null,
          homeApiEnabled: cfg.homeApiEnabled ?? false,
          platforms: checklist.platforms,
          configuredOAuth: Boolean(cfg.clientId && cfg.clientSecret),
          note: "Live control is deferred until a full Google Home / Nest auth flow is implemented.",
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "google_home_validate_config",
      description: "Validate whether the Google Home / Nest plugin has the required project and OAuth prerequisites configured.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        const checklist = buildChecklist(cfg);
        return asTextContent({
          plugin: PLUGIN_ID,
          ready: checklist.ready,
          missing: checklist.missing,
          platforms: checklist.platforms,
          liveControlReady: false,
          note: "Configuration can be complete while live control remains deferred until the auth callback flow exists.",
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "google_home_oauth_checklist",
      description: "Return a setup checklist for the Google Home / Nest OAuth and project prerequisites.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const checklist = buildChecklist(getCfg(api));
        return asTextContent({
          plugin: PLUGIN_ID,
          ready: checklist.ready,
          steps: checklist.steps,
          platforms: checklist.platforms,
          nextStep: checklist.ready
            ? "Implement or connect the auth callback flow before attempting live control."
            : "Complete the missing project and OAuth prerequisites first.",
        });
      },
    },
    { optional: true },
  );
}
