import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const PLUGIN_ID = "printer-bridge";
const DEFAULT_MEDIA = "3x3.Fullbleed";
const DEFAULT_QUEUE_ROOT = "/home/devbox/.openclaw/printer-bridge-queue";
const DEFAULT_RESPONSE_TIMEOUT_MS = 45000;
const SUPPORTED_MEDIA = new Set(["3x3", "3x3.Fullbleed", "4x6", "4x6.Fullbleed"]);
const MEDIA_ALIASES = {
  three_inch: "3x3.Fullbleed",
};

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
    queueRoot:
      raw.queueRoot ?? process.env.OPENCLAW_PRINTER_BRIDGE_QUEUE_ROOT ?? DEFAULT_QUEUE_ROOT,
    responseTimeoutMs:
      raw.responseTimeoutMs ??
      Number(process.env.OPENCLAW_PRINTER_BRIDGE_RESPONSE_TIMEOUT_MS ?? DEFAULT_RESPONSE_TIMEOUT_MS),
    defaultMedia: raw.defaultMedia ?? DEFAULT_MEDIA,
  };
}

function normalizeMedia(media) {
  const value = MEDIA_ALIASES[media] ?? media ?? DEFAULT_MEDIA;
  if (!SUPPORTED_MEDIA.has(value)) {
    throw new Error(`Unsupported media: ${media}`);
  }
  return value;
}

function buildQueuePaths(queueRoot, requestId) {
  return {
    queueRoot,
    pendingDir: path.join(queueRoot, "pending"),
    claimedDir: path.join(queueRoot, "claimed"),
    responsesDir: path.join(queueRoot, "responses"),
    pendingPath: path.join(queueRoot, "pending", `${requestId}.json`),
    claimedPath: path.join(queueRoot, "claimed", `${requestId}.json`),
    responsePath: path.join(queueRoot, "responses", `${requestId}.json`),
  };
}

async function ensureQueueDirs(queueRoot) {
  for (const name of ["pending", "claimed", "responses", "heartbeats"]) {
    await fs.mkdir(path.join(queueRoot, name), { recursive: true });
  }
}

async function waitForResponse(queueRoot, requestId, timeoutMs) {
  const paths = buildQueuePaths(queueRoot, requestId);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const raw = await fs.readFile(paths.responsePath, "utf8");
      await fs.unlink(paths.responsePath).catch(() => {});
      return JSON.parse(raw);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  await fs.unlink(paths.pendingPath).catch(() => {});
  throw new Error("Printer bridge request timed out waiting for the local Mac connector");
}

async function callBridge(api, method, endpoint, payload) {
  const cfg = resolvePluginConfig(api);
  const requestId = crypto.randomUUID();
  const queuePaths = buildQueuePaths(cfg.queueRoot, requestId);
  await ensureQueueDirs(cfg.queueRoot);

  await fs.writeFile(
    queuePaths.pendingPath,
    `${JSON.stringify(
      {
        id: requestId,
        method,
        path: endpoint,
        body: payload ?? null,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const response = await waitForResponse(cfg.queueRoot, requestId, cfg.responseTimeoutMs);
  const statusCode = Number(response.statusCode ?? 200);
  const body = response.body ?? {};
  if (statusCode >= 400) {
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }
  return body;
}

async function materializeInput(params) {
  if (params.contentBase64) {
    if (!params.filename) {
      throw new Error("filename is required when contentBase64 is provided");
    }
    return {
      content_base64: params.contentBase64,
      filename: params.filename,
    };
  }

  if (params.sourcePath) {
    const data = await fs.readFile(params.sourcePath);
    return {
      content_base64: data.toString("base64"),
      filename: path.basename(params.sourcePath),
    };
  }

  if (params.sourceUrl) {
    return {
      source_url: params.sourceUrl,
    };
  }

  throw new Error("one of sourceUrl, sourcePath, or contentBase64 is required");
}

function buildImageTool(api) {
  return {
    name: "printer_print_image",
    description: "Submit an image print job through the local Mac printer connector queue.",
    parameters: {
      type: "object",
      properties: {
        sourceUrl: { type: "string" },
        sourcePath: { type: "string" },
        contentBase64: { type: "string" },
        filename: { type: "string" },
        media: { type: "string" },
        fitToPage: { type: "boolean" },
      },
      required: [],
    },
    async execute(_id, params) {
      const payload = {
        ...(await materializeInput(params)),
        media: normalizeMedia(params.media ?? resolvePluginConfig(api).defaultMedia),
        fit_to_page: params.fitToPage === true,
      };
      const data = await callBridge(api, "POST", "/v1/printers/default/print-image", payload);
      return asTextContent(data);
    },
  };
}

function buildPdfTool(api) {
  return {
    name: "printer_print_pdf",
    description: "Submit a PDF print job through the local Mac printer connector queue.",
    parameters: {
      type: "object",
      properties: {
        sourceUrl: { type: "string" },
        sourcePath: { type: "string" },
        contentBase64: { type: "string" },
        filename: { type: "string" },
        media: { type: "string" },
      },
      required: [],
    },
    async execute(_id, params) {
      const payload = {
        ...(await materializeInput(params)),
        media: normalizeMedia(params.media ?? resolvePluginConfig(api).defaultMedia),
      };
      const data = await callBridge(api, "POST", "/v1/printers/default/print-pdf", payload);
      return asTextContent(data);
    },
  };
}

function buildCancelTool(api) {
  return {
    name: "printer_cancel_job",
    description: "Cancel a queued print job through the local Mac printer connector queue.",
    parameters: {
      type: "object",
      properties: {
        jobId: { type: "string" },
      },
      required: ["jobId"],
    },
    async execute(_id, params) {
      const data = await callBridge(api, "POST", "/v1/jobs/cancel", {
        job_id: params.jobId,
      });
      return asTextContent(data);
    },
  };
}

function buildStatusTool(api) {
  return {
    name: "printer_get_status",
    description: "Read the default printer status through the local Mac printer connector queue.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      const data = await callBridge(api, "GET", "/v1/printers/default");
      return asTextContent(data);
    },
  };
}

const plugin = {
  id: PLUGIN_ID,
  name: "Printer Bridge",
  description: "Queue bounded printer actions for the local Mac connector without relying on a public tunnel.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      queueRoot: { type: "string", default: DEFAULT_QUEUE_ROOT },
      responseTimeoutMs: { type: "number", default: DEFAULT_RESPONSE_TIMEOUT_MS },
      defaultMedia: { type: "string", default: DEFAULT_MEDIA },
    },
  },
  register(api) {
    api.registerTool(buildStatusTool(api), { optional: false });
    api.registerTool(buildImageTool(api), { optional: false });
    api.registerTool(buildPdfTool(api), { optional: false });
    api.registerTool(buildCancelTool(api), { optional: false });

    if (typeof api.registerService === "function") {
      api.registerService({
        id: "printer-bridge-status",
        start: () => {
          const cfg = resolvePluginConfig(api);
          api.logger.info(`[${PLUGIN_ID}] queue root ${cfg.queueRoot}`);
        },
        stop: () => {
          api.logger.info(`[${PLUGIN_ID}] stopped`);
        },
      });
    }
  },
};

export default plugin;
