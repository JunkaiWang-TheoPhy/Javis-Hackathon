#!/usr/bin/env node

const http = require("node:http");

const ORIGIN_HOST = process.env.ORIGIN_HOST || "127.0.0.1";
const ORIGIN_PORT = Number(process.env.ORIGIN_PORT || "18789");
const LISTEN_HOST = process.env.LISTEN_HOST || "127.0.0.1";
const LISTEN_PORT = Number(process.env.LISTEN_PORT || "19190");

const ALLOWED_PATHS = new Set([
  "/metis/agent/api/sse",
  "/metis/agent/api/health",
]);

function log(message) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const remoteAddress = req.socket.remoteAddress || "-";

  if (!ALLOWED_PATHS.has(url.pathname)) {
    log(`${remoteAddress} ${req.method} ${url.pathname} blocked`);
    writeJson(res, 404, { ok: false, error: "not_found" });
    return;
  }

  const headers = { ...req.headers };
  headers.host = `${ORIGIN_HOST}:${ORIGIN_PORT}`;

  const forwardedFor = req.headers["x-forwarded-for"];
  headers["x-forwarded-for"] = forwardedFor
    ? `${forwardedFor}, ${remoteAddress}`
    : remoteAddress;
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-host"] = req.headers.host || "";

  const upstream = http.request(
    {
      host: ORIGIN_HOST,
      port: ORIGIN_PORT,
      path: `${url.pathname}${url.search}`,
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      const responseHeaders = { ...upstreamRes.headers };
      delete responseHeaders["content-length"];

      res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
      upstreamRes.pipe(res);
      log(`${remoteAddress} ${req.method} ${url.pathname} -> ${upstreamRes.statusCode || 502}`);
    }
  );

  upstream.setTimeout(0);

  upstream.on("error", (error) => {
    log(`${remoteAddress} ${req.method} ${url.pathname} upstream_error=${error.message}`);
    if (!res.headersSent) {
      writeJson(res, 502, { ok: false, error: "bad_gateway" });
    } else {
      res.destroy(error);
    }
  });

  req.on("aborted", () => upstream.destroy());
  res.on("close", () => {
    if (!upstream.destroyed) {
      upstream.destroy();
    }
  });

  req.pipe(upstream);
});

server.requestTimeout = 0;
server.timeout = 0;
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  log(`listening on http://${LISTEN_HOST}:${LISTEN_PORT} -> http://${ORIGIN_HOST}:${ORIGIN_PORT}`);
});
