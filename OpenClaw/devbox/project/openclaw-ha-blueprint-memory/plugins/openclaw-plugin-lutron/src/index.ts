import {
  buildSessionChecklist,
  listLocalBridgeSessionInfo,
  testLocalBridgeSession,
} from "./session.ts";

type ToolContent = { type: "text"; text: string };

type LutronConfig = {
  systemType?: string;
  bridgeHost?: string;
  bridgeId?: string;
  keyFile?: string;
  certFile?: string;
  caCertFile?: string;
  port?: number;
  servername?: string;
  connectTimeoutMs?: number;
  leapEnabled?: boolean;
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

const PLUGIN_ID = "lutron";

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function asTextContent(data: unknown): { content: ToolContent[] } {
  return { content: [{ type: "text", text: typeof data === "string" ? data : jsonText(data) }] };
}

function getCfg(api: PluginApi): LutronConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as LutronConfig;
}

function exportStatus(cfg: LutronConfig) {
  const checklist = buildSessionChecklist(cfg);
  return {
    plugin: PLUGIN_ID,
    configured: Boolean(cfg.bridgeHost),
    directAdapter: "lutron-leap",
    systemType: cfg.systemType ?? null,
    bridgeHost: cfg.bridgeHost ?? null,
    bridgeId: cfg.bridgeId ?? null,
    port: cfg.port ?? 8081,
    servername: cfg.servername ?? cfg.bridgeHost ?? null,
    leapEnabled: cfg.leapEnabled ?? false,
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
      name: "lutron_status",
      description: "Report Lutron plugin status and readiness.",
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
      name: "lutron_config_summary",
      description: "Return a sanitized summary of the configured Lutron bridge settings.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        return asTextContent({
          plugin: PLUGIN_ID,
          systemType: cfg.systemType ?? null,
          bridgeHost: cfg.bridgeHost ?? null,
          bridgeId: cfg.bridgeId ?? null,
          port: cfg.port ?? 8081,
          servername: cfg.servername ?? cfg.bridgeHost ?? null,
          leapEnabled: cfg.leapEnabled ?? false,
          configuredCertificates: Boolean(cfg.keyFile && cfg.certFile && cfg.caCertFile),
          note: "This plugin can now test a local bridge session, but live device execution still remains HA-first until a higher-level LEAP command layer is added.",
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "lutron_validate_config",
      description: "Validate the configured Lutron bridge and LEAP credential prerequisites.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const checklist = buildSessionChecklist(getCfg(api));
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
      name: "lutron_test_session",
      description: "Attempt a local TLS session against the configured Lutron bridge using the LEAP certificate files.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        return asTextContent(await testLocalBridgeSession(getCfg(api)));
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "lutron_list_session_info",
      description:
        "Return a sanitized summary of the configured local Lutron bridge TLS session.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        return asTextContent(await listLocalBridgeSessionInfo(getCfg(api)));
      },
    },
    { optional: true },
  );
}
