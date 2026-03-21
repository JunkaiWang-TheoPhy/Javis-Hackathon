import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import plugin, {
  createCacheState,
  refreshCache,
  refreshCacheSafely,
  resolvePluginConfig,
} from "./index.mjs";

test("resolvePluginConfig returns 10 second sync defaults", () => {
  const cfg = resolvePluginConfig({
    config: {
      plugins: {
        entries: {
          "mi-band-bridge": {
            config: {
              bridgeToken: "token",
            },
          },
        },
      },
    },
  });

  assert.equal(cfg.pollSeconds, 10);
  assert.equal(cfg.freshReadMaxWaitSeconds, 60);
  assert.equal(cfg.freshReadRequestTimeoutMs, 70000);
  assert.equal(
    cfg.cacheFilePath,
    "/home/devbox/.openclaw/workspace/MI_BAND_LATEST.json"
  );
});

test("refreshCache writes the latest workspace snapshot file", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mi-band-plugin-"));
  const cacheFilePath = path.join(tmpDir, "MI_BAND_LATEST.json");
  const api = {
    config: {
      plugins: {
        entries: {
          "mi-band-bridge": {
            config: {
              bridgeBaseUrl: "https://bridge.example",
              bridgeToken: "token",
              cacheFilePath,
              pollSeconds: 10,
            },
          },
        },
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  };

  const state = createCacheState();
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.endsWith("/v1/band/status")) {
      return new Response(JSON.stringify({ metrics_ready: true }), { status: 200 });
    }
    if (url.endsWith("/v1/band/latest")) {
      return new Response(JSON.stringify({ metrics: { heart_rate_bpm: 85 } }), { status: 200 });
    }
    if (url.endsWith("/v1/band/alerts?active=true")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    throw new Error(`unexpected url: ${url}`);
  };

  try {
    const cache = await refreshCache(api, state);
    assert.equal(cache.latest.metrics.heart_rate_bpm, 85);

    const persisted = JSON.parse(await fs.readFile(cacheFilePath, "utf8"));
    assert.equal(persisted.latest.metrics.heart_rate_bpm, 85);
    assert.equal(persisted.status.metrics_ready, true);
  } finally {
    global.fetch = originalFetch;
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("service start primes cache and band_get_latest uses it", async () => {
  const tools = new Map();
  const services = [];
  const intervalCalls = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mi-band-plugin-"));
  const cacheFilePath = path.join(tmpDir, "MI_BAND_LATEST.json");
  const api = {
    config: {
      plugins: {
        entries: {
          "mi-band-bridge": {
            config: {
              bridgeBaseUrl: "https://bridge.example",
              bridgeToken: "token",
              cacheFilePath,
              pollSeconds: 10,
            },
          },
        },
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
    registerService(service) {
      services.push(service);
    },
  };

  const originalFetch = global.fetch;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  let fetchCount = 0;
  global.fetch = async (url) => {
    fetchCount += 1;
    if (url.endsWith("/v1/band/status")) {
      return new Response(JSON.stringify({ metrics_ready: true }), { status: 200 });
    }
    if (url.endsWith("/v1/band/latest")) {
      return new Response(JSON.stringify({ metrics: { heart_rate_bpm: 85 } }), { status: 200 });
    }
    if (url.endsWith("/v1/band/alerts?active=true")) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    throw new Error(`unexpected url: ${url}`);
  };
  global.setInterval = (fn, ms) => {
    intervalCalls.push(ms);
    return { fn, ms };
  };
  global.clearInterval = () => {};

  try {
    plugin.register(api);
    assert.equal(services.length, 1);

    await services[0].start();
    assert.deepEqual(intervalCalls, [10_000]);

    const latest = await tools.get("band_get_latest").execute();
    assert.match(latest.content[0].text, /"heart_rate_bpm": 85/);
    assert.equal(fetchCount, 3);
  } finally {
    global.fetch = originalFetch;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test(
  "refreshCacheSafely recovers after a timed out bridge request",
  { timeout: 1000 },
  async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mi-band-plugin-"));
    const cacheFilePath = path.join(tmpDir, "MI_BAND_LATEST.json");
    const warnings = [];
    const api = {
      config: {
        plugins: {
          entries: {
            "mi-band-bridge": {
              config: {
                bridgeBaseUrl: "https://bridge.example",
                bridgeToken: "token",
                cacheFilePath,
                pollSeconds: 10,
                requestTimeoutMs: 25,
              },
            },
          },
        },
      },
      logger: {
        info() {},
        warn(message) {
          warnings.push(message);
        },
        error() {},
      },
    };

    const state = createCacheState();
    const originalFetch = global.fetch;
    let shouldHangStatus = true;
    global.fetch = async (url, init = {}) => {
      if (url.endsWith("/v1/band/status")) {
        if (shouldHangStatus) {
          return await new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => {
                const error = new Error("The operation was aborted.");
                error.name = "AbortError";
                reject(error);
              },
              { once: true }
            );
          });
        }
        return new Response(JSON.stringify({ metrics_ready: true }), { status: 200 });
      }
      if (url.endsWith("/v1/band/latest")) {
        return new Response(JSON.stringify({ metrics: { heart_rate_bpm: 85 } }), { status: 200 });
      }
      if (url.endsWith("/v1/band/alerts?active=true")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      throw new Error(`unexpected url: ${url}`);
    };

    try {
      const first = await refreshCacheSafely(api, state);
      assert.equal(first, null);
      assert.equal(state.refreshPromise, null);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /timed out/i);

      shouldHangStatus = false;
      const second = await refreshCacheSafely(api, state);
      assert.equal(second.latest.metrics.heart_rate_bpm, 85);
      assert.equal(state.refreshPromise, null);

      const persisted = JSON.parse(await fs.readFile(cacheFilePath, "utf8"));
      assert.equal(persisted.latest.metrics.heart_rate_bpm, 85);
    } finally {
      global.fetch = originalFetch;
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
);

test("band_get_fresh_latest bypasses cache and posts a fresh-read request", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mi-band-plugin-fresh-"));
  const tools = new Map();
  const api = {
    config: {
      plugins: {
        entries: {
          "mi-band-bridge": {
            config: {
              bridgeBaseUrl: "https://bridge.example",
              bridgeToken: "token",
              freshReadMaxWaitSeconds: 45,
              freshReadRequestTimeoutMs: 50000,
              cacheFilePath: path.join(tmpDir, "MI_BAND_LATEST.json"),
            },
          },
        },
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
    registerTool(tool) {
      tools.set(tool.name, tool);
    },
  };

  const seen = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, init = {}) => {
    seen.push({
      url,
      method: init.method ?? "GET",
      body: init.body ?? "",
    });
    if (url.endsWith("/v1/band/fresh-read")) {
      return new Response(
        JSON.stringify({
          metrics: { heart_rate_bpm: 91 },
          timestamps: { source_timestamp: "2026-03-21T14:21:30+08:00" },
          fresh_read: { ok: true, reason: "fresh_sample_observed" },
        }),
        { status: 200 }
      );
    }
    throw new Error(`unexpected url: ${url}`);
  };

  try {
    plugin.register(api);

    const fresh = await tools.get("band_get_fresh_latest").execute("tool-call", {
      maxWaitSeconds: 45,
    });

    assert.match(fresh.content[0].text, /"heart_rate_bpm": 91/);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].method, "POST");
    assert.match(seen[0].url, /\/v1\/band\/fresh-read$/);
    assert.equal(JSON.parse(seen[0].body).max_wait_seconds, 45);
  } finally {
    global.fetch = originalFetch;
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
