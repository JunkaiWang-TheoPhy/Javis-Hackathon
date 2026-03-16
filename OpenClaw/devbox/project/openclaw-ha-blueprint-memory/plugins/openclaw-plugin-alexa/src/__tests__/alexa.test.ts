import assert from "node:assert/strict";
import test from "node:test";

import register from "../index.ts";

test("register exposes alexa readiness tools", () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          alexa: {
            config: {
              skillId: "skill-1",
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

  assert.equal(tools.has("alexa_status"), true);
  assert.equal(tools.has("alexa_skill_config_summary"), true);
  assert.equal(tools.has("alexa_account_linking_checklist"), true);
});

test("alexa_account_linking_checklist reports missing prerequisites", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          alexa: {
            config: {
              skillId: "skill-1",
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

  const tool = tools.get("alexa_account_linking_checklist");
  assert.ok(tool);

  const result = await tool.execute("req-1", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.ready, false);
  assert.deepEqual(payload.missing, [
    "clientId",
    "clientSecret",
    "redirectUri",
    "accountLinkingEnabled",
  ]);
});
