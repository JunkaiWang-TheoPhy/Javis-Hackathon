import fs from "node:fs/promises";
import path from "node:path";

const PLUGIN_ID = "mi-band-bridge";
const DEFAULT_BRIDGE_URL = "http://127.0.0.1:9782";
const DEFAULT_POLL_SECONDS = 10;
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_FRESH_READ_MAX_WAIT_SECONDS = 60;
const DEFAULT_FRESH_READ_REQUEST_TIMEOUT_MS = 70000;
const DEFAULT_CACHE_FILE_PATH = "/home/devbox/.openclaw/workspace/MI_BAND_LATEST.json";

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
    pollSeconds: normalizePositiveInt(
      raw.pollSeconds ?? process.env.OPENCLAW_MI_BAND_BRIDGE_POLL_SECONDS,
      DEFAULT_POLL_SECONDS
    ),
    requestTimeoutMs: normalizePositiveInt(
      raw.requestTimeoutMs ?? process.env.OPENCLAW_MI_BAND_BRIDGE_REQUEST_TIMEOUT_MS,
      DEFAULT_REQUEST_TIMEOUT_MS
    ),
    freshReadMaxWaitSeconds: normalizePositiveInt(
      raw.freshReadMaxWaitSeconds ??
        process.env.OPENCLAW_MI_BAND_BRIDGE_FRESH_READ_MAX_WAIT_SECONDS,
      DEFAULT_FRESH_READ_MAX_WAIT_SECONDS
    ),
    freshReadRequestTimeoutMs: normalizePositiveInt(
      raw.freshReadRequestTimeoutMs ??
        process.env.OPENCLAW_MI_BAND_BRIDGE_FRESH_READ_REQUEST_TIMEOUT_MS,
      DEFAULT_FRESH_READ_REQUEST_TIMEOUT_MS
    ),
    cacheFilePath:
      raw.cacheFilePath ??
      process.env.OPENCLAW_MI_BAND_BRIDGE_CACHE_FILE_PATH ??
      DEFAULT_CACHE_FILE_PATH,
  };
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function buildTimeoutError(timeoutMs, endpoint) {
  return new Error(`Mi Band bridge request timed out after ${timeoutMs}ms: ${endpoint}`);
}

function createCacheState() {
  return {
    cache: null,
    timer: null,
    refreshPromise: null,
  };
}

async function callBridge(api, endpoint, options = {}) {
  const cfg = resolvePluginConfig(api);
  if (!cfg.bridgeToken) {
    throw new Error("Mi Band bridge token is missing");
  }

  const method = options.method ?? "GET";
  const timeoutMs = normalizePositiveInt(options.timeoutMs, cfg.requestTimeoutMs);
  const body =
    options.body == null
      ? undefined
      : typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timeoutHandle = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller?.abort();
      reject(buildTimeoutError(timeoutMs, endpoint));
    }, timeoutMs);
  });

  let response;
  try {
    const fetchPromise = fetch(`${cfg.bridgeBaseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.bridgeToken}`,
        "Content-Type": "application/json",
      },
      body,
      signal: controller?.signal,
    }).catch((error) => {
      if (controller?.signal?.aborted && error?.name === "AbortError") {
        throw buildTimeoutError(timeoutMs, endpoint);
      }
      throw error;
    });

    response = await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }

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

async function persistCacheSnapshot(cacheFilePath, payload) {
  if (!cacheFilePath) {
    return;
  }
  await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
  await fs.writeFile(
    cacheFilePath,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );
}

function logAt(api, level, message) {
  const fn = api?.logger?.[level];
  if (typeof fn === "function") {
    fn(message);
    return;
  }
  if (typeof api?.logger?.info === "function") {
    api.logger.info(message);
  }
}

async function refreshCache(api, state) {
  const cfg = resolvePluginConfig(api);
  const [statusResult, latestResult, alertsResult] = await Promise.allSettled([
    callBridge(api, "/v1/band/status"),
    callBridge(api, "/v1/band/latest"),
    callBridge(api, "/v1/band/alerts?active=true"),
  ]);

  const failures = [statusResult, latestResult]
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message ?? String(result.reason));

  if (failures.length > 0) {
    throw new Error(`Mi Band cache refresh failed: ${failures.join("; ")}`);
  }

  const payload = {
    pluginId: PLUGIN_ID,
    syncedAt: new Date().toISOString(),
    bridgeBaseUrl: cfg.bridgeBaseUrl,
    status: statusResult.value,
    latest: latestResult.value,
    alerts: alertsResult.status === "fulfilled" ? alertsResult.value : [],
  };

  state.cache = payload;
  await persistCacheSnapshot(cfg.cacheFilePath, payload);
  return payload;
}

