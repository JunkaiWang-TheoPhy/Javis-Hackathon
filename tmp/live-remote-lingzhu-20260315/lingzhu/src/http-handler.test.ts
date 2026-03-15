import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import type { LingzhuConfig } from "./types.js";
import { createHttpHandler } from "./http-handler.js";

class MockRequest extends Readable {
  url = "/metis/agent/api/sse";
  method = "POST";
  headers: Record<string, string>;

  constructor(body: string, authAk: string) {
    super();
    this.headers = {
      authorization: `Bearer ${authAk}`,
      "content-type": "application/json",
    };
    this.push(body);
    this.push(null);
  }

  _read(): void {}
}

class MockResponse extends EventEmitter {
  statusCode = 200;
  headers = new Map<string, string>();
  writableEnded = false;
  destroyed = false;
  chunks: string[] = [];

  setHeader(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  flushHeaders(): void {}

  write(chunk: string): boolean {
    this.chunks.push(String(chunk));
    return true;
  }

  end(chunk?: string): void {
    if (chunk) {
      this.chunks.push(String(chunk));
    }
    this.writableEnded = true;
    this.emit("finish");
  }
}

function createSseResponse(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: null }] })}\n\n`
        )
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

function createRuntimeState(authAk: string, configOverrides: Partial<LingzhuConfig> = {}) {
  const config: LingzhuConfig = {
    enabled: true,
    authAk,
    agentId: "main",
    includeMetadata: true,
    requestTimeoutMs: 60000,
    systemPrompt: "",
    defaultNavigationMode: "0",
    enableFollowUp: false,
    followUpMaxCount: 0,
    maxImageBytes: 5 * 1024 * 1024,
    sessionMode: "per_user",
    sessionNamespace: "lingzhu",
    debugLogging: false,
    debugLogPayloads: false,
    debugLogDir: "",
    enableExperimentalNativeActions: false,
    ...configOverrides,
  };

  return {
    config,
    authAk,
    gatewayPort: 18789,
    chatCompletionsEnabled: true,
  };
}

test("Lingzhu bridge preserves image parts when forwarding to OpenClaw", async () => {
  const authAk = "test-ak";
  let capturedRequestBody: any;
  const originalFetch = global.fetch;

  global.fetch = async (_url, init) => {
    capturedRequestBody = JSON.parse(String(init?.body ?? "{}"));
    return createSseResponse("ok");
  };

  try {
    const handler = createHttpHandler(
      {
        logger: {
          info() {},
          warn() {},
        },
        config: {
          gateway: {
            port: 18789,
            auth: {
              token: "gateway-token",
            },
          },
        },
      },
      () => ({
        ...createRuntimeState(authAk),
      })
    );

    const payload = {
      message_id: "test-image-forward",
      agent_id: "main",
      user_id: "codex-test",
      message: [
        {
          role: "user",
          type: "text",
          text: "Describe the image in one short sentence.",
        },
        {
          role: "user",
          type: "image",
          image_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0dcAAAAASUVORK5CYII=",
        },
      ],
    };

    const req = new MockRequest(JSON.stringify(payload), authAk) as any;
    const res = new MockResponse() as any;

    const handled = await handler(req, res);

    assert.equal(handled, true);
    assert.ok(capturedRequestBody);
    assert.ok(Array.isArray(capturedRequestBody.messages));
    assert.ok(
      capturedRequestBody.messages.some(
        (message: any) =>
          Array.isArray(message.content)
          && message.content.some(
            (part: any) => part.type === "image_url" && typeof part.image_url?.url === "string"
          )
      ),
      "expected forwarded OpenClaw request to keep an image_url content part"
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("Lingzhu bridge injects retrieved memory context before forwarding to OpenClaw", async () => {
  const authAk = "test-ak";
  let capturedMemoryRequestBody: any;
  let capturedOpenClawRequestBody: any;
  const originalFetch = global.fetch;

  global.fetch = async (url, init) => {
    if (String(url) === "http://127.0.0.1:3301/v1/memory/context") {
      capturedMemoryRequestBody = JSON.parse(String(init?.body ?? "{}"));
      return new Response(
        JSON.stringify({
          ok: true,
          prompt: "## Working Memory\n- 用户晚上想安静一点\n\n## Long-Term Memory\n- 用户不喜欢晚上被突然提醒",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    }

    capturedOpenClawRequestBody = JSON.parse(String(init?.body ?? "{}"));
    return createSseResponse("收到。");
  };

  try {
    const handler = createHttpHandler(
      {
        logger: {
          info() {},
          warn() {},
        },
        config: {
          gateway: {
            port: 18789,
            auth: {
              token: "gateway-token",
            },
          },
        },
      },
      () => ({
        ...createRuntimeState(authAk, {
          memoryContextEnabled: true,
          memoryContextUrl: "http://127.0.0.1:3301/v1/memory/context",
          memoryContextAudience: "auto",
          memoryContextWorkingLimit: 3,
          memoryContextFactLimit: 2,
        }),
      })
    );

    const payload = {
      message_id: "test-memory-context",
      agent_id: "main",
      user_id: "codex-test",
      message: [
        {
          role: "user",
          type: "text",
          text: "记住我晚上想安静一点。",
        },
      ],
    };

    const req = new MockRequest(JSON.stringify(payload), authAk) as any;
    const res = new MockResponse() as any;

    const handled = await handler(req, res);

    assert.equal(handled, true);
    assert.deepEqual(capturedMemoryRequestBody, {
      audience: "direct",
      sessionId: "agent:main:lingzhu_codex-test",
      queryText: "记住我晚上想安静一点。",
      workingLimit: 3,
      factLimit: 2,
    });
    assert.ok(Array.isArray(capturedOpenClawRequestBody?.messages));
    assert.ok(
      capturedOpenClawRequestBody.messages.some(
        (message: any) =>
          message.role === "system"
          && typeof message.content === "string"
          && message.content.includes("Long-Term Memory")
          && message.content.includes("用户不喜欢晚上被突然提醒")
      ),
      "expected forwarded OpenClaw request to include memory context as a system message"
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("Lingzhu bridge falls back when the memory context endpoint is unavailable", async () => {
  const authAk = "test-ak";
  let capturedOpenClawRequestBody: any;
  let memoryRequestCount = 0;
  const originalFetch = global.fetch;

  global.fetch = async (url, init) => {
    if (String(url) === "http://127.0.0.1:3301/v1/memory/context") {
      memoryRequestCount += 1;
      return new Response("upstream unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      });
    }

    capturedOpenClawRequestBody = JSON.parse(String(init?.body ?? "{}"));
    return createSseResponse("继续回答。");
  };

  try {
    const handler = createHttpHandler(
      {
        logger: {
          info() {},
          warn() {},
        },
        config: {
          gateway: {
            port: 18789,
            auth: {
              token: "gateway-token",
            },
          },
        },
      },
      () => ({
        ...createRuntimeState(authAk, {
          memoryContextEnabled: true,
          memoryContextUrl: "http://127.0.0.1:3301/v1/memory/context",
        }),
      })
    );

    const payload = {
      message_id: "test-memory-fallback",
      agent_id: "main",
      user_id: "codex-test",
      message: [
        {
          role: "user",
          type: "text",
          text: "今天我有点累。",
        },
      ],
    };

    const req = new MockRequest(JSON.stringify(payload), authAk) as any;
    const res = new MockResponse() as any;

    const handled = await handler(req, res);

    assert.equal(handled, true);
    assert.equal(memoryRequestCount, 1);
    assert.ok(Array.isArray(capturedOpenClawRequestBody?.messages));
    assert.equal(
      capturedOpenClawRequestBody.messages.some(
        (message: any) =>
          message.role === "system"
          && typeof message.content === "string"
          && message.content.includes("Long-Term Memory")
      ),
      false
    );
  } finally {
    global.fetch = originalFetch;
  }
});
