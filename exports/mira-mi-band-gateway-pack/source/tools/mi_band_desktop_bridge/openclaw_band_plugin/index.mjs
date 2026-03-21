const PLUGIN_ID = "mi-band-bridge";
const DEFAULT_BRIDGE_URL = "http://127.0.0.1:9782";

function asTextContent(data) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function resolvePluginConfig(api) {
  const raw = api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
  return {
    bridgeBaseUrl:
      raw.bridgeBaseUrl ?? process.env.OPENCLAW_MI_BAND_BRIDGE_URL ?? DEFAULT_BRIDGE_URL,
    bridgeToken:
      raw.bridgeToken ?? process.env.OPENCLAW_MI_BAND_BRIDGE_TOKEN ?? "",
  };
}

async function callBridge(api, endpoint) {
  const cfg = resolvePluginConfig(api);
  if (!cfg.bridgeToken) {
    throw new Error("Mi Band bridge token is missing");
  }

  const response = await fetch(`${cfg.bridgeBaseUrl}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cfg.bridgeToken}`,
      "Content-Type": "application/json",
    },
  });

  const raw = await response.text();
  let parsed = raw;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    // Keep raw text when the bridge does not return JSON.
  }

  if (!response.ok) {
    throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
  }

  return parsed;
}

function buildStatusTool(api) {
  return {
    name: "band_get_status",
    description: "Read the current local Mi Band bridge status. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      return asTextContent(await callBridge(api, "/v1/band/status"));
    },
  };
}

function buildLatestTool(api) {
  return {
    name: "band_get_latest",
    description: "Read the latest known Mi Band metrics snapshot. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      return asTextContent(await callBridge(api, "/v1/band/latest"));
    },
  };
}

function buildEventsTool(api) {
  return {
    name: "band_get_events",
    description: "Read recent Mi Band sync and collector events. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
      required: [],
    },
    async execute(_id, params) {
      const limit = Number.isFinite(params.limit) ? params.limit : 20;
      return asTextContent(await callBridge(api, `/v1/band/events?limit=${limit}`));
    },
  };
}

function buildAlertsTool(api) {
  return {
    name: "band_get_alerts",
    description: "Read active Mi Band bridge alerts. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {
        activeOnly: { type: "boolean" },
      },
      required: [],
    },
    async execute(_id, params) {
      const activeOnly = params.activeOnly !== false;
      return asTextContent(await callBridge(api, `/v1/band/alerts?active=${activeOnly}`));
    },
  };
}

const plugin = {
  id: PLUGIN_ID,
  name: "Mi Band Bridge",
  description: "Forward read-only Mi Band data requests to the local desktop bridge. Do not call the bridge URL directly.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      bridgeBaseUrl: { type: "string", default: DEFAULT_BRIDGE_URL },
      bridgeToken: { type: "string" },
    },
  },
  register(api) {
    api.registerTool(buildStatusTool(api), { optional: false });
    api.registerTool(buildLatestTool(api), { optional: false });
    api.registerTool(buildEventsTool(api), { optional: false });
    api.registerTool(buildAlertsTool(api), { optional: false });

    if (typeof api.registerService === "function") {
      api.registerService({
        id: "mi-band-bridge-status",
        start: () => {
          const cfg = resolvePluginConfig(api);
          api.logger.info(`[${PLUGIN_ID}] bridge target ${cfg.bridgeBaseUrl}`);
        },
        stop: () => {
          api.logger.info(`[${PLUGIN_ID}] stopped`);
        },
      });
    }
  },
};

export default plugin;
