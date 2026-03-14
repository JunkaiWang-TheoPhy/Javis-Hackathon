import assert from "node:assert/strict";
import test from "node:test";

import register from "../index.ts";

type RegisteredTool = {
  name: string;
  execute: (id: string, params: Record<string, unknown>) => Promise<{ content: Array<{ text: string }> }>;
};

function buildApi() {
  const tools = new Map<string, RegisteredTool>();

  return {
    tools,
    api: {
      config: {
        plugins: {
          entries: {
            "ha-control": {
              config: {
                baseUrl: "http://homeassistant:8123",
                token: "test-token",
                ecosystems: [
                  {
                    id: "xiaomi-home",
                    vendor: "xiaomi",
                    integration: "home_assistant",
                    devices: [
                      {
                        id: "mi-bedroom-fan",
                        entityId: "fan.mi_bedroom",
                        kind: "fan",
                        aliases: ["xiaomi fan"],
                        capabilities: [
                          {
                            intent: "turn_on",
                            domain: "fan",
                            service: "turn_on",
                            riskTier: "side_effect",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: "hue-home",
                    vendor: "hue",
                    integration: "home_assistant",
                    connectionMode: "bridge",
                    directAdapter: "hue-local",
                    devices: [
                      {
                        id: "hue-living-room",
                        entityId: "light.hue_living_room",
                        kind: "light",
                        aliases: ["hue light"],
                        externalIds: {
                          hueLightId: "7",
                        },
                        capabilities: [
                          {
                            intent: "turn_on",
                            domain: "light",
                            service: "turn_on",
                            riskTier: "side_effect",
                          },
                          {
                            intent: "turn_off",
                            domain: "light",
                            service: "turn_off",
                            riskTier: "side_effect",
                          },
                          {
                            intent: "set_brightness",
                            domain: "light",
                            service: "turn_on",
                            dataTemplate: {
                              brightness_pct: "{{value}}",
                            },
                            riskTier: "side_effect",
                            requiresConfirmation: true,
                          },
                        ],
                      },
                      {
                        id: "hue-evening-scene",
                        entityId: "scene.hue_evening",
                        kind: "scene",
                        aliases: ["hue evening scene"],
                        externalIds: {
                          hueSceneId: "scene-1",
                        },
                        capabilities: [
                          {
                            intent: "activate",
                            domain: "scene",
                            service: "turn_on",
                            riskTier: "side_effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            hue: {
              enabled: true,
              config: {
                baseUrl: "http://hue-bridge.local",
                applicationKey: "app-key",
                defaultTransitionMs: 800,
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
      registerTool(tool: RegisteredTool) {
        tools.set(tool.name, tool);
      },
      registerHttpRoute() {},
      registerGatewayMethod() {},
      registerService() {},
    },
  };
}

test("register exposes multi-ecosystem capability tools", () => {
  const { api, tools } = buildApi();

  register(api as any);

  assert.equal(tools.has("home_list_capabilities"), true);
  assert.equal(tools.has("home_execute_intent"), true);
});

test("home_list_capabilities surfaces compatibility metadata for future direct adapters", async () => {
  const { api, tools } = buildApi();
  register(api as any);

  const tool = tools.get("home_list_capabilities");
  assert.ok(tool);

  const result = await tool.execute("req-2", { vendor: "hue" });
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.capabilities[0]?.connectionMode, "bridge");
  assert.equal(payload.capabilities[0]?.directAdapter, "hue-local");
  assert.deepEqual(payload.capabilities[0]?.externalIds, {
    hueLightId: "7",
  });
});

test("home_execute_intent routes configured Xiaomi aliases through Home Assistant", async () => {
  const { api, tools } = buildApi();
  register(api as any);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) =>
    new Response(JSON.stringify({ ok: true, forwarded: init?.body ? JSON.parse(String(init.body)) : null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const tool = tools.get("home_execute_intent");
    assert.ok(tool);

    const result = await tool.execute("req-1", {
      alias: "xiaomi fan",
      intent: "turn_on",
      confirmed: true,
    });

    const payload = JSON.parse(result.content[0]?.text ?? "{}");
    assert.deepEqual(payload.serviceCall, {
      domain: "fan",
      service: "turn_on",
      data: {
        entity_id: "fan.mi_bedroom",
      },
    });
    assert.deepEqual(payload.result, {
      ok: true,
      forwarded: {
        entity_id: "fan.mi_bedroom",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("home_execute_intent routes configured Hue aliases through the direct adapter in auto mode", async () => {
  const { api, tools } = buildApi();
  register(api as any);

  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(input)}`);
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const tool = tools.get("home_execute_intent");
    assert.ok(tool);

    const result = await tool.execute("req-3", {
      alias: "hue light",
      intent: "turn_on",
      route: "auto",
      confirmed: true,
    });

    const payload = JSON.parse(result.content[0]?.text ?? "{}");
    assert.equal(payload.dispatch.executed, "direct_adapter");
    assert.equal(payload.dispatch.directAdapter, "hue-local");
    assert.equal(calls[0], "PUT http://hue-bridge.local/clip/v2/resource/light/7");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("home_execute_intent falls back to Home Assistant in auto mode when Hue direct config is disabled", async () => {
  const { api, tools } = buildApi();
  api.config.plugins.entries.hue.enabled = false;
  register(api as any);

  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${String(input)}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const tool = tools.get("home_execute_intent");
    assert.ok(tool);

    const result = await tool.execute("req-4", {
      alias: "hue light",
      intent: "turn_on",
      route: "auto",
      confirmed: true,
    });

    const payload = JSON.parse(result.content[0]?.text ?? "{}");
    assert.equal(payload.dispatch.executed, "home_assistant");
    assert.equal(payload.dispatch.fallback, true);
    assert.equal(calls[0], "POST http://homeassistant:8123/api/services/light/turn_on");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("home_execute_intent rejects explicit direct adapter mode when no supported direct route exists", async () => {
  const { api, tools } = buildApi();
  register(api as any);

  const tool = tools.get("home_execute_intent");
  assert.ok(tool);

  await assert.rejects(
    () =>
      tool.execute("req-5", {
        alias: "xiaomi fan",
        intent: "turn_on",
        route: "direct_adapter",
        confirmed: true,
      }),
    /direct adapter/i,
  );
});
