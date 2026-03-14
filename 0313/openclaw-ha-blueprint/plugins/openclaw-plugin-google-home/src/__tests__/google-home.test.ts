import assert from "node:assert/strict";
import test from "node:test";

import register from "../index.ts";

test("register exposes google home readiness tools", () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              projectId: "demo-project",
              clientId: "client-id",
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

  assert.equal(tools.has("google_home_status"), true);
  assert.equal(tools.has("google_home_config_summary"), true);
  assert.equal(tools.has("google_home_validate_config"), true);
  assert.equal(tools.has("google_home_oauth_checklist"), true);
});

test("google_home_status reports auth is still required for live control", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              projectId: "demo-project",
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

  const statusTool = tools.get("google_home_status");
  assert.ok(statusTool);

  const result = await statusTool.execute("req-1", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.controlReady, false);
  assert.equal(payload.authMode, "oauth_required");
});

test("google_home_validate_config reports missing auth and platform prerequisites", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              projectId: "demo-project",
              homeApiEnabled: false,
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

  const validateTool = tools.get("google_home_validate_config");
  assert.ok(validateTool);

  const result = await validateTool.execute("req-2", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.ready, false);
  assert.deepEqual(payload.missing, [
    "clientId",
    "clientSecret",
    "redirectUri",
    "projectNumber",
    "platforms",
    "homeApiEnabled",
  ]);
});

test("google_home_oauth_checklist marks configured steps as complete", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              projectId: "demo-project",
              projectNumber: "1234567890",
              clientId: "client-id",
              clientSecret: "client-secret",
              redirectUri: "https://example.com/callback",
              homeApiEnabled: true,
              platforms: ["ios", "web"],
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

  const checklistTool = tools.get("google_home_oauth_checklist");
  assert.ok(checklistTool);

  const result = await checklistTool.execute("req-3", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.ready, true);
  assert.equal(payload.steps.every((step: { done: boolean }) => step.done), true);
});
