import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  setLutronSessionDepsForTests,
  testLocalBridgeSession,
} from "../session.ts";
import register from "../index.ts";

test("register exposes lutron readiness tools", () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          lutron: {
            config: {
              systemType: "caseta",
              bridgeHost: "192.168.1.20",
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

  assert.equal(tools.has("lutron_status"), true);
  assert.equal(tools.has("lutron_config_summary"), true);
  assert.equal(tools.has("lutron_validate_config"), true);
  assert.equal(tools.has("lutron_test_session"), true);
});

test("lutron_validate_config reports missing LEAP certificate prerequisites", async () => {
  const tools = new Map<string, any>();
  register({
    config: {
      plugins: {
        entries: {
          lutron: {
            config: {
              systemType: "caseta",
              bridgeHost: "192.168.1.20",
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

  const validateTool = tools.get("lutron_validate_config");
  assert.ok(validateTool);

  const result = await validateTool.execute("req-1", {});
  const payload = JSON.parse(result.content[0]?.text ?? "{}");

  assert.equal(payload.ready, false);
  assert.deepEqual(payload.missing, ["keyFile", "certFile", "caCertFile"]);
});

test("testLocalBridgeSession builds a TLS session and reports peer certificate details", async () => {
  const socket = new EventEmitter() as EventEmitter & {
    authorized: boolean;
    authorizationError?: string | null;
    remoteAddress?: string;
    remotePort?: number;
    alpnProtocol?: string | false;
    getPeerCertificate: () => Record<string, unknown>;
    end: () => void;
  };
  socket.authorized = true;
  socket.authorizationError = null;
  socket.remoteAddress = "192.168.1.20";
  socket.remotePort = 8081;
  socket.alpnProtocol = false;
  socket.getPeerCertificate = () => ({
    subject: { CN: "lutron-bridge" },
    issuer: { CN: "lutron-ca" },
    valid_to: "Mar 15 23:59:59 2030 GMT",
    fingerprint256: "AA:BB",
  });
  socket.end = () => {};

  setLutronSessionDepsForTests({
    readFile: async (path: string) => `file:${path}`,
    connect: (options) => {
      process.nextTick(() => socket.emit("secureConnect"));
      assert.equal(options.host, "192.168.1.20");
      assert.equal(options.port, 8081);
      return socket as any;
    },
  });

  try {
    const result = await testLocalBridgeSession({
      bridgeHost: "192.168.1.20",
      keyFile: "/run/secrets/lutron.key",
      certFile: "/run/secrets/lutron.crt",
      caCertFile: "/run/secrets/lutron-ca.crt",
    });

    assert.equal(result.connected, true);
    assert.equal(result.peerCertificate.subject?.CN, "lutron-bridge");
    assert.equal(result.remotePort, 8081);
  } finally {
    setLutronSessionDepsForTests(null);
  }
});

test("lutron_test_session returns handshake details when the bridge session succeeds", async () => {
  const tools = new Map<string, any>();
  const socket = new EventEmitter() as EventEmitter & {
    authorized: boolean;
    authorizationError?: string | null;
    remoteAddress?: string;
    remotePort?: number;
    alpnProtocol?: string | false;
    getPeerCertificate: () => Record<string, unknown>;
    end: () => void;
  };
  socket.authorized = true;
  socket.authorizationError = null;
  socket.remoteAddress = "192.168.1.20";
  socket.remotePort = 8081;
  socket.alpnProtocol = false;
  socket.getPeerCertificate = () => ({
    subject: { CN: "lutron-bridge" },
    fingerprint256: "AA:BB",
  });
  socket.end = () => {};

  setLutronSessionDepsForTests({
    readFile: async () => "pem",
    connect: () => {
      process.nextTick(() => socket.emit("secureConnect"));
      return socket as any;
    },
  });

  try {
    register({
      config: {
        plugins: {
          entries: {
            lutron: {
              config: {
                systemType: "caseta",
                bridgeHost: "192.168.1.20",
                keyFile: "/run/secrets/lutron.key",
                certFile: "/run/secrets/lutron.crt",
                caCertFile: "/run/secrets/lutron-ca.crt",
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

    const sessionTool = tools.get("lutron_test_session");
    assert.ok(sessionTool);

    const result = await sessionTool.execute("req-2", {});
    const payload = JSON.parse(result.content[0]?.text ?? "{}");

    assert.equal(payload.connected, true);
    assert.equal(payload.peerCertificate.subject?.CN, "lutron-bridge");
  } finally {
    setLutronSessionDepsForTests(null);
  }
});
