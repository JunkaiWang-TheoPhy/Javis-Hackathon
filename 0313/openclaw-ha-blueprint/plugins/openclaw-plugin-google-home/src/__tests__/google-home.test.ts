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
  assert.equal(tools.has("google_home_auth_status"), true);
  assert.equal(tools.has("google_home_build_auth_url"), true);
  assert.equal(tools.has("google_home_token_summary"), true);
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

test("google_home_status reports oauth_connected when the auth gateway has a stored token", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              projectId: "demo-project",
              authGatewayBaseUrl: "http://auth-gateway.local",
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
        ok: true,
        provider: "google-home",
        connected: true,
        hasAccessToken: true,
        hasRefreshToken: true,
        expiresAt: "2030-03-15T00:00:00.000Z",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const statusTool = tools.get("google_home_status");
    assert.ok(statusTool);

    const result = await statusTool.execute("req-4", {});
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.authMode, "oauth_connected");
    assert.equal(payload.hasAccessToken, true);
    assert.equal(payload.authGatewayBaseUrl, "http://auth-gateway.local");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("google_home_build_auth_url delegates to the auth gateway", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              authGatewayBaseUrl: "http://auth-gateway.local",
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
    assert.equal(String(input), "http://auth-gateway.local/v1/google-home/oauth/start");
    return new Response(
      JSON.stringify({
        ok: true,
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=test-state",
        state: "test-state",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const tool = tools.get("google_home_build_auth_url");
    assert.ok(tool);

    const result = await tool.execute("req-5", {});
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.state, "test-state");
    assert.match(payload.authUrl, /accounts\.google\.com/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("google_home_token_summary surfaces sanitized token metadata from the auth gateway", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          "google-home": {
            config: {
              authGatewayBaseUrl: "http://auth-gateway.local",
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
        ok: true,
        provider: "google-home",
        connected: true,
        expiresAt: "2030-03-15T00:00:00.000Z",
        scope: "homegraph",
        tokenType: "Bearer",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const tool = tools.get("google_home_token_summary");
    assert.ok(tool);

    const result = await tool.execute("req-6", {});
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.connected, true);
    assert.equal(payload.scope, "homegraph");
    assert.equal(payload.tokenType, "Bearer");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
