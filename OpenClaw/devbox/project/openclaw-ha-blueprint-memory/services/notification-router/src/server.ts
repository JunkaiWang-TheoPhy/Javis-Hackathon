import http from "node:http";

import { loadNotificationRouterConfig, type NotificationRouterConfigOverrides } from "./config/routerConfig.ts";
import { dispatchMessageIntent } from "./dispatch/dispatchMessageIntent.ts";
import { handleDispatchIntentRequest } from "./routes/dispatchIntent.ts";

type NotificationRouterServerOptions = NotificationRouterConfigOverrides & {
  outboundPolicyPath?: string | URL;
};

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

export function createNotificationRouterServer(
  options: NotificationRouterServerOptions = {},
) {
  const config = loadNotificationRouterConfig(options);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/v1/health") {
        writeJson(res, 200, { ok: true, service: "notification-router" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/dispatch") {
        const result = await handleDispatchIntentRequest(await readJson(req), (intent) =>
          dispatchMessageIntent(intent, config, options.outboundPolicyPath),
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
  const port = Number(process.env.PORT ?? 3302);
  const router = createNotificationRouterServer();
  router.listen(port).then(() => {
    console.log(JSON.stringify({ ok: true, port, service: "notification-router" }));
  });
}