async function refreshCacheSafely(api, state) {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = (async () => {
    try {
      return await refreshCache(api, state);
    } catch (error) {
      logAt(api, "warn", `[${PLUGIN_ID}] cache refresh failed: ${error.message}`);
      return state.cache;
    } finally {
      state.refreshPromise = null;
    }
  })();

  return state.refreshPromise;
}

async function readCachedOrBridge(api, state, key, endpoint) {
  if (state.cache?.[key] != null) {
    return state.cache[key];
  }
  return await callBridge(api, endpoint);
}

async function mergeLatestIntoCache(api, state, latestPayload) {
  const cfg = resolvePluginConfig(api);
  state.cache = {
    pluginId: PLUGIN_ID,
    syncedAt: new Date().toISOString(),
    bridgeBaseUrl: cfg.bridgeBaseUrl,
    status: state.cache?.status ?? null,
    latest: latestPayload,
    alerts: state.cache?.alerts ?? [],
  };
  await persistCacheSnapshot(cfg.cacheFilePath, state.cache);
}

function buildStatusTool(api, state) {
  return {
    name: "band_get_status",
    description: "Read the current local Mi Band bridge status. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      return asTextContent(await readCachedOrBridge(api, state, "status", "/v1/band/status"));
    },
  };
}

function buildLatestTool(api, state) {
  return {
    name: "band_get_latest",
    description: "Read the latest known Mi Band metrics snapshot. Use this tool instead of direct bridge HTTP calls.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      return asTextContent(await readCachedOrBridge(api, state, "latest", "/v1/band/latest"));
    },
  };
}

function buildFreshLatestTool(api, state) {
  return {
    name: "band_get_fresh_latest",
    description:
      "Request a newly refreshed Mi Band heart-rate snapshot. Use this tool instead of direct bridge HTTP calls when the user asks for the current heart rate right now.",
    parameters: {
      type: "object",
      properties: {
        maxWaitSeconds: { type: "number" },
      },
      required: [],
    },
    async execute(_id, params = {}) {
      const cfg = resolvePluginConfig(api);
      const maxWaitSeconds = normalizePositiveInt(
        params.maxWaitSeconds,
        cfg.freshReadMaxWaitSeconds
      );
      const freshPayload = await callBridge(api, "/v1/band/fresh-read", {
        method: "POST",
        body: {
          max_wait_seconds: maxWaitSeconds,
        },
        timeoutMs: Math.max(
          cfg.freshReadRequestTimeoutMs,
          maxWaitSeconds * 1000 + 5000
        ),
      });
      await mergeLatestIntoCache(api, state, freshPayload);
      return asTextContent(freshPayload);
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

function buildAlertsTool(api, state) {
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
      if (activeOnly && state.cache?.alerts != null) {
        return asTextContent(state.cache.alerts);
      }
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
      pollSeconds: { type: "number", default: DEFAULT_POLL_SECONDS },
      requestTimeoutMs: { type: "number", default: DEFAULT_REQUEST_TIMEOUT_MS },
      freshReadMaxWaitSeconds: {
        type: "number",
        default: DEFAULT_FRESH_READ_MAX_WAIT_SECONDS,
      },
      freshReadRequestTimeoutMs: {
        type: "number",
        default: DEFAULT_FRESH_READ_REQUEST_TIMEOUT_MS,
      },
      cacheFilePath: { type: "string", default: DEFAULT_CACHE_FILE_PATH },
    },
  },
  register(api) {
    const state = createCacheState();

    api.registerTool(buildStatusTool(api, state), { optional: false });
    api.registerTool(buildLatestTool(api, state), { optional: false });
    api.registerTool(buildFreshLatestTool(api, state), { optional: false });
    api.registerTool(buildEventsTool(api), { optional: false });
    api.registerTool(buildAlertsTool(api, state), { optional: false });

    if (typeof api.registerService === "function") {
      api.registerService({
        id: "mi-band-bridge-status",
        start: async () => {
          const cfg = resolvePluginConfig(api);
          api.logger.info(`[${PLUGIN_ID}] bridge target ${cfg.bridgeBaseUrl}`);
          await refreshCacheSafely(api, state);
          state.timer = setInterval(() => {
            void refreshCacheSafely(api, state);
          }, cfg.pollSeconds * 1000);
        },
        stop: () => {
          if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
          }
          api.logger.info(`[${PLUGIN_ID}] stopped`);
        },
      });
    }
  },
};

export default plugin;
export {
  buildTimeoutError,
  createCacheState,
  refreshCache,
  refreshCacheSafely,
  resolvePluginConfig,
};
