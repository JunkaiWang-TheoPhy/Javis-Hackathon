import { Type } from "@sinclair/typebox";
import WebSocket from "ws";
import {
  buildEcosystemRegistry,
  listCapabilities,
  resolveIntentExecution,
  type HaControlConfig,
} from "./ecosystem.ts";

type ToolContent = { type: "text"; text: string };

type PluginApi = {
  config: any;
  logger: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };
  registerTool: (tool: any, options?: { optional?: boolean }) => void;
  registerHttpRoute: (route: {
    path: string;
    auth: "gateway" | "plugin";
    match?: "exact" | "prefix";
    replaceExisting?: boolean;
    handler: (req: any, res: any) => Promise<boolean> | boolean;
  }) => void;
  registerGatewayMethod: (name: string, handler: (ctx: any) => void) => void;
  registerService: (service: { id: string; start: () => void; stop: () => void }) => void;
};

type HrPayload = {
  userId?: string;
  source?: string;
  heartRateBpm: number;
  sustainedSec?: number;
  atHome?: boolean;
  postWorkout?: boolean;
  arrivedHomeRecently?: boolean;
  timestamp?: string;
};

type RuntimeState = {
  lastHeartRate?: HrPayload & { receivedAtMs: number; high: boolean };
  presenceState: string;
  lastActionByKey: Map<string, number>;
};

const PLUGIN_ID = "ha-control";
const state: RuntimeState = {
  presenceState: "unknown",
  lastActionByKey: new Map(),
};

function getCfg(api: PluginApi): HaControlConfig {
  return (api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {}) as HaControlConfig;
}

function baseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function wsUrl(raw: string): string {
  return baseUrl(raw).replace(/^http/i, (m) => (m.toLowerCase() === "https" ? "wss" : "ws"));
}

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function asTextContent(data: unknown): { content: ToolContent[] } {
  return { content: [{ type: "text", text: typeof data === "string" ? data : jsonText(data) }] };
}

function policy(cfg: HaControlConfig) {
  return {
    highHrThresholdBpm: cfg.policies?.highHrThresholdBpm ?? 110,
    highHrSustainSec: cfg.policies?.highHrSustainSec ?? 300,
    recentHrWindowSec: cfg.policies?.recentHrWindowSec ?? 1800,
    dedupeWindowSec: cfg.policies?.dedupeWindowSec ?? 300,
    autoCoolOnHighHrAtHome: cfg.policies?.autoCoolOnHighHrAtHome ?? true,
  };
}

