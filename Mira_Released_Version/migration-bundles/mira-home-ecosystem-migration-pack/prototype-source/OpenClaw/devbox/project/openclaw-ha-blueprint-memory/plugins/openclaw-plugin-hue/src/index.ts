import {
  HueBridgeClient,
  normalizeHueBaseUrl,
  type HueConfig,
  type HueLightControl,
} from "./client.ts";

type ToolContent = { type: "text"; text: string };

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

const PLUGIN_ID = "hue";

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function asTextContent(data: unknown): { content: ToolContent[] } {
  return { content: [{ type: "text", text: typeof data === "string" ? data : jsonText(data) }] };
}

function getCfg(api: PluginApi): Partial<HueConfig> {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as Partial<HueConfig>;
}

function buildClient(cfg: Partial<HueConfig>) {
  if (!cfg.baseUrl || !cfg.applicationKey) {
    throw new Error("Hue baseUrl and applicationKey are required");
  }
  return new HueBridgeClient({
    baseUrl: cfg.baseUrl,
    applicationKey: cfg.applicationKey,
    bridgeId: cfg.bridgeId,
    defaultTransitionMs: cfg.defaultTransitionMs,
  });
}

function exportStatus(cfg: Partial<HueConfig>) {
  return {
    plugin: PLUGIN_ID,
    configured: Boolean(cfg.baseUrl && cfg.applicationKey),
    baseUrl: cfg.baseUrl ? normalizeHueBaseUrl(cfg.baseUrl) : null,
    bridgeId: cfg.bridgeId ?? null,
    defaultTransitionMs: cfg.defaultTransitionMs ?? null,
  };
}

export default function register(api: PluginApi) {
  api.registerGatewayMethod(`${PLUGIN_ID}.status`, ({ respond }: any) => {
    respond(true, exportStatus(getCfg(api)));
  });

  api.registerTool(
    {
      name: "hue_status",
      description: "Report Philips Hue bridge plugin status and basic bridge info when configured.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const cfg = getCfg(api);
        if (!cfg.baseUrl || !cfg.applicationKey) {
          return asTextContent(exportStatus(cfg));
        }
        const client = buildClient(cfg);
        const bridge = await client.getBridge();
        return asTextContent({
          ...exportStatus(cfg),
          bridge,
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "hue_list_lights",
      description: "List Philips Hue lights from the configured bridge.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const client = buildClient(getCfg(api));
        const lights = await client.listLights();
        return asTextContent({
          ok: true,
          lights: lights.map((light: any) => ({
            id: light.id,
            type: light.type,
            name: light.metadata?.name ?? null,
            on: light.on?.on ?? null,
          })),
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "hue_list_scenes",
      description: "List Philips Hue scenes from the configured bridge.",
      parameters: {
        type: "object",
        properties: {},
      },
      async execute() {
        const client = buildClient(getCfg(api));
        const scenes = await client.listScenes();
        return asTextContent({
          ok: true,
          scenes: scenes.map((scene: any) => ({
            id: scene.id,
            type: scene.type,
            name: scene.metadata?.name ?? null,
          })),
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "hue_control_light",
      description: "Control a Philips Hue light by id with power, brightness, and optional transition.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["lightId"],
        properties: {
          lightId: { type: "string" },
          power: { type: "string", enum: ["on", "off"] },
          brightness: { type: "number", minimum: 0, maximum: 100 },
          transitionMs: { type: "number", minimum: 0 },
        },
      },
      async execute(_requestId: string, params: Record<string, unknown>) {
        const control: HueLightControl = {};
        if (typeof params.power === "string") {
          control.power = params.power === "off" ? "off" : "on";
        }
        if (typeof params.brightness === "number") {
          control.brightness = params.brightness;
        }
        if (typeof params.transitionMs === "number") {
          control.transitionMs = params.transitionMs;
        }
        if (!control.power && typeof control.brightness !== "number") {
          throw new Error("At least one of power or brightness must be provided");
        }

        const client = buildClient(getCfg(api));
        await client.setLightState(String(params.lightId), control);
        return asTextContent({
          ok: true,
          lightId: String(params.lightId),
          control,
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "hue_activate_scene",
      description: "Activate a Philips Hue scene by id.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sceneId"],
        properties: {
          sceneId: { type: "string" },
          transitionMs: { type: "number", minimum: 0 },
        },
      },
      async execute(_requestId: string, params: Record<string, unknown>) {
        const client = buildClient(getCfg(api));
        const transitionMs = typeof params.transitionMs === "number" ? params.transitionMs : undefined;
        await client.activateScene(String(params.sceneId), transitionMs);
        return asTextContent({
          ok: true,
          sceneId: String(params.sceneId),
          transitionMs: transitionMs ?? getCfg(api).defaultTransitionMs ?? null,
        });
      },
    },
    { optional: true },
  );
}
