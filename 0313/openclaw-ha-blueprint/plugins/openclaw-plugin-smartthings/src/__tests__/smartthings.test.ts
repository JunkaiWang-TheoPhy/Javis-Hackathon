import assert from "node:assert/strict";
import test from "node:test";

import register from "../index.ts";

test("register exposes smartthings readiness tools", () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          smartthings: {
            config: {
              personalAccessToken: "pat",
              locationId: "location-1",
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

  assert.equal(tools.has("smartthings_status"), true);
  assert.equal(tools.has("smartthings_config_summary"), true);
  assert.equal(tools.has("smartthings_validate_config"), true);
  assert.equal(tools.has("smartthings_list_devices"), true);
  assert.equal(tools.has("smartthings_get_device_status"), true);
  assert.equal(tools.has("smartthings_execute_command"), true);
});

test("smartthings_validate_config reports missing cloud prerequisites", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          smartthings: {
            config: {
              locationId: "location-1",
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

  const validateTool = tools.get("smartthings_validate_config");
  assert.ok(validateTool);

  const result = await validateTool.execute("req-1", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.ready, false);
  assert.deepEqual(payload.missing, ["personalAccessToken"]);
});

test("smartthings_list_devices returns devices from the SmartThings API", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          smartthings: {
            config: {
              personalAccessToken: "pat",
              baseUrl: "https://api.smartthings.com",
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

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) =>
    new Response(
      JSON.stringify({
        items: [{ deviceId: "device-1", label: "Bedroom Lamp" }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const tool = tools.get("smartthings_list_devices");
    assert.ok(tool);

    const result = await tool.execute("req-2", {});
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.devices[0]?.deviceId, "device-1");
    assert.equal(payload.devices[0]?.label, "Bedroom Lamp");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("smartthings_get_device_status returns the device status payload", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          smartthings: {
            config: {
              personalAccessToken: "pat",
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

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    assert.equal(String(input), "https://api.smartthings.com/v1/devices/device-1/status");
    return new Response(
      JSON.stringify({
        components: { main: { switch: { switch: { value: "on" } } } },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const tool = tools.get("smartthings_get_device_status");
    assert.ok(tool);

    const result = await tool.execute("req-3", { deviceId: "device-1" });
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.deviceId, "device-1");
    assert.equal(payload.status.components.main.switch.switch.value, "on");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("smartthings_execute_command posts a minimal command to the SmartThings API", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          smartthings: {
            config: {
              personalAccessToken: "pat",
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

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    assert.deepEqual(body, {
      commands: [
        {
          component: "main",
          capability: "switch",
          command: "on",
          arguments: [],
        },
      ],
    });

    return new Response(JSON.stringify({ results: [{ id: "cmd-1", status: "ACCEPTED" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const tool = tools.get("smartthings_execute_command");
    assert.ok(tool);

    const result = await tool.execute("req-4", {
      deviceId: "device-1",
      capability: "switch",
      command: "on",
    });
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.deviceId, "device-1");
    assert.equal(payload.results[0]?.status, "ACCEPTED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