async function readBody(req: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function haFetch(cfg: HaControlConfig, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl(cfg.baseUrl)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const raw = await response.text();
  const parsed = raw ? safeJson(raw) : null;
  if (!response.ok) {
    throw new Error(`HA ${init.method ?? "GET"} ${path} failed (${response.status}): ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }
  return parsed;
}

function safeJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function callService(cfg: HaControlConfig, domain: string, service: string, serviceData: Record<string, unknown> = {}) {
  return haFetch(cfg, `/api/services/${domain}/${service}`, {
    method: "POST",
    body: JSON.stringify(serviceData),
  });
}

async function getState(cfg: HaControlConfig, entityId: string) {
  return haFetch(cfg, `/api/states/${entityId}`);
}

async function processConversation(cfg: HaControlConfig, text: string, language = "en") {
  return haFetch(cfg, "/api/conversation/process", {
    method: "POST",
    body: JSON.stringify({ text, language }),
  });
}

async function setMirrorState(
  cfg: HaControlConfig,
  entityId: string | undefined,
  value: string,
  attributes: Record<string, unknown> = {},
) {
  if (!entityId) return;
  await haFetch(cfg, `/api/states/${entityId}`, {
    method: "POST",
    body: JSON.stringify({ state: value, attributes }),
  });
}

function isHighHr(cfg: HaControlConfig, payload: HrPayload): boolean {
  const p = policy(cfg);
  return payload.heartRateBpm >= p.highHrThresholdBpm && (payload.sustainedSec ?? 0) >= p.highHrSustainSec;
}

function recentHighHr(cfg: HaControlConfig): boolean {
  const last = state.lastHeartRate;
  if (!last?.high) return false;
  return Date.now() - last.receivedAtMs <= policy(cfg).recentHrWindowSec * 1000;
}

function shouldRun(key: string, cfg: HaControlConfig): boolean {
  const last = state.lastActionByKey.get(key) ?? 0;
  const allowed = Date.now() - last > policy(cfg).dedupeWindowSec * 1000;
  if (allowed) state.lastActionByKey.set(key, Date.now());
  return allowed;
}

async function notify(api: PluginApi, cfg: HaControlConfig, title: string, message: string) {
  if (!cfg.notification?.domain || !cfg.notification?.service) {
    api.logger.info(`[${PLUGIN_ID}] notification skipped (no notify service configured): ${title} | ${message}`);
    return;
  }

  const payload: Record<string, unknown> = {
    title: cfg.notification.title ?? title,
    message,
    ...(cfg.notification.extraData ?? {}),
  };

  await callService(cfg, cfg.notification.domain, cfg.notification.service, payload);
}

async function runMechanicalSwitches(api: PluginApi, cfg: HaControlConfig, reason: string) {
  const targets = [cfg.mechanicalSwitch?.thirdRealityEntityId, cfg.mechanicalSwitch?.switchBotEntityId].filter(Boolean) as string[];
  for (const entityId of targets) {
    await callService(cfg, "switch", "turn_on", { entity_id: entityId });
    api.logger.info(`[${PLUGIN_ID}] switch.turn_on -> ${entityId}`, { reason });
  }
}

async function runCoolingScene(api: PluginApi, cfg: HaControlConfig, reason: string, overrideTemperatureC?: number) {
  if (cfg.coolingSceneEntityId) {
    await callService(cfg, "scene", "turn_on", { entity_id: cfg.coolingSceneEntityId });
    api.logger.info(`[${PLUGIN_ID}] scene.turn_on -> ${cfg.coolingSceneEntityId}`, { reason });
  } else {
    if (cfg.fanEntityId) {
      await callService(cfg, "fan", "turn_on", { entity_id: cfg.fanEntityId });
      api.logger.info(`[${PLUGIN_ID}] fan.turn_on -> ${cfg.fanEntityId}`, { reason });
    }
    if (cfg.climateEntityId) {
      await callService(cfg, "climate", "set_temperature", {
        entity_id: cfg.climateEntityId,
        temperature: overrideTemperatureC ?? cfg.targetTemperatureC ?? 23,
      });
      if (cfg.climateHvacMode) {
        await callService(cfg, "climate", "set_hvac_mode", {
          entity_id: cfg.climateEntityId,
          hvac_mode: cfg.climateHvacMode,
        });
      }
      api.logger.info(`[${PLUGIN_ID}] climate.set_temperature -> ${cfg.climateEntityId}`, { reason });
    }
  }

  if (cfg.mechanicalSwitch?.onArrivalCooling) {
    await runMechanicalSwitches(api, cfg, `${reason}:mechanical`);
  }
}

async function mirrorRuntimeState(cfg: HaControlConfig) {
  await setMirrorState(
    cfg,
    cfg.mirrorEntities?.latestHeartRate ?? "sensor.openclaw_latest_heart_rate",
    String(state.lastHeartRate?.heartRateBpm ?? "unknown"),
    {
      source: state.lastHeartRate?.source ?? null,
      sustained_sec: state.lastHeartRate?.sustainedSec ?? null,
      high: state.lastHeartRate?.high ?? false,
      received_at: state.lastHeartRate?.timestamp ?? new Date(state.lastHeartRate?.receivedAtMs ?? Date.now()).toISOString(),
    },
  );

  await setMirrorState(
    cfg,
    cfg.mirrorEntities?.recentHighHr ?? "binary_sensor.openclaw_recent_high_hr",
    recentHighHr(cfg) ? "on" : "off",
    {
      threshold_bpm: policy(cfg).highHrThresholdBpm,
      sustain_sec: policy(cfg).highHrSustainSec,
    },
  );

  await setMirrorState(
    cfg,
    cfg.mirrorEntities?.presence ?? "sensor.openclaw_presence_cache",
    state.presenceState,
    {
      updated_at: new Date().toISOString(),
    },
  );
}

async function handleHrEvent(api: PluginApi, cfg: HaControlConfig, payload: HrPayload) {
  const high = isHighHr(cfg, payload);
  state.lastHeartRate = {
    ...payload,
    high,
    receivedAtMs: Date.now(),
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };

  await mirrorRuntimeState(cfg);

  if (!high || !shouldRun("high-hr", cfg)) {
    return {
      ok: true,
      high,
      cooled: false,
      reason: high ? "deduped" : "below-threshold",
    };
  }

  const atHome = payload.atHome ?? payload.arrivedHomeRecently ?? state.presenceState === "home";
  const msg = `High heart rate detected: ${payload.heartRateBpm} bpm for ${payload.sustainedSec ?? 0}s`;
  await notify(api, cfg, "High heart rate", msg);

  if (atHome && policy(cfg).autoCoolOnHighHrAtHome) {
    await runCoolingScene(api, cfg, "high_hr_at_home");
  }

  if (cfg.mechanicalSwitch?.onHighHeartRate) {
    await runMechanicalSwitches(api, cfg, "high_hr");
  }

  return {
    ok: true,
    high,
    cooled: atHome && policy(cfg).autoCoolOnHighHrAtHome,
    atHome,
  };
}

function exportStatus(cfg: HaControlConfig) {
  return {
    configured: Boolean(cfg.baseUrl && cfg.token),
    presenceEntityId: cfg.presenceEntityId ?? null,
    presenceState: state.presenceState,
    lastHeartRate: state.lastHeartRate ?? null,
  };
}

export default function register(api: PluginApi) {
  api.registerGatewayMethod(`${PLUGIN_ID}.status`, ({ respond }) => {
    try {
      const cfg = getCfg(api);
      respond(true, exportStatus(cfg));
    } catch (error: any) {
      respond(false, { error: String(error?.message ?? error) });
    }
  });

  api.registerTool(
    {
      name: "ha_get_state",
      description: "Read the current state of a Home Assistant entity.",
      parameters: Type.Object({ entity_id: Type.String() }),
      async execute(_id: string, params: { entity_id: string }) {
        const cfg = getCfg(api);
        const data = await getState(cfg, params.entity_id);
        return asTextContent(data);
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "ha_call_service",
      description: "Call a Home Assistant service like light.turn_on, fan.turn_on, climate.set_temperature, or switch.turn_on.",
      parameters: Type.Object({
        domain: Type.String(),
        service: Type.String(),
        entity_id: Type.Optional(Type.String()),
        data: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      async execute(
        _id: string,
        params: { domain: string; service: string; entity_id?: string; data?: Record<string, unknown> },
      ) {
        const cfg = getCfg(api);
        const mergedData = {
          ...(params.entity_id ? { entity_id: params.entity_id } : {}),
          ...(params.data ?? {}),
        };
        const data = await callService(cfg, params.domain, params.service, mergedData);
        return asTextContent(data);
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "ha_process_conversation",
      description: "Send a natural-language sentence to Home Assistant conversation/Assist.",
      parameters: Type.Object({
        text: Type.String(),
        language: Type.Optional(Type.String()),
      }),
      async execute(_id: string, params: { text: string; language?: string }) {
        const cfg = getCfg(api);
        const data = await processConversation(cfg, params.text, params.language ?? "en");
        return asTextContent(data);
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "home_list_capabilities",
      description: "List configured Xiaomi, Matter, Aqara, Tuya, SwitchBot, and other ecosystem devices routed through Home Assistant.",
      parameters: Type.Object({
        ecosystem: Type.Optional(Type.String()),
        vendor: Type.Optional(Type.String()),
        area: Type.Optional(Type.String()),
        kind: Type.Optional(Type.String()),
      }),
      async execute(
        _id: string,
        params: {
          ecosystem?: string;
          vendor?: string;
          area?: string;
          kind?: string;
        },
      ) {
        const cfg = getCfg(api);
        const registry = buildEcosystemRegistry(cfg);
        return asTextContent({
          ok: true,
          capabilities: listCapabilities(registry, params),
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "home_execute_intent",
      description: "Resolve a configured ecosystem device intent into a constrained Home Assistant service call.",
      parameters: Type.Object({
        device_id: Type.Optional(Type.String()),
        alias: Type.Optional(Type.String()),
        intent: Type.String(),
        value: Type.Optional(Type.Any()),
        confirmed: Type.Optional(Type.Boolean()),
      }),
      async execute(
        _id: string,
        params: {
          device_id?: string;
          alias?: string;
          intent: string;
          value?: unknown;
          confirmed?: boolean;
        },
      ) {
        const cfg = getCfg(api);
        const registry = buildEcosystemRegistry(cfg);
        const resolved = resolveIntentExecution(registry, {
          deviceId: params.device_id,
          alias: params.alias,
          intent: params.intent,
          value: params.value,
          confirmed: params.confirmed,
        });
        const result = await callService(
          cfg,
          resolved.serviceCall.domain,
          resolved.serviceCall.service,
          resolved.serviceCall.data,
        );
        return asTextContent({
          ok: true,
          ...resolved,
          result,
        });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "home_run_cooling_scene",
      description: "Run the configured cooling response: optional scene, fan, climate, and mechanical switches.",
      parameters: Type.Object({
        reason: Type.String(),
        temperature_c: Type.Optional(Type.Number()),
      }),
      async execute(_id: string, params: { reason: string; temperature_c?: number }) {
        const cfg = getCfg(api);
        await runCoolingScene(api, cfg, params.reason, params.temperature_c);
        return asTextContent({ ok: true, ran: "cooling_scene", reason: params.reason });
      },
    },
    { optional: true },
  );

  api.registerTool(
    {
      name: "home_handle_hr_event",
      description: "Evaluate a wearable heart-rate event against the configured high-HR policy and trigger configured cooling/notification actions.",
      parameters: Type.Object({
        heart_rate_bpm: Type.Number(),
        sustained_sec: Type.Number(),
        at_home: Type.Optional(Type.Boolean()),
        post_workout: Type.Optional(Type.Boolean()),
        source: Type.Optional(Type.String()),
      }),
      async execute(
        _id: string,
        params: {
          heart_rate_bpm: number;
          sustained_sec: number;
          at_home?: boolean;
          post_workout?: boolean;
          source?: string;
        },
      ) {
        const cfg = getCfg(api);
        const result = await handleHrEvent(api, cfg, {
          heartRateBpm: params.heart_rate_bpm,
          sustainedSec: params.sustained_sec,
          atHome: params.at_home,
          postWorkout: params.post_workout,
          source: params.source,
        });
        return asTextContent(result);
      },
    },
    { optional: true },
  );

  api.registerHttpRoute({
    path: "/ha-control/webhooks/wearable",
    auth: "plugin",
    match: "exact",
    async handler(req: any, res: any) {
      const cfg = getCfg(api);
      const secret = req.headers["x-ha-control-secret"];
      if (cfg.webhookSecret && secret !== cfg.webhookSecret) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "invalid webhook secret" }));
        return true;
      }

      const raw = await readBody(req);
      const payload = safeJson(raw) as HrPayload;
      if (!payload || typeof payload.heartRateBpm !== "number") {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "heartRateBpm is required" }));
        return true;
      }

      try {
        const result = await handleHrEvent(api, cfg, payload);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      } catch (error: any) {
        api.logger.error(`[${PLUGIN_ID}] wearable webhook failed`, error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
      }
      return true;
    },
  });

  let ws: WebSocket | undefined;
  let reconnectTimer: NodeJS.Timeout | undefined;
  let stopped = false;

  const connectPresenceWatcher = async () => {
    const cfg = getCfg(api);
    if (!cfg.baseUrl || !cfg.token || !cfg.presenceEntityId) {
      api.logger.info(`[${PLUGIN_ID}] presence watcher idle (missing baseUrl/token/presenceEntityId)`);
      return;
    }

    const endpoint = `${wsUrl(cfg.baseUrl)}/api/websocket`;
    ws = new WebSocket(endpoint);

    ws.on("message", async (buf) => {
      try {
        const msg = safeJson(buf.toString());
        if (msg?.type === "auth_required") {
          ws?.send(JSON.stringify({ type: "auth", access_token: cfg.token }));
          return;
        }
        if (msg?.type === "auth_ok") {
          ws?.send(JSON.stringify({ id: 1, type: "subscribe_events", event_type: "state_changed" }));
          return;
        }
        if (msg?.type !== "event") return;

        const entityId = msg?.event?.data?.entity_id;
        if (entityId !== cfg.presenceEntityId) return;

        const newState = msg?.event?.data?.new_state?.state ?? "unknown";
        const oldState = msg?.event?.data?.old_state?.state ?? "unknown";
        state.presenceState = newState;
        await mirrorRuntimeState(cfg);

        const justArrivedHome = newState === "home" && oldState !== "home";
        if (justArrivedHome && recentHighHr(cfg) && shouldRun("arrival-cooling", cfg)) {
          const hr = state.lastHeartRate;
          await notify(
            api,
            cfg,
            "Arrival cooling",
            `Recent high heart rate (${hr?.heartRateBpm ?? "unknown"} bpm) detected; running cooling response on arrival.`,
          );
          await runCoolingScene(api, cfg, "arrival_after_recent_high_hr");
        }
      } catch (error: any) {
        api.logger.error(`[${PLUGIN_ID}] presence watcher message handling failed`, error);
      }
    });

    ws.on("open", () => api.logger.info(`[${PLUGIN_ID}] presence watcher connected to ${endpoint}`));
    ws.on("close", () => {
      api.logger.warn(`[${PLUGIN_ID}] presence watcher disconnected`);
      if (!stopped) reconnectTimer = setTimeout(connectPresenceWatcher, 5000);
    });
    ws.on("error", (error: any) => api.logger.warn(`[${PLUGIN_ID}] presence watcher websocket error`, error));
  };

  api.registerService({
    id: `${PLUGIN_ID}-presence-watcher`,
    start: () => {
      stopped = false;
      void connectPresenceWatcher();
    },
    stop: () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
  });
}
