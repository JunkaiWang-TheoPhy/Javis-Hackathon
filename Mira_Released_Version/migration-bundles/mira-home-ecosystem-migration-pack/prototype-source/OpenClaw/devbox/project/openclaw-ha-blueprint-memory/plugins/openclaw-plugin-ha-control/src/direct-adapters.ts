import type { IntentDispatchPlan } from "./ecosystem.ts";

type PluginApi = {
  config: any;
  logger: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };
};

type HuePluginConfig = {
  baseUrl?: string;
  applicationKey?: string;
  defaultTransitionMs?: number;
};

export type DirectAdapterAvailability = {
  supported: boolean;
  reason?: string;
};

export type DirectAdapterExecutionResult = {
  adapter: string;
  target: string;
  action: string;
  request: {
    url: string;
    method: string;
    body: Record<string, unknown>;
  };
  response: unknown;
};

function getPluginEntry(api: PluginApi, pluginId: string) {
  return api.config?.plugins?.entries?.[pluginId] ?? {};
}

function getHueCfg(api: PluginApi): HuePluginConfig {
  return (getPluginEntry(api, "hue")?.config ?? {}) as HuePluginConfig;
}

function normalizeHueBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/clip/v2") ? trimmed : `${trimmed}/clip/v2`;
}

function hasHueConfig(api: PluginApi): boolean {
  const entry = getPluginEntry(api, "hue");
  const cfg = getHueCfg(api);
  return entry?.enabled === true && Boolean(cfg.baseUrl && cfg.applicationKey);
}

function buildHueRequest(
  cfg: HuePluginConfig,
  plan: IntentDispatchPlan,
): { url: string; method: string; body: Record<string, unknown>; action: string } {
  const externalIds = plan.dispatch.externalIds ?? {};
  const defaultTransitionMs = cfg.defaultTransitionMs;

  switch (plan.intent) {
    case "turn_on": {
      const lightId = externalIds.hueLightId;
      if (!lightId) throw new Error("Hue direct adapter requires externalIds.hueLightId");
      return {
        url: `${normalizeHueBaseUrl(String(cfg.baseUrl))}/resource/light/${lightId}`,
        method: "PUT",
        body: {
          on: { on: true },
          ...(typeof defaultTransitionMs === "number"
            ? { dynamics: { duration: defaultTransitionMs } }
            : {}),
        },
        action: "light_power",
      };
    }
    case "turn_off": {
      const lightId = externalIds.hueLightId;
      if (!lightId) throw new Error("Hue direct adapter requires externalIds.hueLightId");
      return {
        url: `${normalizeHueBaseUrl(String(cfg.baseUrl))}/resource/light/${lightId}`,
        method: "PUT",
        body: {
          on: { on: false },
          ...(typeof defaultTransitionMs === "number"
            ? { dynamics: { duration: defaultTransitionMs } }
            : {}),
        },
        action: "light_power",
      };
    }
    case "set_brightness": {
      const lightId = externalIds.hueLightId;
      if (!lightId) throw new Error("Hue direct adapter requires externalIds.hueLightId");
      if (typeof plan.value !== "number") {
        throw new Error("Hue direct brightness control requires a numeric value");
      }
      return {
        url: `${normalizeHueBaseUrl(String(cfg.baseUrl))}/resource/light/${lightId}`,
        method: "PUT",
        body: {
          on: { on: true },
          dimming: { brightness: plan.value },
          ...(typeof defaultTransitionMs === "number"
            ? { dynamics: { duration: defaultTransitionMs } }
            : {}),
        },
        action: "light_brightness",
      };
    }
    case "activate": {
      const sceneId = externalIds.hueSceneId;
      if (!sceneId) throw new Error("Hue direct adapter requires externalIds.hueSceneId");
      return {
        url: `${normalizeHueBaseUrl(String(cfg.baseUrl))}/resource/scene/${sceneId}`,
        method: "PUT",
        body: {
          recall: {
            action: "active",
            ...(typeof defaultTransitionMs === "number"
              ? { duration: defaultTransitionMs }
              : {}),
          },
        },
        action: "scene_activate",
      };
    }
    default:
      throw new Error(`Hue direct adapter does not support intent '${plan.intent}'`);
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function getDirectAdapterAvailability(
  api: PluginApi,
  plan: IntentDispatchPlan,
): DirectAdapterAvailability {
  switch (plan.dispatch.directAdapter) {
    case "hue-local": {
      if (!hasHueConfig(api)) {
        return {
          supported: false,
          reason: "Hue plugin is disabled or missing bridge credentials",
        };
      }

      try {
        buildHueRequest(getHueCfg(api), plan);
        return { supported: true };
      } catch (error: any) {
        return {
          supported: false,
          reason: String(error?.message ?? error),
        };
      }
    }
    case undefined:
      return {
        supported: false,
        reason: "No direct adapter is configured for this device",
      };
    default:
      return {
        supported: false,
        reason: `Direct adapter '${plan.dispatch.directAdapter}' is not implemented yet`,
      };
  }
}

export async function executeDirectAdapter(
  api: PluginApi,
  plan: IntentDispatchPlan,
): Promise<DirectAdapterExecutionResult> {
  switch (plan.dispatch.directAdapter) {
    case "hue-local": {
      const cfg = getHueCfg(api);
      const request = buildHueRequest(cfg, plan);
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          "hue-application-key": String(cfg.applicationKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request.body),
      });

      const parsed = await readJson(response);
      if (!response.ok) {
        throw new Error(
          `Hue direct adapter ${request.method} failed (${response.status}): ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`,
        );
      }

      return {
        adapter: "hue-local",
        target: plan.dispatch.kind,
        action: request.action,
        request,
        response: parsed,
      };
    }
    default:
      throw new Error(
        `Direct adapter '${plan.dispatch.directAdapter ?? "none"}' is not implemented`,
      );
  }
}
