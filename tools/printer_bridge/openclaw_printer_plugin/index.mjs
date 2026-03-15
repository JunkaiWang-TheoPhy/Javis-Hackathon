import fs from "node:fs/promises";
import path from "node:path";

const PLUGIN_ID = "printer-bridge";
const DEFAULT_BRIDGE_URL = "http://127.0.0.1:4771";
const DEFAULT_MEDIA = "3x3.Fullbleed";
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
    bridgeBaseUrl:
      raw.bridgeBaseUrl ?? process.env.OPENCLAW_PRINTER_BRIDGE_URL ?? DEFAULT_BRIDGE_URL,
    bridgeToken:
      raw.bridgeToken ?? process.env.OPENCLAW_PRINTER_BRIDGE_TOKEN ?? "",
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

async function callBridge(api, method, endpoint, payload) {
  const cfg = resolvePluginConfig(api);
  if (!cfg.bridgeToken) {
    throw new Error("Printer bridge token is missing");
  }

  const response = await fetch(`${cfg.bridgeBaseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.bridgeToken}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const raw = await response.text();
  let parsed = raw;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    // Keep raw text when the bridge does not return JSON.
  }

  if (!response.ok) {
    throw new Error(
      typeof parsed === "string"
        ? parsed
        : JSON.stringify(parsed)
    );
  }

  return parsed;
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
    description: "Submit an image print job to the local macOS printer bridge.",
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
      const data = await callBridge(
        api,
        "POST",
        "/v1/printers/default/print-image",
        payload
      );
      return asTextContent(data);
    },
  };
}

function buildPdfTool(api) {
  return {
    name: "printer_print_pdf",
    description: "Submit a PDF print job to the local macOS printer bridge.",
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
      const data = await callBridge(
        api,
        "POST",
        "/v1/printers/default/print-pdf",
        payload
      );
      return asTextContent(data);
    },
  };
}

function buildCancelTool(api) {
  return {
    name: "printer_cancel_job",
    description: "Cancel a queued print job on the local printer bridge.",
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
    description: "Read the default printer status from the local macOS printer bridge.",
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
  description: "Forward bounded printer actions to a loopback-only macOS printer bridge.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      bridgeBaseUrl: { type: "string", default: DEFAULT_BRIDGE_URL },
      bridgeToken: { type: "string" },
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
