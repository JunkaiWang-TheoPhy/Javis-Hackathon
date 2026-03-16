import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { createAuthGatewayServer } from "../server.ts";

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length > 0) {
    const close = closers.pop();
    if (close) {
      await close();
    }
  }
});

test("GET /v1/google-home/oauth/start returns a Google auth URL and state", async () => {
  const server = createAuthGatewayServer({
    google: {
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectUri: "https://example.com/google/callback",
      authorizationBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "homegraph",
    },
    tokenStorePath: "/tmp/openclaw-google-token-test.json",
    stateGenerator: () => "fixed-state",
    exchangeCode: async () => ({
      provider: "google-home",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      scope: "homegraph",
      expiresAt: "2030-03-15T00:00:00.000Z",
    }),
  });
  await server.listen(0);
  closers.push(() => server.close());

  const response = await fetch(`${server.baseUrl}/v1/google-home/oauth/start`);
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.state, "fixed-state");
  assert.match(payload.authUrl, /accounts\.google\.com/);
  assert.match(payload.authUrl, /client_id=client-id/);
});

test("GET /v1/google-home/oauth/callback exchanges code and persists token status", async () => {
  const server = createAuthGatewayServer({
    google: {
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectUri: "https://example.com/google/callback",
      authorizationBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "homegraph",
    },
    tokenStorePath: "/tmp/openclaw-google-token-test.json",
    stateGenerator: () => "fixed-state",
    exchangeCode: async (code) => {
      assert.equal(code, "demo-code");
      return {
        provider: "google-home",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Bearer",
        scope: "homegraph",
        expiresAt: "2030-03-15T00:00:00.000Z",
      };
    },
  });
  await server.listen(0);
  closers.push(() => server.close());

  await fetch(`${server.baseUrl}/v1/google-home/oauth/start`);

  const callback = await fetch(
    `${server.baseUrl}/v1/google-home/oauth/callback?code=demo-code&state=fixed-state`,
  );
  assert.equal(callback.status, 200);

  const statusResponse = await fetch(`${server.baseUrl}/v1/google-home/auth/status`);
  const statusPayload = await statusResponse.json();

  assert.equal(statusPayload.connected, true);
  assert.equal(statusPayload.hasRefreshToken, true);
  assert.equal(statusPayload.provider, "google-home");
});

