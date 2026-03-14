import http from "node:http";

import { handleConfirmRequest } from "./routes/confirm.ts";
import { handleObserveRequest } from "./routes/observe.ts";
import { TransientMemoryStore } from "./store/transientMemory.ts";

type BridgeServerOptions = {
  dispatchHomeAssistantAction?: (action: {
    domain: string;
    service: string;
    entityId?: string;
    data?: Record<string, unknown>;
  }) => Promise<unknown>;
};

async function defaultDispatchHomeAssistantAction(action: {
  domain: string;
  service: string;
  entityId?: string;
  data?: Record<string, unknown>;
}) {
  const baseUrl = process.env.HA_BASE_URL ?? "http://homeassistant:8123";
  const token = process.env.HA_TOKEN ?? "";

  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "HA_TOKEN is not configured",
    };
  }

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, "")}/api/services/${action.domain}/${action.service}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(action.entityId ? { entity_id: action.entityId } : {}),
        ...(action.data ?? {}),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`HA dispatch failed (${response.status}): ${await response.text()}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function readJson(req: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function writeJson(res: http.ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function createBridgeServer(options: BridgeServerOptions = {}) {
  const store = new TransientMemoryStore();
  const dispatchHomeAssistantAction =
    options.dispatchHomeAssistantAction ??
    defaultDispatchHomeAssistantAction;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/v1/health") {
        writeJson(res, 200, { ok: true, service: "rokid-bridge-gateway" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/observe") {
        const result = await handleObserveRequest(await readJson(req), store);
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/confirm") {
        const result = await handleConfirmRequest(
          await readJson(req),
          store,
          dispatchHomeAssistantAction,
        );
        writeJson(res, result.status, result.body);
        return;
      }

      writeJson(res, 404, { ok: false, error: "not found" });
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return {
    get baseUrl() {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Server is not listening.");
      }
      return `http://127.0.0.1:${address.port}`;
    },
    async listen(port: number) {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.off("error", reject);
          resolve();
        });
      });
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3301);
  const bridge = createBridgeServer();
  bridge.listen(port).then(() => {
    // Keep startup logging minimal and machine-readable.
    console.log(JSON.stringify({ ok: true, port, service: "rokid-bridge-gateway" }));
  });
}
