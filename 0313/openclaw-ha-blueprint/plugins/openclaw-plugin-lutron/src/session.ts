import { readFile as readFileFs } from "node:fs/promises";
import { connect as tlsConnect, type ConnectionOptions, type TLSSocket } from "node:tls";

export type LutronSessionConfig = {
  bridgeHost?: string;
  bridgeId?: string;
  keyFile?: string;
  certFile?: string;
  caCertFile?: string;
  port?: number;
  servername?: string;
  connectTimeoutMs?: number;
};

type SessionDeps = {
  readFile: (path: string) => Promise<string | Buffer>;
  connect: (options: ConnectionOptions) => TLSSocketLike;
};

type TLSSocketLike = Pick<
  TLSSocket,
  | "authorized"
  | "authorizationError"
  | "remoteAddress"
  | "remotePort"
  | "alpnProtocol"
  | "getPeerCertificate"
  | "end"
  | "once"
  | "removeListener"
>;

let testDeps: SessionDeps | null = null;

function getDeps(): SessionDeps {
  return testDeps ?? {
    readFile: (path: string) => readFileFs(path),
    connect: (options: ConnectionOptions) => tlsConnect(options),
  };
}

export function setLutronSessionDepsForTests(deps: SessionDeps | null) {
  testDeps = deps;
}

export function buildSessionChecklist(cfg: LutronSessionConfig) {
  const steps = [
    { id: "bridgeHost", label: "Lutron bridge host is set", done: Boolean(cfg.bridgeHost) },
    { id: "keyFile", label: "LEAP client key file is set", done: Boolean(cfg.keyFile) },
    { id: "certFile", label: "LEAP client certificate file is set", done: Boolean(cfg.certFile) },
    { id: "caCertFile", label: "LEAP CA certificate file is set", done: Boolean(cfg.caCertFile) },
  ];

  return {
    ready: steps.every((step) => step.done),
    missing: steps.filter((step) => !step.done).map((step) => step.id),
    steps,
  };
}

export async function testLocalBridgeSession(cfg: LutronSessionConfig) {
  const checklist = buildSessionChecklist(cfg);
  if (!checklist.ready) {
    throw new Error(`Lutron session config is incomplete: ${checklist.missing.join(", ")}`);
  }

  const deps = getDeps();
  const [key, cert, ca] = await Promise.all([
    deps.readFile(String(cfg.keyFile)),
    deps.readFile(String(cfg.certFile)),
    deps.readFile(String(cfg.caCertFile)),
  ]);

  const host = String(cfg.bridgeHost);
  const port = cfg.port ?? 8081;
  const connectTimeoutMs = cfg.connectTimeoutMs ?? 5000;
  const servername = cfg.servername ?? host;

  return new Promise<{
    connected: true;
    authorized: boolean;
    authorizationError: string | null;
    remoteAddress: string | undefined;
    remotePort: number | undefined;
    alpnProtocol: string | false | undefined;
    peerCertificate: Record<string, unknown>;
  }>((resolve, reject) => {
    const socket = deps.connect({
      host,
      port,
      servername,
      key,
      cert,
      ca,
      rejectUnauthorized: true,
    });

    const finish = (handler: () => void) => {
      clearTimeout(timer);
      socket.removeListener("secureConnect", onSecureConnect);
      socket.removeListener("error", onError);
      handler();
    };

    const onError = (error: Error) => {
      finish(() => reject(error));
    };

    const onSecureConnect = () => {
      finish(() =>
        resolve({
          connected: true,
          authorized: Boolean(socket.authorized),
          authorizationError: socket.authorizationError
            ? String(socket.authorizationError)
            : null,
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          alpnProtocol: socket.alpnProtocol,
          peerCertificate: (socket.getPeerCertificate?.() as Record<string, unknown>) ?? {},
        }),
      );
      socket.end();
    };

    const timer = setTimeout(() => {
      finish(() => reject(new Error(`Lutron session timed out after ${connectTimeoutMs}ms`)));
      socket.end();
    }, connectTimeoutMs);

    socket.once("secureConnect", onSecureConnect);
    socket.once("error", onError);
  });
}
