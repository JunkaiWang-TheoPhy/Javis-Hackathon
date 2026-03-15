import http from "node:http";
import { randomUUID } from "node:crypto";

import { loadTokenRecord, saveTokenRecord, type TokenRecord } from "./store/tokenStore.ts";

type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationBaseUrl: string;
  tokenUrl: string;
  scope: string;
};

type AuthGatewayOptions = {
  google?: Partial<GoogleAuthConfig>;
  tokenStorePath?: string;
  stateGenerator?: () => string;
  exchangeCode?: (code: string, config: GoogleAuthConfig) => Promise<TokenRecord>;
};

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function buildGoogleConfig(options: AuthGatewayOptions): GoogleAuthConfig | null {
  const fromEnv = {
    clientId: process.env.GOOGLE_HOME_CLIENT_ID,
    clientSecret: process.env.GOOGLE_HOME_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_HOME_REDIRECT_URI,
    authorizationBaseUrl:
      process.env.GOOGLE_HOME_AUTHORIZATION_BASE_URL ??
      "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl:
      process.env.GOOGLE_HOME_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
    scope: process.env.GOOGLE_HOME_SCOPE ?? "https://www.googleapis.com/auth/homegraph",
  };

  const cfg = {
    ...fromEnv,
    ...options.google,
  };

  if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
    return null;
  }

  return cfg as GoogleAuthConfig;
}

async function defaultExchangeCode(
  code: string,
  config: GoogleAuthConfig,
): Promise<TokenRecord> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const expiresIn = Number(payload.expires_in ?? 0);

  return {
    provider: "google-home",
    accessToken: String(payload.access_token ?? ""),
    refreshToken:
      typeof payload.refresh_token === "string" ? payload.refresh_token : undefined,
    tokenType: typeof payload.token_type === "string" ? payload.token_type : undefined,
    scope: typeof payload.scope === "string" ? payload.scope : config.scope,
    expiresAt:
      expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
  };
}

async function summarizeGoogleToken(tokenStorePath: string) {
  const token = await loadTokenRecord(tokenStorePath, "google-home");
  return {
    ok: true,
    provider: "google-home",
    connected: Boolean(token?.accessToken),
    hasAccessToken: Boolean(token?.accessToken),
    hasRefreshToken: Boolean(token?.refreshToken),
    tokenType: token?.tokenType ?? null,
    scope: token?.scope ?? null,
    expiresAt: token?.expiresAt ?? null,
  };
}

export function createAuthGatewayServer(options: AuthGatewayOptions = {}) {
  const tokenStorePath =
    options.tokenStorePath ??
    process.env.ECOSYSTEM_AUTH_TOKEN_STORE_PATH ??
    "/tmp/openclaw-ecosystem-auth-tokens.json";
  const google = buildGoogleConfig(options);
  const stateGenerator = options.stateGenerator ?? (() => randomUUID());
  const exchangeCode = options.exchangeCode ?? defaultExchangeCode;
  const pendingStates = new Set<string>();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/v1/health") {
        json(res, 200, { ok: true, service: "ecosystem-auth-gateway" });
        return;
      }

      if (req.method === "GET" && url.pathname === "/v1/google-home/auth/status") {
        if (!google) {
          json(res, 200, {
            ok: true,
            provider: "google-home",
            configured: false,
            connected: false,
            missing: ["clientId", "clientSecret", "redirectUri"],
          });
          return;
        }

        json(res, 200, {
          ...(await summarizeGoogleToken(tokenStorePath)),
          configured: true,
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/v1/google-home/token/summary") {
        json(res, 200, await summarizeGoogleToken(tokenStorePath));
        return;
      }

      if (req.method === "GET" && url.pathname === "/v1/google-home/oauth/start") {
        if (!google) {
          json(res, 400, {
            ok: false,
            provider: "google-home",
            error: "Google auth gateway is not configured.",
          });
          return;
        }

        const state = stateGenerator();
        pendingStates.add(state);
        const authUrl = new URL(google.authorizationBaseUrl);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", google.clientId);
        authUrl.searchParams.set("redirect_uri", google.redirectUri);
        authUrl.searchParams.set("scope", google.scope);
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");

        json(res, 200, {
          ok: true,
          provider: "google-home",
          state,
          authUrl: authUrl.toString(),
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/v1/google-home/oauth/callback") {
        if (!google) {
          json(res, 400, { ok: false, error: "Google auth gateway is not configured." });
          return;
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state || !pendingStates.has(state)) {
          json(res, 400, {
            ok: false,
            provider: "google-home",
            error: "Invalid OAuth callback state or code.",
          });
          return;
        }

        pendingStates.delete(state);
        const token = await exchangeCode(code, google);
        await saveTokenRecord(tokenStorePath, "google-home", token);

        json(res, 200, {
          ok: true,
          provider: "google-home",
          connected: true,
        });
        return;
      }

      json(res, 404, { ok: false, error: "not found" });
    } catch (error) {
      json(res, 500, {
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
  const port = Number(process.env.PORT ?? 3401);
  const gateway = createAuthGatewayServer();
  gateway.listen(port).then(() => {
    console.log(JSON.stringify({ ok: true, port, service: "ecosystem-auth-gateway" }));
  });
}
