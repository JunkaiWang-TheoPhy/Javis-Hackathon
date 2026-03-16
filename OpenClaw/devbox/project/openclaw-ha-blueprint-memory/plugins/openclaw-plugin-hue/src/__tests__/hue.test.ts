import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHueResources,
  HueBridgeClient,
  normalizeHueBaseUrl,
} from "../client.ts";
import register from "../index.ts";

test("normalizeHueBaseUrl appends clip v2 and trims trailing slashes", () => {
  assert.equal(normalizeHueBaseUrl("http://bridge.local"), "http://bridge.local/clip/v2");
  assert.equal(
    normalizeHueBaseUrl("http://bridge.local/clip/v2/"),
    "http://bridge.local/clip/v2",
  );
});

test("extractHueResources keeps only the requested resource type", () => {
  const resources = extractHueResources(
    {
      data: [
        { id: "1", type: "light" },
        { id: "2", type: "scene" },
      ],
    },
    "light",
  );

  assert.deepEqual(resources, [{ id: "1", type: "light" }]);
});

test("HueBridgeClient lists lights from the Hue bridge API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [
          {
            id: "light-1",
            type: "light",
            metadata: { name: "Desk Lamp" },
            on: { on: true },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const client = new HueBridgeClient({
      baseUrl: "http://bridge.local",
      applicationKey: "app-key",
    });
    const lights = await client.listLights();
    assert.equal(lights[0]?.metadata?.name, "Desk Lamp");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HueBridgeClient lists scenes and updates light state payloads", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string; body: string | null }> = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? String(init.body) : null,
    });

    if (String(input).endsWith("/resource/scene")) {
      return new Response(
        JSON.stringify({
          data: [{ id: "scene-1", type: "scene", metadata: { name: "Movie Time" } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const client = new HueBridgeClient({
      baseUrl: "http://bridge.local",
      applicationKey: "app-key",
    });

    const scenes = await client.listScenes();
    await client.setLightState("light-1", { power: "on", brightness: 55, transitionMs: 750 });
    await client.activateScene("scene-1", 1200);

    assert.equal(scenes[0]?.metadata?.name, "Movie Time");
    assert.equal(calls[0]?.url, "http://bridge.local/clip/v2/resource/scene");
    assert.equal(calls[1]?.method, "PUT");
    assert.equal(calls[1]?.url, "http://bridge.local/clip/v2/resource/light/light-1");
    assert.deepEqual(JSON.parse(calls[1]?.body ?? "{}"), {
      on: { on: true },
      dimming: { brightness: 55 },
      dynamics: { duration: 750 },
    });
    assert.equal(calls[2]?.url, "http://bridge.local/clip/v2/resource/scene/scene-1");
    assert.deepEqual(JSON.parse(calls[2]?.body ?? "{}"), {
      recall: { action: "active", duration: 1200 },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("register exposes hue status and light listing tools", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          hue: {
            config: {
              baseUrl: "http://bridge.local",
              applicationKey: "app-key",
            },
          },
        },
      },
    },
    logger: { info() {}, warn() {}, error() {} },
    registerTool(tool: any) {
      tools.set(tool.name, tool);
    },
    registerGatewayMethod() {},
  } as any);

  assert.equal(tools.has("hue_status"), true);
  assert.equal(tools.has("hue_list_lights"), true);
  assert.equal(tools.has("hue_list_scenes"), true);
  assert.equal(tools.has("hue_control_light"), true);
  assert.equal(tools.has("hue_activate_scene"), true);
});
