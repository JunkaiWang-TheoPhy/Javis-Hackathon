import http from "node:http";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { handleAmbientObserveRequest } from "./routes/ambientObserve.ts";
import { handleConfirmRequest } from "./routes/confirm.ts";
import { type HaControlConfig } from "../../../plugins/openclaw-plugin-ha-control/src/ecosystem.ts";
import { MemoryContextRetriever } from "./memory/memoryContextRetriever.ts";
import { MemoryIdleSleepController } from "./memory/memoryIdleSleepController.ts";
import type { MemoryLedger } from "./memory/memoryLedger.ts";
import { MemorySleepConsolidator } from "./memory/memorySleepConsolidator.ts";
import { SQLiteMemoryLedger } from "./memory/sqliteMemoryLedger.ts";
import { DeterministicOpenClawClient } from "./orchestration/openclawClient.ts";
import { handleMemoryAutoSleepRequest } from "./routes/memoryAutoSleep.ts";
import { handleMemoryContextRequest } from "./routes/memoryContext.ts";
import { handleObserveRequest } from "./routes/observe.ts";
import { extractUserRequestTimestampFromMemoryEvent, handleMemoryIngestRequest } from "./routes/memoryIngest.ts";
import { handleMemorySleepRequest } from "./routes/memorySleep.ts";
import { TransientMemoryStore } from "./store/transientMemory.ts";

type BridgeServerOptions = {
  dispatchHomeAssistantAction?: (action: {
    domain: string;
    service: string;
    entityId?: string;
    data?: Record<string, unknown>;
  }) => Promise<unknown>;
  haControlConfig?: HaControlConfig;
  memoryLedger?: MemoryLedger;
  memoryWorkspaceDir?: string;
};

const DEFAULT_IDLE_SLEEP_THRESHOLD_MS = 2 * 60 * 60 * 1000;

function resolveRuntimeMemoryPaths() {
  const home = process.env.HOME ?? homedir();
  const sqlitePath =
    process.env.MIRA_MEMORY_SQLITE_PATH ??
    join(home, ".openclaw", "memory", "mira-memory.sqlite");
  const workspaceDir =
    process.env.MIRA_MEMORY_WORKSPACE_DIR ??
    join(home, ".openclaw", "workspace");

  return {
    sqlitePath,
    workspaceDir,
  };
}

function createDefaultMemoryLedger() {
  const { sqlitePath, workspaceDir } = resolveRuntimeMemoryPaths();
  mkdirSync(dirname(sqlitePath), { recursive: true });
  mkdirSync(workspaceDir, { recursive: true });

  return {
    memoryLedger: new SQLiteMemoryLedger(sqlitePath),
    memoryWorkspaceDir: workspaceDir,
  };
}

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

function resolveIdleSleepThresholdMs() {
  const raw = process.env.MIRA_MEMORY_IDLE_THRESHOLD_SECONDS;
  if (!raw) {
    return DEFAULT_IDLE_SLEEP_THRESHOLD_MS;
  }

  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 60) {
    return DEFAULT_IDLE_SLEEP_THRESHOLD_MS;
  }

  return Math.trunc(seconds) * 1000;
}

export function createBridgeServer(options: BridgeServerOptions = {}) {
  const defaultMemoryRuntime = options.memoryLedger ? undefined : createDefaultMemoryLedger();
  const store = new TransientMemoryStore();
  const client = new DeterministicOpenClawClient(options.haControlConfig);
  const dispatchHomeAssistantAction =
    options.dispatchHomeAssistantAction ??
    defaultDispatchHomeAssistantAction;
  const memoryLedger = options.memoryLedger ?? defaultMemoryRuntime?.memoryLedger;
  const memoryWorkspaceDir = options.memoryWorkspaceDir ?? defaultMemoryRuntime?.memoryWorkspaceDir;
  const idleSleepThresholdMs = resolveIdleSleepThresholdMs();

  const touchUserRequest = (occurredAt: string | null) => {
    if (!memoryLedger || !occurredAt) {
      return;
    }

    memoryLedger.updateRuntimeState({
      lastUserRequestAt: occurredAt,
    });
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/v1/health") {
        writeJson(res, 200, { ok: true, service: "rokid-bridge-gateway" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/observe") {
        const body = await readJson(req) as { observation?: { observedAt?: string } };
        const result = await handleObserveRequest(body, store, memoryLedger, client);
        if (result.status === 200 && typeof body.observation?.observedAt === "string") {
          touchUserRequest(body.observation.observedAt);
        }
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/ambient/observe") {
        const result = await handleAmbientObserveRequest(await readJson(req), memoryLedger);
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/confirm") {
        const body = await readJson(req);
        const result = await handleConfirmRequest(
          body,
          store,
          memoryLedger,
          dispatchHomeAssistantAction,
          client,
        );
        if (result.status === 200) {
          touchUserRequest(new Date().toISOString());
        }
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/memory/events") {
        if (!memoryLedger) {
          writeJson(res, 503, {
            ok: false,
            error: "memory ledger is not configured",
          });
          return;
        }

        const body = await readJson(req) as { event?: Parameters<typeof extractUserRequestTimestampFromMemoryEvent>[0] };
        const result = await handleMemoryIngestRequest(body, memoryLedger);
        if (result.status === 202) {
          touchUserRequest(extractUserRequestTimestampFromMemoryEvent(body.event));
        }
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/memory/sleep") {
        if (!memoryLedger || !memoryWorkspaceDir) {
          writeJson(res, 503, {
            ok: false,
            error: "memory sleep consolidation is not configured",
          });
          return;
        }

        const consolidator = new MemorySleepConsolidator({
          ledger: memoryLedger,
          workspaceDir: memoryWorkspaceDir,
        });
        const result = await handleMemorySleepRequest(await readJson(req), consolidator);
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/memory/auto-sleep") {
        if (!memoryLedger || !memoryWorkspaceDir) {
          writeJson(res, 503, {
            ok: false,
            error: "memory auto-sleep is not configured",
          });
          return;
        }

        const controller = new MemoryIdleSleepController({
          ledger: memoryLedger,
          workspaceDir: memoryWorkspaceDir,
          idleThresholdMs: idleSleepThresholdMs,
          hasPendingActions: () => store.hasPendingActions(),
        });
        const result = await handleMemoryAutoSleepRequest(await readJson(req), controller);
        writeJson(res, result.status, result.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/v1/memory/context") {
        if (!memoryLedger) {
          writeJson(res, 503, {
            ok: false,
            error: "memory retrieval is not configured",
          });
          return;
        }

        const retriever = new MemoryContextRetriever({
          ledger: memoryLedger,
        });
        const result = await handleMemoryContextRequest(await readJson(req), retriever);
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
