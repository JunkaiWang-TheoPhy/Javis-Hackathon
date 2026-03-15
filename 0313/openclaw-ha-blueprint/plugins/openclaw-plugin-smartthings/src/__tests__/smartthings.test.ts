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
